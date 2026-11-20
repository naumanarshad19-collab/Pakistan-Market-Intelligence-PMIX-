export type SourceRuntimeStatus =
  | 'idle'
  | 'fetching'
  | 'success'
  | 'error'
  | 'not_implemented';

export interface DataSourceRecord {
  source_id: string;
  organization: string;
  name: string;
  url: string;
  geography: 'National' | 'Punjab' | 'Sindh' | 'KPK' | 'Balochistan' | 'Federal';
  frequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
  format: 'HTML Table' | 'Excel / XLSX' | 'JSON API' | 'PDF Bulletins';
  data_type: 'Wholesale Mandi' | 'Retail SPI' | 'Official Benchmark' | 'Interbank';
  implementation_status: 'implemented' | 'not_implemented';
  parser: string;
  active: boolean;
  last_success: string | null;
  last_attempt: string | null;
  status: SourceRuntimeStatus;
  status_detail: string;
  total_observations: number;
  coverage_notes: string;
}

export const INITIAL_SOURCE_REGISTRY: DataSourceRecord[] = [
  {
    source_id: 'PBS_SPI',
    organization: 'Pakistan Bureau of Statistics (PBS)',
    name: 'Weekly Sensitive Price Indicator (SPI)',
    url: 'https://www.pbs.gov.pk/price-statistics/',
    geography: 'National',
    frequency: 'Weekly',
    format: 'Excel / XLSX',
    data_type: 'Retail SPI',
    implementation_status: 'implemented',
    parser: 'PbsHeaderExcelParser',
    active: true,
    last_success: null,
    last_attempt: null,
    status: 'idle',
    status_detail: 'Dynamic release discovery via PBS WP-JSON & Price Statistics portal.',
    total_observations: 0,
    coverage_notes: 'Federal benchmark covering 51 essential commodities across 50 markets in 17 urban centers.'
  },
  {
    source_id: 'SBP_FOREX',
    organization: 'Exchange Rate Reference (USD/PKR)',
    name: 'USD/PKR Interbank & Parity Feed',
    url: 'https://open.er-api.com/v6/latest/USD',
    geography: 'National',
    frequency: 'Daily',
    format: 'JSON API',
    data_type: 'Interbank',
    implementation_status: 'implemented',
    parser: 'ForexJsonParser',
    active: true,
    last_success: null,
    last_attempt: null,
    status: 'idle',
    status_detail: 'Live JSON feed for USD/PKR exchange rate reference.',
    total_observations: 0,
    coverage_notes: 'USD/PKR parity context for imported pulses, edible oils, and energy.'
  },
  {
    source_id: 'AMIS',
    organization: 'Agriculture Marketing Information Service (AMIS)',
    name: 'Punjab Agriculture Marketing Department',
    url: 'http://www.amis.pk/',
    geography: 'Punjab',
    frequency: 'Daily',
    format: 'HTML Table',
    data_type: 'Wholesale Mandi',
    implementation_status: 'not_implemented',
    parser: 'AmisAspNetNotImplemented',
    active: false,
    last_success: null,
    last_attempt: null,
    status: 'not_implemented',
    status_detail: 'Not implemented: AMIS price tables require ASP.NET WebForms/ReportViewer postback sessions.',
    total_observations: 0,
    coverage_notes: 'Connector unimplemented; excluded from prices and cross-validation until live ASP.NET scraper exists.'
  },
  {
    source_id: 'PUNJAB_BOS',
    organization: 'Bureau of Statistics, Government of the Punjab',
    name: 'Punjab BOS Market Price Bulletins',
    url: 'https://bos.punjab.gov.pk/',
    geography: 'Punjab',
    frequency: 'Daily',
    format: 'HTML Table',
    data_type: 'Retail SPI',
    implementation_status: 'not_implemented',
    parser: 'PunjabBosNotImplemented',
    active: false,
    last_success: null,
    last_attempt: null,
    status: 'not_implemented',
    status_detail: 'Not implemented: Endpoint unreachable/timed out during live verification.',
    total_observations: 0,
    coverage_notes: 'Connector unimplemented; excluded from prices and cross-validation.'
  },
  {
    source_id: 'KCA',
    organization: 'Karachi Cotton Association',
    name: 'KCA Official Spot Rate Committee',
    url: 'https://www.kcapk.org/',
    geography: 'National',
    frequency: 'Daily',
    format: 'HTML Table',
    data_type: 'Wholesale Mandi',
    implementation_status: 'not_implemented',
    parser: 'KcaNotImplemented',
    active: false,
    last_success: null,
    last_attempt: null,
    status: 'not_implemented',
    status_detail: 'Not implemented: Endpoint unreachable/timed out and Cotton is outside the 51-item SPI basket.',
    total_observations: 0,
    coverage_notes: 'Non-SPI commodity source; excluded from SPI market breadth.'
  }
];
