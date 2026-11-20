import { COMMODITY_MASTER } from './commodities';
import { LOCATION_MASTER } from './locations';
import { marketArchive } from './archive';
import {
  dataEngine,
  evaluatePublishGate,
  PublishGateResult
} from './pipeline';
import { PbsSpiReport } from './pbs-scraper';

export interface CommodityAnalyticsRecord {
  id: string;
  sr: number;
  name: string;
  urdu_name: string;
  category: string;
  unit: string;
  currentPrice: number;
  previousPrice: number;
  yearAgoPrice: number;
  priceChangePercentage: number; // Weekly WoW % (PBS SPI is weekly)
  weeklyChangePercentage: number; // 7D / WoW %
  yearlyChangePercentage: number; // YoY %
  volatilityArchived: number; // Std dev % across archived weeks
  verification: {
    pbsVerified: boolean;
    mathCheckPassed: boolean;
    citiesVerifiedCount: number;
    weekEndedDate: string;
    amisStatus: 'not_implemented' | 'error' | 'verified';
    bosStatus: 'not_implemented' | 'error' | 'verified';
    label: string;
  };
  nationalMetrics: {
    nationalAverage: number;
    nationalMedian: number;
    highestCity: { city: string; price: number };
    lowestCity: { city: string; price: number };
    citySpreadDelta: number;
    citySpreadPct: number;
  };
  cityOffers: { city: string; price: number; varianceFromAvgPct: number }[];
  historySeries: { date: string; isoDate: string; price: number; source: string }[];
  lastUpdated: string;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface MarketPulse {
  publish_gate: PublishGateResult;
  blocked_reason: string | null;
  is_historical_snapshot: boolean;
  date: string;
  week_ended_date: string | null;
  headline: string;
  monitored_commodities_count: number;
  monitored_cities_count: number;
  market_direction: 'Bullish' | 'Bearish' | 'Mixed' | 'Stable' | 'Unverified';
  advancers_count: number;
  decliners_count: number;
  unchanged_count: number;
  market_breadth: {
    total_items: number;
    advancers_count: number;
    advancers_pct: number;
    decliners_count: number;
    decliners_pct: number;
    unchanged_count: number;
    unchanged_pct: number;
  } | null;
  pbs_spi_metrics: {
    spi_combined_index: number;
    spi_combined_wow_change: number;
    spi_combined_yoy_change: number;
    spi_q1_index: number;
    week_ended_formatted: string;
    published_date: string;
    source_url: string;
    source_excel_url: string;
    annex_excel_url: string;
  } | null;
  top_gainers: {
    id: string;
    name: string;
    category: string;
    current_price: number;
    unit: string;
    weekly_change_pct: number;
  }[];
  top_losers: {
    id: string;
    name: string;
    category: string;
    current_price: number;
    unit: string;
    weekly_change_pct: number;
  }[];
  key_anomalies: {
    commodity: string;
    city: string;
    price: number;
    unit: string;
    reason: string;
    severity: 'High' | 'Medium';
  }[];
  regional_spreads: {
    commodity: string;
    highest_city: string;
    highest_price: number;
    lowest_city: string;
    lowest_price: number;
    spread_pct: number;
    arbitrage_insight: string;
  }[];
  social_ready_post: {
    platform: 'LinkedIn' | 'Twitter' | 'Newsletter';
    title: string;
    content: string;
  } | null;
}

export class AnalyticsEngine {
  public computeAllCommodityRecords(
    filterCity: string = 'All',
    targetDate?: string
  ): CommodityAnalyticsRecord[] {
    const records: CommodityAnalyticsRecord[] = [];
    const report: PbsSpiReport | null = targetDate
      ? marketArchive.getPbsReportForDate(targetDate)
      : dataEngine.getLatestPbsReport();

    if (!report || !report.items || report.items.length === 0) {
      return [];
    }

    for (const commodity of COMMODITY_MASTER) {
      const pbsItem = report.items.find((it) => it.commodity_id === commodity.id);
      if (!pbsItem) continue;

      const enabledCities = LOCATION_MASTER.filter((l) => l.isEnabled);
      const cityPrices: { city: string; price: number }[] = [];

      for (const loc of enabledCities) {
        const cp = pbsItem.city_prices?.[loc.city];
        if (cp !== undefined && Number.isFinite(cp) && cp > 0) {
          cityPrices.push({ city: loc.city, price: cp });
        }
      }

      // Compute city spread metrics strictly from parsed Appendix-A city prices
      const sortedCities = [...cityPrices].sort((a, b) => b.price - a.price);
      const cityAvg =
        sortedCities.length > 0
          ? Math.round(
              (sortedCities.reduce((acc, c) => acc + c.price, 0) / sortedCities.length) * 100
            ) / 100
          : pbsItem.current_price;

      const mid = Math.floor(sortedCities.length / 2);
      const cityMedian =
        sortedCities.length === 0
          ? pbsItem.current_price
          : sortedCities.length % 2 !== 0
          ? sortedCities[mid].price
          : Math.round(((sortedCities[mid - 1].price + sortedCities[mid].price) / 2) * 100) / 100;

      const highestCity = sortedCities[0] || { city: 'N/A', price: pbsItem.current_price };
      const lowestCity = sortedCities[sortedCities.length - 1] || {
        city: 'N/A',
        price: pbsItem.current_price
      };
      const citySpreadDelta =
        sortedCities.length >= 2
          ? Math.round((highestCity.price - lowestCity.price) * 100) / 100
          : 0;
      const citySpreadPct =
        sortedCities.length >= 2 && lowestCity.price > 0
          ? Math.round(((highestCity.price - lowestCity.price) / lowestCity.price) * 1000) / 10
          : 0;

      let displayPrice = pbsItem.current_price;
      if (filterCity !== 'All') {
        const cityMatch = cityPrices.find(
          (c) => c.city.toLowerCase() === filterCity.toLowerCase()
        );
        if (!cityMatch) continue;
        displayPrice = cityMatch.price;
      }

      const historySeries = dataEngine.getHistoricalSeries(
        commodity.id,
        filterCity === 'All' ? 'All' : filterCity
      );

      // Volatility across real archived points (returns between consecutive observations)
      let volatilityArchived = 0;
      if (historySeries.length >= 3) {
        const returns: number[] = [];
        for (let i = 1; i < historySeries.length; i++) {
          if (historySeries[i - 1].price > 0) {
            returns.push(
              (historySeries[i].price - historySeries[i - 1].price) / historySeries[i - 1].price
            );
          }
        }
        if (returns.length > 0) {
          const meanRet = returns.reduce((a, b) => a + b, 0) / returns.length;
          const variance =
            returns.reduce((acc, r) => acc + Math.pow(r - meanRet, 2), 0) / returns.length;
          volatilityArchived = Math.round(Math.sqrt(variance) * 1000) / 10;
        }
      }

      const weeklyPct = pbsItem.weekly_pct;
      const yearlyPct = pbsItem.yearly_pct;

      const isAnomaly = Math.abs(weeklyPct) >= 10 || (sortedCities.length >= 2 && citySpreadPct >= 40);
      let anomalyReason: string | undefined;
      if (Math.abs(weeklyPct) >= 10) {
        anomalyReason = `Significant weekly movement of ${weeklyPct > 0 ? '+' : ''}${weeklyPct.toFixed(
          2
        )}% vs prior week`;
      } else if (sortedCities.length >= 2 && citySpreadPct >= 40) {
        anomalyReason = `Wide inter-city spread of ${citySpreadPct.toFixed(1)}% (${highestCity.city} Rs ${highestCity.price} vs ${lowestCity.city} Rs ${lowestCity.price})`;
      }

      records.push({
        id: commodity.id,
        sr: pbsItem.sr,
        name: pbsItem.raw_name,
        urdu_name: commodity.urdu_name,
        category: commodity.category,
        unit: pbsItem.unit,
        currentPrice: displayPrice,
        previousPrice: pbsItem.prev_price,
        yearAgoPrice: pbsItem.year_ago_price,
        priceChangePercentage: weeklyPct,
        weeklyChangePercentage: weeklyPct,
        yearlyChangePercentage: yearlyPct,
        volatilityArchived,
        verification: {
          pbsVerified: true,
          mathCheckPassed: pbsItem.math_check_passed,
          citiesVerifiedCount: cityPrices.length,
          weekEndedDate: report.week_ended_date,
          amisStatus: 'not_implemented',
          bosStatus: 'not_implemented',
          label: `PBS Verified · ${cityPrices.length}/17 Cities`
        },
        nationalMetrics: {
          nationalAverage: pbsItem.current_price,
          nationalMedian: cityMedian,
          highestCity,
          lowestCity,
          citySpreadDelta,
          citySpreadPct
        },
        cityOffers: sortedCities.map((c) => ({
          city: c.city,
          price: c.price,
          varianceFromAvgPct:
            cityAvg > 0 ? Math.round(((c.price - cityAvg) / cityAvg) * 1000) / 10 : 0
        })),
        historySeries,
        lastUpdated: report.extracted_at,
        isAnomaly,
        anomalyReason
      });
    }

    return records;
  }

