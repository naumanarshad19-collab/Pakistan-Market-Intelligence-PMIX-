import https from 'https';
import http from 'http';
import * as xlsx from 'xlsx';
import { normalizeCommodityKey, resolveCommodityExact } from './commodities';
import { LOCATION_MASTER } from './locations';

export interface PbsCommoditySpiData {
  sr: number;
  raw_name: string;
  unit: string;
  current_price: number;
  prev_price: number;
  year_ago_price: number;
  weekly_pct: number;
  computed_weekly_pct: number;
  math_check_passed: boolean;
  yearly_pct: number;
  commodity_id: string | null;
  city_prices: Record<string, number>;
}

export interface PbsSpiReport {
  week_ended_date: string; // YYYY-MM-DD
  week_ended_formatted: string;
  prev_week_date?: string; // YYYY-MM-DD if parsed from sheet header
  year_ago_date?: string; // YYYY-MM-DD if parsed from sheet header
  published_date: string;
  spi_combined_index: number;
  spi_combined_wow_change: number;
  spi_combined_yoy_change: number;
  spi_q1_index: number;
  source_page_url: string;
  source_excel_url: string;
  annex_excel_url: string;
  annex_status: 'verified' | 'failed';
  annex_error?: string;
  annex_cities_verified: string[];
  unmapped_items: string[];
  duplicate_commodity_ids: string[];
  math_discrepancies: string[];
  total_items: number;
  total_city_observations: number;
  items: PbsCommoditySpiData[];
  extracted_at: string;
}

export interface DiscoveredPbsRelease {
  week_ended_date: string; // YYYY-MM-DD
  published_date?: string;
  title: string;
  source_page_url: string;
  source_excel_url?: string;
  annex_excel_url?: string;
}

export function fetchBuffer(url: string, maxRedirects = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error(`Too many redirects when fetching ${url}`));
    }

    const client = url.startsWith('https') ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: '*/*'
        }
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith('http')) {
            const parsed = new URL(url);
            redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
          }
          return resolve(fetchBuffer(redirectUrl, maxRedirects - 1));
        }

        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );

    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

export async function fetchText(url: string): Promise<string> {
  const buf = await fetchBuffer(url);
  return buf.toString('utf-8');
}

function parseDmyToIso(dmyStr: string): string | null {
  const match = dmyStr.match(/(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})/);
  if (!match) return null;
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const rawYear = match[3];
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const iso = `${year}-${month}-${day}`;
  const dt = new Date(`${iso}T00:00:00Z`);
  if (isNaN(dt.getTime())) return null;
  return iso;
}

function formatUtcLongDate(isoDate: string): string {
  const dt = new Date(`${isoDate}T00:00:00Z`);
  return dt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Dynamically discovers all available PBS SPI weekly releases via:
 * 1) PBS WordPress REST API (`wp-json/wp/v2/posts`)
 * 2) PBS Price Statistics portal page (`https://www.pbs.gov.pk/price-statistics/`)
 * Zero hardcoded Sept 17 URLs.
 */
