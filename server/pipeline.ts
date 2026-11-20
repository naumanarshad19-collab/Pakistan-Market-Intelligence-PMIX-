import { COMMODITY_MASTER } from './commodities';
import { LOCATION_MASTER } from './locations';
import { DataSourceRecord, INITIAL_SOURCE_REGISTRY } from './registry';
import {
  discoverPbsReleases,
  fetchText,
  PbsSpiReport,
  scrapePbsRelease
} from './pbs-scraper';
import { ForexSnapshot, marketArchive } from './archive';

export interface PriceObservation {
  id: string;
  source_id: string;
  collection_time: string;
  observation_date: string;
  province: string;
  district: string;
  city: string;
  market: string;
  commodity_id: string;
  price_type: 'spi_benchmark';
  average_price: number;
  unit: string;
  currency: 'PKR';
  source_url: string;
  math_check_passed: boolean;
}

export interface SourceVerificationRecord {
  commodity_id: string;
  commodity_name: string;
  city: string;
  pbs_benchmark_price: number | null;
  amis_status: 'not_implemented' | 'error' | 'verified';
  amis_price: number | null;
  punjab_bos_status: 'not_implemented' | 'error' | 'verified';
  punjab_bos_price: number | null;
  cities_verified_count: number;
  math_check_passed: boolean;
  verification_summary: string;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PublishGateResult {
  status: 'PASSED' | 'FAILED';
  checked_at: string;
  week_ended_date: string | null;
  release_age_days: number | null;
  items_parsed: number;
  mapped_items_count: number;
  annex_status: 'verified' | 'failed' | 'missing';
  annex_cities_count: number;
  failed_checks: string[];
  checks: VerificationCheck[];
}

export interface PipelineExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  stage: 'DISCOVER' | 'INGEST' | 'PARSE' | 'ARCHIVE' | 'VALIDATE' | 'PUBLISH';
  message: string;
  metadata?: unknown;
}