  public generateMarketPulse(targetDateStr?: string): MarketPulse {
    const isHistorical = Boolean(targetDateStr);
    const report: PbsSpiReport | null = targetDateStr
      ? marketArchive.getPbsReportForDate(targetDateStr)
      : dataEngine.getLatestPbsReport();

    const refDate = targetDateStr ? new Date(`${targetDateStr}T00:00:00Z`) : new Date();
    const validRefDate = !isNaN(refDate.getTime()) ? refDate : new Date();

    // Always enforce strict Publish Gate; for explicit historical archive viewing, enforce freshness against the selected archive date
    const gate = evaluatePublishGate(report, validRefDate, true);

    const displayDate = validRefDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });

    if (gate.status === 'FAILED' || !report) {
      const blockedReason = `Publish Gate FAILED: ${gate.failed_checks.join(' | ')}`;
      return {
        publish_gate: gate,
        blocked_reason: blockedReason,
        is_historical_snapshot: isHistorical,
        date: displayDate,
        week_ended_date: report?.week_ended_date || null,
        headline: blockedReason,
        monitored_commodities_count: report?.items.length || 0,
        monitored_cities_count: report?.annex_cities_verified.length || 0,
        market_direction: 'Unverified',
        advancers_count: 0,
        decliners_count: 0,
        unchanged_count: 0,
        market_breadth: null,
        pbs_spi_metrics: null,
        top_gainers: [],
        top_losers: [],
        key_anomalies: [],
        regional_spreads: [],
        social_ready_post: null
      };
    }