export async function discoverPbsReleases(maxPages = 3): Promise<DiscoveredPbsRelease[]> {
  const byWeek = new Map<string, DiscoveredPbsRelease>();

  // 1. Discover via WordPress JSON API (handles paginated archive history)
  for (let page = 1; page <= maxPages; page++) {
    const apiUrl = `https://www.pbs.gov.pk/wp-json/wp/v2/posts?search=Sensitive+Price+Indicator&per_page=50&page=${page}`;
    try {
      const raw = await fetchText(apiUrl);
      const posts = JSON.parse(raw);
      if (!Array.isArray(posts) || posts.length === 0) break;

      for (const post of posts) {
        const title = String(post?.title?.rendered || '').replace(/<[^>]+>/g, '').trim();
        const link = String(post?.link || '').trim();
        if (!link || !/sensitive\s+price\s+indicator/i.test(title + ' ' + link)) continue;

        const dateMatch =
          link.match(/ended-on-(\d{1,2}-\d{1,2}-\d{4})/i) ||
          title.match(/ended\s+on\s+(\d{1,2}-\d{1,2}-\d{4})/i);
        if (!dateMatch) continue;

        const iso = parseDmyToIso(dateMatch[1]);
        if (!iso) continue;

        const pubIso = typeof post?.date === 'string' ? post.date.split('T')[0] : undefined;
        byWeek.set(iso, {
          week_ended_date: iso,
          published_date: pubIso ? formatUtcLongDate(pubIso) : undefined,
          title,
          source_page_url: link
        });
      }

      if (posts.length < 50) break;
    } catch (err: any) {
      if (page === 1) {
        throw new Error(`PBS WP-JSON discovery failed: ${err.message}`);
      }
      break;
    }
  }

  // 2. Also inspect https://www.pbs.gov.pk/price-statistics/ for direct latest XLSX uploads
  try {
    const portalUrl = 'https://www.pbs.gov.pk/price-statistics/';
    const html = await fetchText(portalUrl);
    const hrefMatches = [...html.matchAll(/href="([^"]+\.xlsx?)"/gi)].map((m) => m[1]);

    const spiByIso = new Map<string, string>();
    const annexByIso = new Map<string, string>();

    for (const rawHref of hrefMatches) {
      const fullUrl = rawHref.startsWith('http') ? rawHref : `https://www.pbs.gov.pk${rawHref}`;
      if (/spi-report/i.test(fullUrl)) {
        const dm = fullUrl.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
        if (dm) {
          const iso = parseDmyToIso(dm[1]);
          if (iso) spiByIso.set(iso, fullUrl);
        }
      } else if (/annex/i.test(fullUrl) && !/monthly/i.test(fullUrl)) {
        const dm = fullUrl.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
        if (dm) {
          const iso = parseDmyToIso(dm[1]);
          if (iso) annexByIso.set(iso, fullUrl);
        }
      }
    }

    for (const [iso, spiUrl] of spiByIso.entries()) {
      const existing = byWeek.get(iso);
      const annexUrl = annexByIso.get(iso);
      if (existing) {
        existing.source_excel_url = existing.source_excel_url || spiUrl;
        existing.annex_excel_url = existing.annex_excel_url || annexUrl;
      } else if (annexUrl) {
        byWeek.set(iso, {
          week_ended_date: iso,
          title: `Weekly Sensitive Price Indicator (SPI) for week ended ${iso}`,
          source_page_url: portalUrl,
          source_excel_url: spiUrl,
          annex_excel_url: annexUrl
        });
      }
    }
  } catch {
    // Non-fatal if portal page fails when WP-JSON already succeeded
  }

  const releases = Array.from(byWeek.values()).sort((a, b) =>
    b.week_ended_date.localeCompare(a.week_ended_date)
  );

  if (releases.length === 0) {
    throw new Error('Zero PBS SPI releases discovered from official PBS endpoints.');
  }

  return releases;
}

/**
 * Header-driven parser for a specific PBS SPI release.
 * Fails loudly if Excel links, summary headers, or item tables cannot be resolved.
 */
