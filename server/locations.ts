export interface LocationRecord {
  id: string;
  city: string;
  district: string;
  province: 'Punjab' | 'Sindh' | 'KPK' | 'Balochistan' | 'Federal';
  primary_market: string;
  market_type: 'Wholesale Mandi' | 'Terminal Port' | 'Retail Hub';
  population_weight: number;
  lat: number;
  lng: number;
  isEnabled: boolean;
}

/**
 * All 17 urban centers monitored by Pakistan Bureau of Statistics (PBS) SPI Appendix-A.
 */
export const LOCATION_MASTER: LocationRecord[] = [
  {
    id: 'isb',
    city: 'Islamabad',
    district: 'Islamabad',
    province: 'Federal',
    primary_market: 'I-11/4 & Sector Markets',
    market_type: 'Retail Hub',
    population_weight: 0.06,
    lat: 33.6844,
    lng: 73.0479,
    isEnabled: true
  },
  {
    id: 'rwp',
    city: 'Rawalpindi',
    district: 'Rawalpindi',
    province: 'Punjab',
    primary_market: 'Raja Bazaar & Ganj Mandi',
    market_type: 'Wholesale Mandi',
    population_weight: 0.08,
    lat: 33.5973,
    lng: 73.0479,
    isEnabled: true
  },
  {
    id: 'gjw',
    city: 'Gujranwala',
    district: 'Gujranwala',
    province: 'Punjab',
    primary_market: 'Gujranwala Ghalla & Sabzi Mandi',
    market_type: 'Wholesale Mandi',
    population_weight: 0.05,
    lat: 32.1877,
    lng: 74.1945,
    isEnabled: true
  },
  {
    id: 'skt',
    city: 'Sialkot',
    district: 'Sialkot',
    province: 'Punjab',
    primary_market: 'Sialkot Central Markets',
    market_type: 'Retail Hub',
    population_weight: 0.04,
    lat: 32.4945,
    lng: 74.5229,
    isEnabled: true
  },
  {
    id: 'lhr',
    city: 'Lahore',
    district: 'Lahore',
    province: 'Punjab',
    primary_market: 'Akbari Mandi & Badami Bagh',
    market_type: 'Wholesale Mandi',
    population_weight: 0.18,
    lat: 31.5204,
    lng: 74.3587,
    isEnabled: true
  },
  {
    id: 'fsd',
    city: 'Faisalabad',
    district: 'Faisalabad',
    province: 'Punjab',
    primary_market: 'Ghalla Mandi & Rail Bazaar',
    market_type: 'Wholesale Mandi',
    population_weight: 0.09,
    lat: 31.4504,
    lng: 73.1350,
    isEnabled: true
  },
  {
    id: 'sgd',
    city: 'Sargodha',
    district: 'Sargodha',
    province: 'Punjab',
    primary_market: 'Sargodha Central Mandi',
    market_type: 'Wholesale Mandi',
    population_weight: 0.03,
    lat: 32.0740,
    lng: 72.6861,
    isEnabled: true
  },
  {
    id: 'mux',
    city: 'Multan',
    district: 'Multan',
    province: 'Punjab',
    primary_market: 'Chungi No. 14 Grain & Vegetable Mandi',
    market_type: 'Wholesale Mandi',
    population_weight: 0.06,
    lat: 30.1575,
    lng: 71.5249,
    isEnabled: true
  },
  {
    id: 'bwp',
    city: 'Bahawalpur',
    district: 'Bahawalpur',
    province: 'Punjab',
    primary_market: 'Bahawalpur Central Market',
    market_type: 'Retail Hub',
    population_weight: 0.03,
    lat: 29.3544,
    lng: 71.6911,
    isEnabled: true
  },
  {
    id: 'khi',
    city: 'Karachi',
    district: 'Karachi Central',
    province: 'Sindh',
    primary_market: 'Sabzi Mandi Super Highway & Jodia Bazaar',
    market_type: 'Terminal Port',
    population_weight: 0.22,
    lat: 24.8607,
    lng: 67.0011,
    isEnabled: true
  },
  {
    id: 'hyd',
    city: 'Hyderabad',
    district: 'Hyderabad',
    province: 'Sindh',
    primary_market: 'Hyderabad Market Committee',
    market_type: 'Wholesale Mandi',
    population_weight: 0.04,
    lat: 25.3960,
    lng: 68.3578,
    isEnabled: true
  },
  {
    id: 'skz',
    city: 'Sukkur',
    district: 'Sukkur',
    province: 'Sindh',
    primary_market: 'Sukkur Grain & Produce Hub',
    market_type: 'Wholesale Mandi',
    population_weight: 0.02,
    lat: 27.7052,
    lng: 68.8574,
    isEnabled: true
  },
  {
    id: 'lrk',
    city: 'Larkana',
    district: 'Larkana',
    province: 'Sindh',
    primary_market: 'Larkana Retail Market',
    market_type: 'Retail Hub',
    population_weight: 0.02,
    lat: 27.5570,
    lng: 68.2028,
    isEnabled: true
  },
  {
    id: 'pew',
    city: 'Peshawar',
    district: 'Peshawar',
    province: 'KPK',
    primary_market: 'Inqilab Road Mandi & Rampura Gate',
    market_type: 'Wholesale Mandi',
    population_weight: 0.04,
    lat: 34.0151,
    lng: 71.5249,
    isEnabled: true
  },
  {
    id: 'bnu',
    city: 'Bannu',
    district: 'Bannu',
    province: 'KPK',
    primary_market: 'Bannu Bazaar',
    market_type: 'Retail Hub',
    population_weight: 0.01,
    lat: 32.9861,
    lng: 70.6042,
    isEnabled: true
  },
  {
    id: 'uet',
    city: 'Quetta',
    district: 'Quetta',
    province: 'Balochistan',
    primary_market: 'Hazar Ganji Wholesale Mandi',
    market_type: 'Wholesale Mandi',
    population_weight: 0.02,
    lat: 30.1798,
    lng: 66.9750,
    isEnabled: true
  },
  {
    id: 'kzd',
    city: 'Khuzdar',
    district: 'Khuzdar',
    province: 'Balochistan',
    primary_market: 'Khuzdar Retail Center',
    market_type: 'Retail Hub',
    population_weight: 0.01,
    lat: 27.8120,
    lng: 66.6167,
    isEnabled: true
  }
];

export function getLocationByCity(cityName: string): LocationRecord | undefined {
  const norm = cityName.trim().toLowerCase();
  return LOCATION_MASTER.find(l => l.city.toLowerCase() === norm);
}