    // Gate PASSED: all 51 items, fresh within <= 8 days, Page 1 & Annexure headers verified
    const allRecords = this.computeAllCommodityRecords('All', targetDateStr);
    const totalItemsCount = report.items.length;

    const advItems = report.items.filter((i) => i.weekly_pct > 0);
    const decItems = report.items.filter((i) => i.weekly_pct < 0);
    const unchItems = report.items.filter((i) => i.weekly_pct === 0);

    const advancersCount = advItems.length;
    const declinersCount = decItems.length;
    const unchangedCount = unchItems.length;

    const advancersPct = Math.round((advancersCount / totalItemsCount) * 10000) / 100;
    const declinersPct = Math.round((declinersCount / totalItemsCount) * 10000) / 100;
    const unchangedPct = Math.round((unchangedCount / totalItemsCount) * 10000) / 100;

    const categoryById = new Map(COMMODITY_MASTER.map((c) => [c.id, c.category]));

    const topGainers = [...advItems]
      .sort((a, b) => b.weekly_pct - a.weekly_pct)
      .slice(0, 5)
      .map((i) => ({
        id: i.commodity_id || `pbs_${i.sr}`,
        name: i.raw_name,
        category: (i.commodity_id && categoryById.get(i.commodity_id)) || 'Essential Commodities',
        current_price: i.current_price,
        unit: i.unit,
        weekly_change_pct: i.weekly_pct
      }));

