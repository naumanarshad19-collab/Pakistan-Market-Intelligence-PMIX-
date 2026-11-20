export interface PricePoint {
  date: string;
  isoDate: string;
  price: number;
  source?: string;
}

export interface CityOffer {
  city: string;
  price: number;
  varianceFromAvgPct?: number;
}

export interface CityConfig {
  id: string;
  city: string;
  district?: string;
  province?: string;
  primary_market?: string;
  market_type?: string;
  isEnabled: boolean;
  lat?: number;
  lng?: number;
}

export interface Commodity {
  id: string;
  sr?: number;
  name: string;
  urdu_name?: string;
  category: string;
  unit: string;
  currentPrice: number;
  previousPrice: number;
  yearAgoPrice?: number;
  priceChangePercentage: number; // Weekly WoW %
  weeklyChangePercentage: number; // Weekly WoW %
  yearlyChangePercentage?: number; // YoY %
  volatilityArchived?: number;
  verification?: {
    pbsVerified: boolean;
    mathCheckPassed: boolean;
    citiesVerifiedCount: number;
    weekEndedDate: string;
    amisStatus: 'not_implemented' | 'error' | 'verified';
    bosStatus: 'not_implemented' | 'error' | 'verified';
    label: string;
  };
  nationalMetrics?: {
    nationalAverage: number;
    nationalMedian: number;
    highestCity: { city: string; price: number };
    lowestCity: { city: string; price: number };
    citySpreadDelta: number;
    citySpreadPct: number;
  };
  historySeries: PricePoint[];
  lastUpdated: string;
  cityOffers?: CityOffer[];
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface DataSource {
  source_id: string;
  organization: string;
  name: string;
  url: string;
  geography: string;
  frequency: string;
  format: string;
  data_type: string;
  implementation_status: 'implemented' | 'not_implemented';
  parser: string;
  active: boolean;
  status: 'idle' | 'fetching' | 'success' | 'error' | 'not_implemented';
  status_detail: string;
  last_success: string | null;
  last_attempt: string | null;
  total_observations: number;
  coverage_notes: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  stage?: 'DISCOVER' | 'INGEST' | 'PARSE' | 'ARCHIVE' | 'VALIDATE' | 'PUBLISH';
  message: string;
  metadata?: unknown;
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

export interface ArchiveWeekSummary {
  week_ended_date: string;
  week_ended_formatted: string;
  published_date: string;
  spi_combined_index: number;
  spi_combined_wow_change: number;
  spi_combined_yoy_change: number;
  total_items: number;
  annex_status: 'verified' | 'failed';
  source_page_url: string;
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

export interface SourceVerificationComparison {
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