export async function scrapePbsRelease(release: DiscoveredPbsRelease): Promise<PbsSpiReport> {
  let spiReportUrl = release.source_excel_url || '';
  let annexUrl = release.annex_excel_url || '';

  // 1. Resolve Excel links from release page HTML if not already populated
  if (!spiReportUrl || !annexUrl) {
    const html = await fetchText(release.source_page_url);
    const excelMatches = [...html.matchAll(/href="([^"]+\.xlsx?)"/gi)].map((m) => m[1]);

    for (const rawHref of excelMatches) {
      const cleanUrl = rawHref.startsWith('http')
        ? rawHref
        : `https://www.pbs.gov.pk${rawHref}`;
      if (/spi-report/i.test(cleanUrl) && !spiReportUrl) {
        spiReportUrl = cleanUrl;
      } else if (/annex/i.test(cleanUrl) && !/monthly/i.test(cleanUrl) && !annexUrl) {
        annexUrl = cleanUrl;
      }
    }
  }

  if (!spiReportUrl) {
    throw new Error(`Missing SPI-Report Excel URL on release page: ${release.source_page_url}`);
  }
  if (!annexUrl) {
    throw new Error(`Missing Annex Excel URL on release page: ${release.source_page_url}`);
  }

  // 2. Download and parse SPI-Report-*.xlsx using header-driven column lookup
  const spiBuffer = await fetchBuffer(spiReportUrl);
  const spiWb = xlsx.read(spiBuffer, { type: 'buffer' });

  // --- Sheet 0 (Page 1): Quintile Summary ---
  const p1Sheet = spiWb.Sheets['Page 1'] || spiWb.Sheets[spiWb.SheetNames[0]];
  if (!p1Sheet) {
    throw new Error(`Missing Page 1 summary sheet in ${spiReportUrl}`);
  }
  const p1Rows = xlsx.utils.sheet_to_json<any[]>(p1Sheet, { header: 1 });

  let p1GroupCol = -1;
  let p1SpiCurCol = -1;
  let p1WowCol = -1;
  let p1YoyCol = -1;
  let p1HeaderRowIdx = -1;

  for (let i = 0; i < Math.min(p1Rows.length, 35); i++) {
    const row = p1Rows[i];
    if (!row) continue;
    const grpIdx = row.findIndex(
      (c) => typeof c === 'string' && /expenditure\s*group|quintile/i.test(c)
    );
    const spiIdx = row.findIndex(
      (c) => typeof c === 'string' && /spi\s*for\s*week\s*ended/i.test(c)
    );
    const pctIdx = row.findIndex(
      (c) => typeof c === 'string' && /%\s*change\s*over/i.test(c)
    );

    if (grpIdx !== -1 && spiIdx !== -1 && pctIdx !== -1) {
      p1HeaderRowIdx = i;
      p1GroupCol = grpIdx;
      p1SpiCurCol = spiIdx;
      p1WowCol = pctIdx;
      p1YoyCol = pctIdx + 1;
      break;
    }
  }

  if (p1HeaderRowIdx === -1) {
    throw new Error(`Header row not found in Page 1 summary sheet of ${spiReportUrl}`);
  }

  let combinedIndex: number | null = null;
  let wowChange: number | null = null;
  let combinedYoY: number | null = null;
  let q1Index: number | null = null;

  for (let i = p1HeaderRowIdx + 1; i < p1Rows.length; i++) {
    const row = p1Rows[i];
    if (!row) continue;
    const label = typeof row[p1GroupCol] === 'string' ? row[p1GroupCol].trim() : '';
    if (!label) continue;

    if (/^combined$/i.test(label)) {
      const idxVal = Number(row[p1SpiCurCol]);
      const wowVal = Number(row[p1WowCol]);
      const yoyVal = Number(row[p1YoyCol]);
      if (Number.isFinite(idxVal) && Number.isFinite(wowVal) && Number.isFinite(yoyVal)) {
        combinedIndex = Math.round(idxVal * 100) / 100;
        wowChange = Math.round(wowVal * 100) / 100;
        combinedYoY = Math.round(yoyVal * 100) / 100;
      }
    } else if (/^q1\b/i.test(label)) {
      const q1Val = Number(row[p1SpiCurCol]);
      if (Number.isFinite(q1Val)) {
        q1Index = Math.round(q1Val * 100) / 100;
      }
    }
  }

  if (combinedIndex === null || wowChange === null || combinedYoY === null || q1Index === null) {
    throw new Error(
      `Failed to parse Combined/Q1 summary metrics from Page 1 headers in ${spiReportUrl}`
    );
  }

  // --- Sheet 1 (Page 2): All 51 Essential Commodities ---
  const p2Sheet = spiWb.Sheets['Page 2'] || spiWb.Sheets[spiWb.SheetNames[1]];
  if (!p2Sheet) {
    throw new Error(`Missing Page 2 item breakdown sheet in ${spiReportUrl}`);
  }
  const p2Rows = xlsx.utils.sheet_to_json<any[]>(p2Sheet, { header: 1 });

  let p2HeaderIdx = -1;
  let srCol = -1;
  let itemCol = -1;
  let unitCol = -1;
  let curPriceCol = -1;
  let prevPriceCol = -1;
  let yearAgoPriceCol = -1;
  let itemWowCol = -1;
  let itemYoyCol = -1;

  for (let i = 0; i < Math.min(p2Rows.length, 20); i++) {
    const row = p2Rows[i];
    if (!row) continue;
    const sIdx = row.findIndex((c) => typeof c === 'string' && /^\s*sr\.?\s*$/i.test(c));
    const iIdx = row.findIndex((c) => typeof c === 'string' && /^\s*items?\s*$/i.test(c));
    const uIdx = row.findIndex((c) => typeof c === 'string' && /^\s*units?\s*$/i.test(c));
    const pIdx = row.findIndex((c) => typeof c === 'string' && /prices\s+in\s+rs/i.test(c));
    const cIdx = row.findIndex((c) => typeof c === 'string' && /%\s*change/i.test(c));

    if (sIdx !== -1 && iIdx !== -1 && uIdx !== -1 && pIdx !== -1 && cIdx !== -1) {
      p2HeaderIdx = i;
      srCol = sIdx;
      itemCol = iIdx;
      unitCol = uIdx;
      curPriceCol = pIdx;
      prevPriceCol = pIdx + 1;
      yearAgoPriceCol = pIdx + 2;
      itemWowCol = cIdx;
      itemYoyCol = cIdx + 1;
      break;
    }
  }

  if (p2HeaderIdx === -1) {
    throw new Error(`Header row (Sr./Items/Units/Prices/%change) not found in Page 2 of ${spiReportUrl}`);
  }

  // Extract prev_week_date & year_ago_date from Page 2 prices header if present
  let prevWeekDateIso: string | undefined;
  let yearAgoDateIso: string | undefined;
  const priceHeaderText = String(p2Rows[p2HeaderIdx][curPriceCol] || '');
  const headerDates = [...priceHeaderText.matchAll(/\d{1,2}\.\d{1,2}\.\d{2,4}/g)].map((m) =>
    parseDmyToIso(m[0])
  );
  if (headerDates[1]) prevWeekDateIso = headerDates[1];
  if (headerDates[2]) yearAgoDateIso = headerDates[2];

  const itemsMap = new Map<string, PbsCommoditySpiData>();
  const seenCommodityIds = new Set<string>();
  const unmappedItems: string[] = [];
  const duplicateCommodityIds: string[] = [];
  const mathDiscrepancies: string[] = [];

  for (let i = p2HeaderIdx + 1; i < p2Rows.length; i++) {
    const r = p2Rows[i];
    if (!r) continue;
    const srVal = r[srCol];
    const nameVal = r[itemCol];
    if (typeof srVal !== 'number' || !Number.isInteger(srVal) || typeof nameVal !== 'string') {
      continue;
    }

    const rawName = nameVal.trim();
    if (!rawName) continue;

    const unit = String(r[unitCol] || '').trim();
    const currentPrice = Number(r[curPriceCol]);
    const prevPrice = Number(r[prevPriceCol]);
    const yearAgoPrice = Number(r[yearAgoPriceCol]);
    const weeklyPct = Number(r[itemWowCol]);
    const yearlyPct = Number(r[itemYoyCol]);

    if (!Number.isFinite(currentPrice) || !Number.isFinite(prevPrice) || !Number.isFinite(weeklyPct)) {
      throw new Error(`Non-numeric price/change row for "${rawName}" in ${spiReportUrl}`);
    }

    const computedWow =
      prevPrice > 0 ? Math.round(((currentPrice - prevPrice) / prevPrice) * 10000) / 100 : 0;
    const mathDiff = Math.abs(computedWow - weeklyPct);
    const mathOk = mathDiff <= 0.25;
    if (!mathOk) {
      mathDiscrepancies.push(
        `${rawName}: reported WoW=${weeklyPct}%, recomputed=${computedWow}%`
      );
    }

    const canonical = resolveCommodityExact(rawName);
    let commodityId: string | null = null;
    if (!canonical) {
      unmappedItems.push(rawName);
    } else {
      commodityId = canonical.id;
      if (seenCommodityIds.has(commodityId)) {
        duplicateCommodityIds.push(commodityId);
      } else {
        seenCommodityIds.add(commodityId);
      }
    }

    itemsMap.set(normalizeCommodityKey(rawName), {
      sr: srVal,
      raw_name: rawName,
      unit,
      current_price: currentPrice,
      prev_price: prevPrice,
      year_ago_price: Number.isFinite(yearAgoPrice) ? yearAgoPrice : 0,
      weekly_pct: weeklyPct,
      computed_weekly_pct: computedWow,
      math_check_passed: mathOk,
      yearly_pct: Number.isFinite(yearlyPct) ? yearlyPct : 0,
      commodity_id: commodityId,
      city_prices: {}
    });
  }

  // 3. Header-driven Annexure (Appendix-A) parser — never swallow errors silently
  let annexStatus: 'verified' | 'failed' = 'failed';
  let annexError: string | undefined;
  const annexCitiesSet = new Set<string>();
  let totalCityObservations = 0;

  try {
    const annexBuffer = await fetchBuffer(annexUrl);
    const annexWb = xlsx.read(annexBuffer, { type: 'buffer' });
    const annexSheet = annexWb.Sheets['Appendix-A'] || annexWb.Sheets[annexWb.SheetNames[0]];
    if (!annexSheet) {
      throw new Error(`Appendix-A sheet missing in ${annexUrl}`);
    }

    const annexRows = xlsx.utils.sheet_to_json<any[]>(annexSheet, { header: 1 });

    interface AnnexBlock {
      headerRowIdx: number;
      dataStartIdx: number;
      dataEndIdx: number;
      descCol: number;
      cityCols: { city: string; avgCol: number }[];
    }

    const blocks: AnnexBlock[] = [];

    for (let i = 0; i < annexRows.length - 1; i++) {
      const row = annexRows[i];
      if (!row) continue;

      const cityHeaders: { city: string; headerCol: number }[] = [];
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (typeof cell !== 'string') continue;
        const m = cell.trim().match(/^([A-Za-z][A-Za-z\s.-]+?)\s*\(\d+\)$/);
        if (m) {
          cityHeaders.push({ city: m[1].trim(), headerCol: c });
        }
      }

      if (cityHeaders.length >= 2) {
        const subRow = annexRows[i + 1] || [];
        const descCol = subRow.findIndex(
          (c) => typeof c === 'string' && /description|item/i.test(c)
        );
        if (descCol === -1) {
          throw new Error(`Annexure subheader missing DESCRIPTION column at row ${i + 1}`);
        }

        const verifiedCityCols: { city: string; avgCol: number }[] = [];
        for (const ch of cityHeaders) {
          // Verify MIN / AVG / MAX headers beneath each city header
          let avgCol = -1;
          for (let offset = 0; offset <= 2; offset++) {
            const subCell = String(subRow[ch.headerCol + offset] || '').trim();
            if (/^avg$/i.test(subCell)) {
              avgCol = ch.headerCol + offset;
              break;
            }
          }
          if (avgCol === -1) {
            throw new Error(
              `Annexure header assertion failed: AVG subcolumn missing under "${ch.city}" at row ${i + 1}`
            );
          }
          verifiedCityCols.push({ city: ch.city, avgCol });
          annexCitiesSet.add(ch.city);
        }

        blocks.push({
          headerRowIdx: i,
          dataStartIdx: i + 2,
          dataEndIdx: annexRows.length,
          descCol,
          cityCols: verifiedCityCols
        });
      }
    }

    if (blocks.length === 0) {
      throw new Error('No city header blocks detected in Annexure Appendix-A');
    }

    for (let b = 0; b < blocks.length - 1; b++) {
      blocks[b].dataEndIdx = blocks[b + 1].headerRowIdx;
    }

    for (const block of blocks) {
      for (let rIdx = block.dataStartIdx; rIdx < block.dataEndIdx; rIdx++) {
        const row = annexRows[rIdx];
        if (!row) continue;
        const rawDesc = row[block.descCol];
        if (typeof rawDesc !== 'string' || !rawDesc.trim()) continue;

        const normDesc = normalizeCommodityKey(rawDesc);
        const matchedItem = itemsMap.get(normDesc);
        if (!matchedItem) continue;

        for (const cc of block.cityCols) {
          const val = Number(row[cc.avgCol]);
          if (Number.isFinite(val) && val > 0) {
            matchedItem.city_prices[cc.city] = Math.round(val * 100) / 100;
            totalCityObservations++;
          }
        }
      }
    }

    // Assert every enabled LOCATION_MASTER city was actually verified by header in Annexure
    const missingConfiguredCities = LOCATION_MASTER.filter((l) => l.isEnabled)
      .map((l) => l.city)
      .filter((c) => !annexCitiesSet.has(c));

    if (missingConfiguredCities.length > 0) {
      throw new Error(
        `Annexure missing expected city headers: ${missingConfiguredCities.join(', ')}`
      );
    }

    annexStatus = 'verified';
  } catch (err: any) {
    annexStatus = 'failed';
    annexError = err?.message || 'Annexure parsing failed';
  }

  const weekEndedObj = new Date(`${release.week_ended_date}T00:00:00Z`);
  if (isNaN(weekEndedObj.getTime())) {
    throw new Error(`Invalid week_ended_date: ${release.week_ended_date}`);
  }

  const weekEndedFormatted = formatUtcLongDate(release.week_ended_date);
  const publishedDateFormatted =
    release.published_date ||
    new Date(weekEndedObj.getTime() + 86400000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });

  const itemsList = Array.from(itemsMap.values());

  return {
    week_ended_date: release.week_ended_date,
    week_ended_formatted: weekEndedFormatted,
    prev_week_date: prevWeekDateIso,
    year_ago_date: yearAgoDateIso,
    published_date: publishedDateFormatted,
    spi_combined_index: combinedIndex,
    spi_combined_wow_change: wowChange,
    spi_combined_yoy_change: combinedYoY,
    spi_q1_index: q1Index,
    source_page_url: release.source_page_url,
    source_excel_url: spiReportUrl,
    annex_excel_url: annexUrl,
    annex_status: annexStatus,
    annex_error: annexError,
    annex_cities_verified: Array.from(annexCitiesSet),
    unmapped_items: unmappedItems,
    duplicate_commodity_ids: duplicateCommodityIds,
    math_discrepancies: mathDiscrepancies,
    total_items: itemsList.length,
    total_city_observations: totalCityObservations,
    items: itemsList,
    extracted_at: new Date().toISOString()
  };
}