    const allDecliners = [...decItems]
      .sort((a, b) => a.weekly_pct - b.weekly_pct)
      .map((i) => ({
        id: i.commodity_id || `pbs_${i.sr}`,
        name: i.raw_name,
        category: (i.commodity_id && categoryById.get(i.commodity_id)) || 'Essential Commodities',
        current_price: i.current_price,
        unit: i.unit,
        weekly_change_pct: i.weekly_pct
      }));

    let direction: MarketPulse['market_direction'] = 'Mixed';
    if (advancersCount >= totalItemsCount * 0.5) direction = 'Bullish';
    else if (declinersCount >= totalItemsCount * 0.5) direction = 'Bearish';
    else if (unchangedCount >= totalItemsCount * 0.5) direction = 'Stable';

    const keyAnomalies = allRecords
      .filter((r) => r.isAnomaly)
      .slice(0, 5)
      .map((r) => ({
        commodity: r.name,
        city: r.nationalMetrics.highestCity.city,
        price: r.nationalMetrics.highestCity.price,
        unit: r.unit,
        reason: r.anomalyReason || 'Significant price variance detected.',
        severity: (Math.abs(r.weeklyChangePercentage) >= 15 ? 'High' : 'Medium') as
          | 'High'
          | 'Medium'
      }));

    const regionalSpreads = [...allRecords]
      .filter((r) => r.cityOffers.length >= 2 && r.nationalMetrics.citySpreadPct > 0)
      .sort((a, b) => b.nationalMetrics.citySpreadPct - a.nationalMetrics.citySpreadPct)
      .slice(0, 5)
      .map((r) => ({
        commodity: r.name,
        highest_city: r.nationalMetrics.highestCity.city,
        highest_price: r.nationalMetrics.highestCity.price,
        lowest_city: r.nationalMetrics.lowestCity.city,
        lowest_price: r.nationalMetrics.lowestCity.price,
        spread_pct: r.nationalMetrics.citySpreadPct,
        arbitrage_insight: `${r.name} shows a ${r.nationalMetrics.citySpreadPct.toFixed(1)}% inter-city spread (${r.nationalMetrics.highestCity.city} at Rs ${r.nationalMetrics.highestCity.price.toLocaleString()} vs ${r.nationalMetrics.lowestCity.city} at Rs ${r.nationalMetrics.lowestCity.price.toLocaleString()}, Δ Rs ${r.nationalMetrics.citySpreadDelta.toLocaleString()}/${r.unit}).`
      }));

    const weekEndedShort = new Date(`${report.week_ended_date}T00:00:00Z`).toLocaleDateString(
      'en-US',
      { month: 'short', day: 'numeric', timeZone: 'UTC' }
    );

    const gainersText = topGainers
      .map(
        (g) =>
          `🔴 ${g.name}: +${g.weekly_change_pct.toFixed(2)}% | Rs ${g.current_price.toLocaleString()}/${g.unit} [PBS SPI - Week Ended ${weekEndedShort}]`
      )
      .join('\n');

    const losersText = allDecliners
      .map(
        (l) =>
          `🟢 ${l.name}: ${l.weekly_change_pct.toFixed(2)}% | Rs ${l.current_price.toLocaleString()}/${l.unit} [PBS SPI - Week Ended ${weekEndedShort}]`
      )
      .join('\n');