export function evaluatePublishGate(
  report: PbsSpiReport | null,
  referenceDate: Date = new Date(),
  enforceFreshness: boolean = true
): PublishGateResult {
  const checkedAt = new Date().toISOString();
  const checks: VerificationCheck[] = [];

  if (!report) {
    checks.push({
      name: 'PBS Release Available',
      passed: false,
      detail: 'No parsed PBS SPI report available.'
    });
    return {
      status: 'FAILED',
      checked_at: checkedAt,
      week_ended_date: null,
      release_age_days: null,
      items_parsed: 0,
      mapped_items_count: 0,
      annex_status: 'missing',
      annex_cities_count: 0,
      failed_checks: ['No parsed PBS SPI report available.'],
      checks
    };
  }

  // 1. Exact 51-item basket completeness
  const hasAll51 = report.total_items === 51 && report.items.length === 51;
  checks.push({
    name: '51-Item SPI Basket Completeness',
    passed: hasAll51,
    detail: `Parsed ${report.items.length} of 51 required PBS SPI commodities.`
  });

  // 2. 1:1 Canonical Mapping & Zero Duplicate IDs
  const mappedCount = report.items.filter((i) => i.commodity_id !== null).length;
  const mappingOk =
    mappedCount === 51 &&
    report.unmapped_items.length === 0 &&
    report.duplicate_commodity_ids.length === 0;
  checks.push({
    name: '1:1 Canonical Item Mapping',
    passed: mappingOk,
    detail: mappingOk
      ? 'All 51 PBS items resolved uniquely with zero collisions.'
      : `Mapped=${mappedCount}/51, unmapped=[${report.unmapped_items.join(', ')}], duplicates=[${report.duplicate_commodity_ids.join(', ')}]`
  });

  // 3. Release Freshness (<= 8 calendar days from referenceDate)
  const refUtcMidnight = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
  const weekEndedMs = Date.parse(`${report.week_ended_date}T00:00:00Z`);
  const ageDays = Number.isFinite(weekEndedMs)
    ? Math.floor((refUtcMidnight - weekEndedMs) / 86400000)
    : null;

  const freshnessOk =
    !enforceFreshness ||
    (ageDays !== null && ageDays >= -1 && ageDays <= 8);
  checks.push({
    name: 'Release Freshness Window (<= 8 Days)',
    passed: freshnessOk,
    detail:
      ageDays === null
        ? `Invalid week_ended_date: ${report.week_ended_date}`
        : `Week ended ${report.week_ended_date} (${ageDays} calendar days before ${
            referenceDate.toISOString().split('T')[0]
          }).`
  });

  // 4. Headline Index, WoW, YoY parsed from Page 1
  const headlineOk =
    Number.isFinite(report.spi_combined_index) &&
    report.spi_combined_index > 0 &&
    Number.isFinite(report.spi_combined_wow_change) &&
    Number.isFinite(report.spi_combined_yoy_change);
  checks.push({
    name: 'Headline Index, WoW & YoY Parsed',
    passed: headlineOk,
    detail: headlineOk
      ? `Combined SPI=${report.spi_combined_index}, WoW=${report.spi_combined_wow_change}%, YoY=${report.spi_combined_yoy_change}%.`
      : 'Missing or invalid Combined SPI index / WoW / YoY values.'
  });

  // 5. Arithmetic WoW consistency
  const mathOk = report.math_discrepancies.length === 0;
  checks.push({
    name: 'Price-to-WoW% Arithmetic Check',
    passed: mathOk,
    detail: mathOk
      ? 'All 51 weekly % changes match (Current - Previous) / Previous within 0.25%.'
      : `Discrepancies in ${report.math_discrepancies.length} items: ${report.math_discrepancies
          .slice(0, 3)
          .join('; ')}`
  });

  // 6. Header-driven Annexure City Matrix
  const annexOk =
    report.annex_status === 'verified' && report.annex_cities_verified.length >= 17;
  checks.push({
    name: 'Annexure City Matrix (Header-Verified)',
    passed: annexOk,
    detail: annexOk
      ? `Verified ${report.annex_cities_verified.length} city headers (${report.total_city_observations} observations).`
      : `Annexure status=${report.annex_status}: ${report.annex_error || 'Missing city headers'}`
  });

  const failedChecks = checks.filter((c) => !c.passed).map((c) => `${c.name}: ${c.detail}`);

  return {
    status: failedChecks.length === 0 ? 'PASSED' : 'FAILED',
    checked_at: checkedAt,
    week_ended_date: report.week_ended_date,
    release_age_days: ageDays,
    items_parsed: report.items.length,
    mapped_items_count: mappedCount,
    annex_status: report.annex_status,
    annex_cities_count: report.annex_cities_verified.length,
    failed_checks: failedChecks,
    checks
  };
}

export class DataEngine {
  private sources: DataSourceRecord[] = INITIAL_SOURCE_REGISTRY.map((s) => ({ ...s }));
  private observations: PriceObservation[] = [];
  private crossValidations: SourceVerificationRecord[] = [];
  private logs: PipelineExecutionLog[] = [];
  private latestPbsReport: PbsSpiReport | null = null;
  private latestForex: ForexSnapshot | null = null;
  private lastPipelineError: string | null = null;
  private isRunning = false;

  constructor() {
    this.addLog('info', 'ARCHIVE', 'Data Engine initialized. Hydrating persisted market archive...');
    this.hydrateFromArchive();
  }

  private hydrateFromArchive(): void {
    const latest = marketArchive.getLatestPbsReport();
    if (latest) {
      this.latestPbsReport = latest;
      this.rebuildObservationsFromReport(latest);
      const stats = marketArchive.getStats();
      this.addLog(
        'info',
        'ARCHIVE',
        `Loaded ${stats.archived_weeks} archived PBS SPI weekly releases (${stats.oldest_week} to ${stats.newest_week}).`
      );
    }
    this.latestForex = marketArchive.getLatestForex();
  }

  public getSources(): DataSourceRecord[] {
    return this.sources;
  }

  public getLatestPbsReport(): PbsSpiReport | null {
    return this.latestPbsReport;
  }

  public getLatestForex(): ForexSnapshot | null {
    return this.latestForex;
  }

  public getLastPipelineError(): string | null {
    return this.lastPipelineError;
  }