    const topSpread = regionalSpreads[0];
    const spiWowSigned = `${report.spi_combined_wow_change > 0 ? '+' : ''}${report.spi_combined_wow_change.toFixed(2)}%`;
    const spiYoySigned = `${report.spi_combined_yoy_change > 0 ? '+' : ''}${report.spi_combined_yoy_change.toFixed(2)}%`;

    const socialPostContent = `🇵🇰 PAKISTAN MARKET PULSE — Week Ended ${report.week_ended_formatted}

Verified essential commodity intelligence parsed directly from the Pakistan Bureau of Statistics (PBS) Sensitive Price Indicator (Published: ${report.published_date}).

📊 MARKET BREADTH (All 51 PBS SPI Commodities):
• Advancers: ${advancersCount} commodities (${advancersPct.toFixed(2)}%)
• Decliners: ${declinersCount} commodities (${declinersPct.toFixed(2)}%)
• Stable: ${unchangedCount} commodities (${unchangedPct.toFixed(2)}%)
Market Breadth Balance: ${direction.toUpperCase()}

📈 TOP 5 SIGNIFICANT INCREASES:
${gainersText}

📉 ALL DECLINERS (${declinersCount} of 51 Items Registered Decline):
${losersText}

📍 VERIFIED INTER-CITY SPREAD (PBS Appendix-A, 17 Urban Centers):
${topSpread ? `• ${topSpread.arbitrage_insight}` : '• All regional markets within baseline spread tolerances.'}

🔍 VERIFICATION SUMMARY:
• SPI Combined Index: ${report.spi_combined_index.toFixed(2)} (Base 2015-16=100) | ${spiWowSigned} WoW | ${spiYoySigned} YoY
• Basket & Math Check: ${report.items.length}/51 items parsed; WoW arithmetic verified across all 51 rows
• Geographic Coverage: ${report.annex_cities_verified.length} PBS urban centers (${report.total_city_observations} city observations)

Source: Pakistan Bureau of Statistics (PBS)
Release URL: ${report.source_page_url}

#PakistanEconomy #Inflation #Commodities #PBS #SPI #SupplyChain`;

    return {
      publish_gate: gate,
      blocked_reason: null,
      is_historical_snapshot: isHistorical,
      date: displayDate,
      week_ended_date: report.week_ended_formatted,
      headline: `PBS SPI Weekly (${report.week_ended_formatted}): ${advancersCount} items increased (${advancersPct.toFixed(2)}%), ${declinersCount} decreased (${declinersPct.toFixed(2)}%), and ${unchangedCount} remained stable (${unchangedPct.toFixed(2)}%) across ${totalItemsCount} essential commodities.`,
      monitored_commodities_count: totalItemsCount,
      monitored_cities_count: report.annex_cities_verified.length,
      market_direction: direction,
      advancers_count: advancersCount,
      decliners_count: declinersCount,
      unchanged_count: unchangedCount,
      market_breadth: {
        total_items: totalItemsCount,
        advancers_count: advancersCount,
        advancers_pct: advancersPct,
        decliners_count: declinersCount,
        decliners_pct: declinersPct,
        unchanged_count: unchangedCount,
        unchanged_pct: unchangedPct
      },
      pbs_spi_metrics: {
        spi_combined_index: report.spi_combined_index,
        spi_combined_wow_change: report.spi_combined_wow_change,
        spi_combined_yoy_change: report.spi_combined_yoy_change,
        spi_q1_index: report.spi_q1_index,
        week_ended_formatted: report.week_ended_formatted,
        published_date: report.published_date,
        source_url: report.source_page_url,
        source_excel_url: report.source_excel_url,
        annex_excel_url: report.annex_excel_url
      },
      top_gainers: topGainers,
      top_losers: allDecliners,
      key_anomalies: keyAnomalies,
      regional_spreads: regionalSpreads,
      social_ready_post: {
        platform: 'LinkedIn',
        title: `Pakistan Market Pulse — Week Ended ${report.week_ended_formatted}`,
        content: socialPostContent
      }
    };
  }
}

export const analyticsEngine = new AnalyticsEngine();