  public getLogs(): PipelineExecutionLog[] {
    return this.logs;
  }

  public getObservations(): PriceObservation[] {
    return this.observations;
  }

  public getCrossValidations(): SourceVerificationRecord[] {
    return this.crossValidations;
  }

  public getArchiveStats() {
    return marketArchive.getStats();
  }

  /**
   * Returns strictly real historical price points from archived PBS SPI releases.
   * Zero Math.random() or synthetic city multipliers.
   */
  public getHistoricalSeries(
    commodityId: string,
    city: string = 'All'
  ): { date: string; isoDate: string; price: number; source: string }[] {
    const reports = marketArchive.getAllPbsReportsAscending();
    const series: { date: string; isoDate: string; price: number; source: string }[] = [];
    const seenDates = new Set<string>();

    // Optional real 1-year-ago & 1-week-ago anchors from the earliest archived release (national avg only)
    if (city === 'All' && reports.length > 0) {
      const earliest = reports[0];
      const match = earliest.items.find((it) => it.commodity_id === commodityId);
      if (match) {
        if (earliest.year_ago_date && match.year_ago_price > 0) {
          seenDates.add(earliest.year_ago_date);
          series.push({
            date: new Date(`${earliest.year_ago_date}T00:00:00Z`).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: '2-digit',
              timeZone: 'UTC'
            }),
            isoDate: earliest.year_ago_date,
            price: match.year_ago_price,
            source: `PBS SPI (${earliest.week_ended_date} YoY baseline)`
          });
        }
        if (
          earliest.prev_week_date &&
          match.prev_price > 0 &&
          !seenDates.has(earliest.prev_week_date)
        ) {
          seenDates.add(earliest.prev_week_date);
          series.push({
            date: new Date(`${earliest.prev_week_date}T00:00:00Z`).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: '2-digit',
              timeZone: 'UTC'
            }),
            isoDate: earliest.prev_week_date,
            price: match.prev_price,
            source: `PBS SPI (${earliest.week_ended_date} prev week)`
          });
        }
      }
    }

    for (const rep of reports) {
      const item = rep.items.find((it) => it.commodity_id === commodityId);
      if (!item) continue;

      const price =
        city === 'All'
          ? item.current_price
          : item.city_prices && item.city_prices[city] > 0
          ? item.city_prices[city]
          : null;

      if (price === null || !Number.isFinite(price) || price <= 0) continue;
      if (seenDates.has(rep.week_ended_date)) continue;

      seenDates.add(rep.week_ended_date);
      series.push({
        date: new Date(`${rep.week_ended_date}T00:00:00Z`).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit',
          timeZone: 'UTC'
        }),
        isoDate: rep.week_ended_date,
        price,
        source: `PBS SPI Week Ended ${rep.week_ended_date}`
      });
    }

    return series.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  }

  public addLog(
    level: PipelineExecutionLog['level'],
    stage: PipelineExecutionLog['stage'],
    message: string,
    metadata?: unknown
  ) {
    const entry: PipelineExecutionLog = {
      id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      stage,
      message,
      metadata
    };
    this.logs.unshift(entry);
    if (this.logs.length > 250) this.logs.pop();
  }

  private rebuildObservationsFromReport(report: PbsSpiReport): void {
    // Reset cleanly on every run so duplicates never accumulate
    this.observations = [];
    this.crossValidations = [];

    const nowIso = new Date().toISOString();

    for (const commodity of COMMODITY_MASTER) {
      const pbsItem = report.items.find((it) => it.commodity_id === commodity.id);
      if (!pbsItem) continue;

      let verifiedCitiesForCommodity = 0;

      for (const location of LOCATION_MASTER) {
        if (!location.isEnabled) continue;

        const cityPrice = pbsItem.city_prices?.[location.city];
        if (cityPrice !== undefined && Number.isFinite(cityPrice) && cityPrice > 0) {
          verifiedCitiesForCommodity++;
          this.observations.push({
            id: `obs_${commodity.id}_${location.id}_PBS_${report.week_ended_date}`,
            source_id: 'PBS_SPI',
            collection_time: report.extracted_at || nowIso,
            observation_date: report.week_ended_date,
            province: location.province,
            district: location.district,
            city: location.city,
            market: location.primary_market,
            commodity_id: commodity.id,
            price_type: 'spi_benchmark',
            average_price: cityPrice,
            unit: pbsItem.unit,
            currency: 'PKR',
            source_url: report.annex_excel_url || report.source_page_url,
            math_check_passed: pbsItem.math_check_passed
          });
        }
      }

      this.crossValidations.push({
        commodity_id: commodity.id,
        commodity_name: pbsItem.raw_name,
        city: 'National Average',
        pbs_benchmark_price: pbsItem.current_price,
        amis_status: 'not_implemented',
        amis_price: null,
        punjab_bos_status: 'not_implemented',
        punjab_bos_price: null,
        cities_verified_count: verifiedCitiesForCommodity,
        math_check_passed: pbsItem.math_check_passed,
        verification_summary: `PBS SPI Verified (${verifiedCitiesForCommodity}/17 cities)`
      });
    }
  }

  public async executePipeline(options?: {
    backfillLimit?: number;
    forceRefreshLatest?: boolean;
  }): Promise<{
    gate: PublishGateResult;
    observations: number;
    archived_weeks: number;
    backfilled_now: number;
  }> {
    if (this.isRunning) {
      const gate = evaluatePublishGate(this.latestPbsReport);
      return {
        gate,
        observations: this.observations.length,
        archived_weeks: marketArchive.getStats().archived_weeks,
        backfilled_now: 0
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const backfillLimit = options?.backfillLimit ?? 15;
    let backfilledNow = 0;
    this.lastPipelineError = null;

    this.addLog('info', 'DISCOVER', 'Starting live discovery across official public endpoints...');

    try {
      // 1. PBS SPI Dynamic Discovery & Ingestion + Historical Archive Backfill
      const pbsSource = this.sources.find((s) => s.source_id === 'PBS_SPI');
      if (pbsSource) {
        pbsSource.status = 'fetching';
        pbsSource.last_attempt = new Date().toISOString();
      }

      try {
        const discovered = await discoverPbsReleases(3);
        const newestRelease = discovered[0];

        this.addLog(
          'info',
          'DISCOVER',
          `Discovered ${discovered.length} official PBS SPI releases. Latest week ended: ${newestRelease.week_ended_date}.`
        );

        // Fetch newest release live (or re-verify)
        const latestParsed = await scrapePbsRelease(newestRelease);
        marketArchive.upsertPbsReport(latestParsed);
        this.latestPbsReport = latestParsed;
        this.rebuildObservationsFromReport(latestParsed);

        if (pbsSource) {
          pbsSource.url = latestParsed.source_page_url;
          pbsSource.status = latestParsed.annex_status === 'verified' ? 'success' : 'error';
          pbsSource.last_success = new Date().toISOString();
          pbsSource.total_observations = this.observations.length;
          pbsSource.status_detail =
            latestParsed.annex_status === 'verified'
              ? `Verified ${latestParsed.items.length}/51 items & ${latestParsed.annex_cities_verified.length} Annexure cities (Week Ended ${latestParsed.week_ended_date}).`
              : `Parsed ${latestParsed.items.length}/51 items, Annexure failed: ${latestParsed.annex_error}`;
          pbsSource.coverage_notes = `Latest SPI Week Ended: ${latestParsed.week_ended_formatted}. Combined Index: ${latestParsed.spi_combined_index} (${latestParsed.spi_combined_wow_change > 0 ? '+' : ''}${latestParsed.spi_combined_wow_change}% WoW, ${latestParsed.spi_combined_yoy_change > 0 ? '+' : ''}${latestParsed.spi_combined_yoy_change}% YoY).`;
        }

        this.addLog(
          'success',
          'PARSE',
          `Parsed latest PBS SPI (${latestParsed.week_ended_date}): ${latestParsed.items.length} items, ${this.observations.length} city observations, Index=${latestParsed.spi_combined_index}.`
        );

        // Backfill missing historical releases into disk archive (bounded batches of 3)
        const missingReleases = discovered
          .slice(1)
          .filter((rel) => !marketArchive.hasPbsReport(rel.week_ended_date))
          .slice(0, backfillLimit);

        if (missingReleases.length > 0) {
          this.addLog(
            'info',
            'ARCHIVE',
            `Backfilling ${missingReleases.length} historical PBS SPI weekly releases...`
          );
          for (let i = 0; i < missingReleases.length; i += 3) {
            const batch = missingReleases.slice(i, i + 3);
            const results = await Promise.allSettled(
              batch.map((rel) => scrapePbsRelease(rel))
            );
            for (const res of results) {
              if (res.status === 'fulfilled') {
                marketArchive.upsertPbsReport(res.value);
                backfilledNow++;
              }
            }
          }
          this.addLog(
            'success',
            'ARCHIVE',
            `Backfill complete: archived ${backfilledNow} historical PBS SPI weeks (total archived: ${marketArchive.getStats().archived_weeks}).`
          );
        }
      } catch (err: any) {
        this.lastPipelineError = err.message;
        if (pbsSource) {
          pbsSource.status = 'error';
          pbsSource.status_detail = `Live PBS extraction failed: ${err.message}`;
        }
        this.addLog('error', 'INGEST', `PBS SPI live ingestion failed: ${err.message}`);
      }

      // 2. Live SBP / Exchange Rate API Connector
      const forexSource = this.sources.find((s) => s.source_id === 'SBP_FOREX');
      if (forexSource && forexSource.active) {
        forexSource.status = 'fetching';
        forexSource.last_attempt = new Date().toISOString();
        try {
          const rawJson = await fetchText(forexSource.url);
          const data = JSON.parse(rawJson);
          const pkrRate = Number(data?.rates?.PKR);
          if (!Number.isFinite(pkrRate) || pkrRate <= 0) {
            throw new Error('PKR rate missing or invalid in forex payload');
          }
          const todayIso = new Date().toISOString().split('T')[0];
          const snap: ForexSnapshot = {
            date: todayIso,
            usd_pkr: Math.round(pkrRate * 100) / 100,
            source_url: forexSource.url,
            fetched_at: new Date().toISOString()
          };
          marketArchive.upsertForexSnapshot(snap);
          this.latestForex = snap;

          forexSource.status = 'success';
          forexSource.last_success = snap.fetched_at;
          forexSource.total_observations = 1;
          forexSource.status_detail = `Live USD/PKR: Rs ${snap.usd_pkr} (updated ${data?.time_last_update_utc || snap.date}).`;
          this.addLog('success', 'PARSE', `Fetched live USD/PKR exchange rate: Rs ${snap.usd_pkr}.`);
        } catch (err: any) {
          forexSource.status = 'error';
          forexSource.status_detail = `Forex fetch failed: ${err.message}`;
          this.addLog('error', 'INGEST', `SBP_FOREX failed: ${err.message}`);
        }
      }

      // 3. Honest handling for unimplemented connectors (AMIS, PUNJAB_BOS, KCA)
      for (const source of this.sources) {
        if (source.source_id === 'PBS_SPI' || source.source_id === 'SBP_FOREX') continue;
        if (source.implementation_status === 'not_implemented') {
          source.status = 'not_implemented';
          source.total_observations = 0;
          this.addLog(
            'warn',
            'INGEST',
            `${source.source_id} skipped: connector marked not_implemented (no synthetic fallback generated).`
          );
        }
      }

      const gate = evaluatePublishGate(this.latestPbsReport);
      if (gate.status === 'PASSED') {
        this.addLog(
          'success',
          'PUBLISH',
          `Publish Gate PASSED in ${Date.now() - startTime}ms. ${gate.items_parsed}/51 items verified for week ended ${gate.week_ended_date}.`
        );
      } else {
        this.addLog(
          'error',
          'VALIDATE',
          `Publish Gate FAILED (${gate.failed_checks.length} failing invariants): ${gate.failed_checks.join(' | ')}`
        );
      }

      return {
        gate,
        observations: this.observations.length,
        archived_weeks: marketArchive.getStats().archived_weeks,
        backfilled_now: backfilledNow
      };
    } finally {
      this.isRunning = false;
    }
  }
}

export const dataEngine = new DataEngine();
