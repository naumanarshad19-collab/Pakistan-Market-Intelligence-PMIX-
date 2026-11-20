export interface CanonicalCommodity {
  id: string;
  sr_default: number;
  pbs_name: string;
  canonical_name: string;
  urdu_name: string;
  category:
    | 'Grains & Staples'
    | 'Pulses'
    | 'Meat, Poultry & Dairy'
    | 'Oils & Condiments'
    | 'Vegetables & Fruits'
    | 'Prepared Food & Tobacco'
    | 'Clothing & Footwear'
    | 'Energy & Utilities'
    | 'Household & Telecom';
  display_unit: string;
  base_unit: string;
  unit_multiplier: number;
  volatility_profile: 'low' | 'medium' | 'high';
  exact_aliases: string[];
  description: string;
}

export function normalizeCommodityKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * 1:1 Canonical Catalog aligned strictly with the 51 official PBS Sensitive Price Indicator (SPI) commodities.
 * Names and units match the official Pakistan Bureau of Statistics (PBS) SPI Excel releases verbatim.
 */
export const COMMODITY_MASTER: CanonicalCommodity[] = [
  // 1. Grains & Staples
  {
    id: 'wheat_flour',
    sr_default: 1,
    pbs_name: 'Wheat Flour Bag',
    canonical_name: 'Wheat Flour Bag',
    urdu_name: 'آٹا تھیلا',
    category: 'Grains & Staples',
    display_unit: '20 Kg',
    base_unit: 'kg',
    unit_multiplier: 20,
    volatility_profile: 'medium',
    exact_aliases: ['wheat flour bag'],
    description: 'Standard 20 kg wheat flour bag monitored across 50 markets in 17 urban centers by PBS SPI.'
  },
  {
    id: 'rice_basmati_broken',
    sr_default: 2,
    pbs_name: 'Rice Basmati Broken (Average Quality)',
    canonical_name: 'Rice Basmati Broken (Average Quality)',
    urdu_name: 'ٹوٹا باسمتی چاول',
    category: 'Grains & Staples',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['rice basmati broken (average quality)'],
    description: 'Average quality broken Basmati rice tracked per kg in PBS SPI.'
  },
  {
    id: 'rice_irri',
    sr_default: 3,
    pbs_name: 'Rice IRRI-6/9 (Sindh/Punjab)',
    canonical_name: 'Rice IRRI-6/9 (Sindh/Punjab)',
    urdu_name: 'چاول اری',
    category: 'Grains & Staples',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['rice irri-6/9 (sindh/punjab)'],
    description: 'Non-basmati coarse IRRI-6/9 white rice across Sindh and Punjab retail markets.'
  },
  {
    id: 'bread_plain',
    sr_default: 4,
    pbs_name: 'Bread plain (Small Size)',
    canonical_name: 'Bread plain (Small Size)',
    urdu_name: 'ڈبل روٹی سادہ',
    category: 'Grains & Staples',
    display_unit: 'Each',
    base_unit: 'each',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['bread plain (small size)'],
    description: 'Standard small-size plain bakery bread loaf monitored in PBS SPI.'
  },

  // 2. Meat, Poultry & Dairy
  {
    id: 'beef_bone_in',
    sr_default: 5,
    pbs_name: 'Beef with Bone (Average Quality)',
    canonical_name: 'Beef with Bone (Average Quality)',
    urdu_name: 'گوشت بڑا ہڈی والا',
    category: 'Meat, Poultry & Dairy',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['beef with bone (average quality)'],
    description: 'Retail butcher rate for average quality beef with bone per kg.'
  },
  {
    id: 'mutton_goat',
    sr_default: 6,
    pbs_name: 'Mutton (Average Quality)',
    canonical_name: 'Mutton (Average Quality)',
    urdu_name: 'گوشت چھوٹا',
    category: 'Meat, Poultry & Dairy',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['mutton (average quality)'],
    description: 'Fresh average quality mutton retail rate per kg.'
  },
  {
    id: 'broiler_live',
    sr_default: 7,
    pbs_name: 'Chicken Farm Broiler (Live)',
    canonical_name: 'Chicken Farm Broiler (Live)',
    urdu_name: 'زندہ مرغی فارمی',
    category: 'Meat, Poultry & Dairy',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'high',
    exact_aliases: ['chicken farm broiler (live)'],
    description: 'Live farm broiler chicken retail price per kg.'
  },
  {
    id: 'fresh_milk',
    sr_default: 8,
    pbs_name: 'Milk fresh (Un-boiled)',
    canonical_name: 'Milk fresh (Un-boiled)',
    urdu_name: 'تازہ دودھ',
    category: 'Meat, Poultry & Dairy',
    display_unit: '1 Ltr',
    base_unit: 'litre',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['milk fresh (un-boiled)', 'milk fresh (unboiled)'],
    description: 'Loose un-boiled fresh milk retail rate per litre.'
  },
  {
    id: 'curd_dahi',
    sr_default: 9,
    pbs_name: 'Curd (Dahi) Loose',
    canonical_name: 'Curd (Dahi) Loose',
    urdu_name: 'دہی کھلا',
    category: 'Meat, Poultry & Dairy',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['curd (dahi) loose'],
    description: 'Loose retail yogurt (dahi) price per kg.'
  },
  {
    id: 'powdered_milk_nido',
    sr_default: 10,
    pbs_name: 'Powdered Milk NIDO 390 gm Polybag',
    canonical_name: 'Powdered Milk NIDO 390 gm Polybag',
    urdu_name: 'نیڈو خشک دودھ 390 گرام',
    category: 'Meat, Poultry & Dairy',
    display_unit: 'Each',
    base_unit: 'pack',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['powdered milk nido 390 gm polybag'],
    description: 'Packaged NIDO 390 gm powdered milk polybag retail price.'
  },
  {
    id: 'farm_eggs',
    sr_default: 11,
    pbs_name: 'Eggs Hen (Farm)',
    canonical_name: 'Eggs Hen (Farm)',
    urdu_name: 'انڈے فارمی',
    category: 'Meat, Poultry & Dairy',
    display_unit: '1 Dozen',
    base_unit: 'dozen',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['eggs hen (farm)'],
    description: 'Commercial farm hen eggs retail rate per dozen.'
  },

  // 3. Oils & Condiments
  {
    id: 'mustard_oil',
    sr_default: 12,
    pbs_name: 'Mustard Oil (Average Quality)',
    canonical_name: 'Mustard Oil (Average Quality)',
    urdu_name: 'سرسوں کا تیل',
    category: 'Oils & Condiments',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['mustard oil (average quality)'],
    description: 'Average quality mustard cooking oil retail rate per kg.'
  },
  {
    id: 'cooking_oil',
    sr_default: 13,
    pbs_name: 'Cooking Oil DALDA or Other Similar Brand (SN), 5 Litre Tin',
    canonical_name: 'Cooking Oil DALDA or Other Similar Brand (SN), 5 Litre Tin',
    urdu_name: 'کوکنگ آئل 5 لیٹر ٹن',
    category: 'Oils & Condiments',
    display_unit: 'Each',
    base_unit: 'tin',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['cooking oil dalda or other similar brand (sn), 5 litre tin'],
    description: 'Standard 5-litre branded cooking oil tin.'
  },
  {
    id: 'vegetable_ghee_tin',
    sr_default: 14,
    pbs_name: 'Vegetable Ghee DALDA/HABIB 2.5 kg Tin',
    canonical_name: 'Vegetable Ghee DALDA/HABIB 2.5 kg Tin',
    urdu_name: 'بناسپتی گھی 2.5 کلو ٹن',
    category: 'Oils & Condiments',
    display_unit: 'Each',
    base_unit: 'tin',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['vegetable ghee dalda/habib 2.5 kg tin'],
    description: 'Branded 2.5 kg vegetable ghee tin.'
  },
  {
    id: 'vegetable_ghee_pouch',
    sr_default: 15,
    pbs_name: 'Vegetable Ghee DALDA/HABIB or Other superior Quality 1 kg Pouch',
    canonical_name: 'Vegetable Ghee DALDA/HABIB or Other superior Quality 1 kg Pouch',
    urdu_name: 'بناسپتی گھی 1 کلو پاؤچ',
    category: 'Oils & Condiments',
    display_unit: 'Each',
    base_unit: 'pouch',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['vegetable ghee dalda/habib or other superior quality 1 kg pouch'],
    description: 'Branded 1 kg vegetable ghee pouch.'
  },

  // 4. Fruits & Vegetables
  {
    id: 'banana_dozen',
    sr_default: 16,
    pbs_name: 'Bananas (Kela) Local',
    canonical_name: 'Bananas (Kela) Local',
    urdu_name: 'کیلا دیسی',
    category: 'Vegetables & Fruits',
    display_unit: '1 Dozen',
    base_unit: 'dozen',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['bananas (kela) local'],
    description: 'Local fresh bananas retail rate per dozen.'
  },

  // 5. Pulses
  {
    id: 'daal_masoor',
    sr_default: 17,
    pbs_name: 'Pulse Masoor (Washed)',
    canonical_name: 'Pulse Masoor (Washed)',
    urdu_name: 'دال مسور دھلی ہوئی',
    category: 'Pulses',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['pulse masoor (washed)'],
    description: 'Washed red lentil (Masoor) retail price per kg.'
  },
  {
    id: 'daal_moong',
    sr_default: 18,
    pbs_name: 'Pulse Moong (Washed)',
    canonical_name: 'Pulse Moong (Washed)',
    urdu_name: 'دال مونگ دھلی ہوئی',
    category: 'Pulses',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['pulse moong (washed)'],
    description: 'Washed yellow moong pulse retail price per kg.'
  },
  {
    id: 'daal_mash',
    sr_default: 19,
    pbs_name: 'Pulse Mash (Washed)',
    canonical_name: 'Pulse Mash (Washed)',
    urdu_name: 'دال ماش دھلی ہوئی',
    category: 'Pulses',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['pulse mash (washed)'],
    description: 'Washed urad (Mash) pulse retail price per kg.'
  },
  {
    id: 'daal_chana',
    sr_default: 20,
    pbs_name: 'Pulse Gram',
    canonical_name: 'Pulse Gram',
    urdu_name: 'دال چنا',
    category: 'Pulses',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['pulse gram'],
    description: 'Split Bengal gram pulse (Daal Chana) retail price per kg.'
  },

  // Vegetables & Sweeteners & Spices
  {
    id: 'potato_fresh',
    sr_default: 21,
    pbs_name: 'Potatoes',
    canonical_name: 'Potatoes',
    urdu_name: 'آلو',
    category: 'Vegetables & Fruits',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'high',
    exact_aliases: ['potatoes'],
    description: 'Fresh potatoes retail rate per kg.'
  },
  {
    id: 'onion_dry',
    sr_default: 22,
    pbs_name: 'Onions',
    canonical_name: 'Onions',
    urdu_name: 'پیاز',
    category: 'Vegetables & Fruits',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'high',
    exact_aliases: ['onions'],
    description: 'Dry onions retail rate per kg.'
  },
  {
    id: 'tomato_fresh',
    sr_default: 23,
    pbs_name: 'Tomatoes',
    canonical_name: 'Tomatoes',
    urdu_name: 'ٹماٹر',
    category: 'Vegetables & Fruits',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'high',
    exact_aliases: ['tomatoes'],
    description: 'Fresh tomatoes retail rate per kg.'
  },
  {
    id: 'sugar_refined',
    sr_default: 24,
    pbs_name: 'Sugar Refined',
    canonical_name: 'Sugar Refined',
    urdu_name: 'چینی',
    category: 'Grains & Staples',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['sugar refined'],
    description: 'Refined white cane sugar retail price per kg.'
  },
  {
    id: 'gur_jaggery',
    sr_default: 25,
    pbs_name: 'Gur (Average Quality)',
    canonical_name: 'Gur (Average Quality)',
    urdu_name: 'گڑ',
    category: 'Grains & Staples',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['gur (average quality)'],
    description: 'Traditional unrefined cane jaggery (Gur) retail price per kg.'
  },
  {
    id: 'salt_powdered',
    sr_default: 26,
    pbs_name: 'Salt Powdered (NATIONAL/SHAN) 800 gm Packet',
    canonical_name: 'Salt Powdered (NATIONAL/SHAN) 800 gm Packet',
    urdu_name: 'نمک 800 گرام پیکٹ',
    category: 'Oils & Condiments',
    display_unit: 'Each',
    base_unit: 'pack',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['salt powdered (national/shan) 800 gm packet'],
    description: 'Packaged iodized table salt (800 gm packet).'
  },
  {
    id: 'chilies_powder',
    sr_default: 27,
    pbs_name: 'Chilies Powder NATIONAL 200 gm Packet',
    canonical_name: 'Chilies Powder NATIONAL 200 gm Packet',
    urdu_name: 'سرخ مرچ پاؤڈر 200 گرام',
    category: 'Oils & Condiments',
    display_unit: 'Each',
    base_unit: 'pack',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['chilies powder national 200 gm packet'],
    description: 'Packaged red chili powder (200 gm packet).'
  },
  {
    id: 'garlic_desi',
    sr_default: 28,
    pbs_name: 'Garlic (Lehsun)',
    canonical_name: 'Garlic (Lehsun)',
    urdu_name: 'لہسن',
    category: 'Vegetables & Fruits',
    display_unit: '1 Kg',
    base_unit: 'kg',
    unit_multiplier: 1,
    volatility_profile: 'high',
    exact_aliases: ['garlic (lehsun)'],
    description: 'Garlic (Lehsun) retail price per kg.'
  },
  {
    id: 'tea_lipton',
    sr_default: 29,
    pbs_name: 'Tea Lipton Yellow Label 190 gm Packet',
    canonical_name: 'Tea Lipton Yellow Label 190 gm Packet',
    urdu_name: 'چائے کی پتی 190 گرام',
    category: 'Oils & Condiments',
    display_unit: 'Each',
    base_unit: 'pack',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['tea lipton yellow label 190 gm packet'],
    description: 'Packaged black tea (Lipton Yellow Label 190 gm).'
  },

  // 6. Prepared Food & Tobacco
  {
    id: 'tea_prepared',
    sr_default: 30,
    pbs_name: 'Tea Prepared Ordinary',
    canonical_name: 'Tea Prepared Ordinary',
    urdu_name: 'تیار چائے کپ',
    category: 'Prepared Food & Tobacco',
    display_unit: 'Per Cup',
    base_unit: 'cup',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['tea prepared ordinary'],
    description: 'Prepared ordinary tea per cup at local tea stalls/hotels.'
  },
  {
    id: 'cooked_beef',
    sr_default: 31,
    pbs_name: 'Cooked Beef at Average Hotel',
    canonical_name: 'Cooked Beef at Average Hotel',
    urdu_name: 'پکا ہوا گوشت پلیٹ',
    category: 'Prepared Food & Tobacco',
    display_unit: 'Per Plate',
    base_unit: 'plate',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['cooked beef at average hotel'],
    description: 'Cooked beef serving per plate at average hotel.'
  },
  {
    id: 'cooked_daal',
    sr_default: 32,
    pbs_name: 'Cooked Daal at Average Hotel',
    canonical_name: 'Cooked Daal at Average Hotel',
    urdu_name: 'پکی ہوئی دال پلیٹ',
    category: 'Prepared Food & Tobacco',
    display_unit: 'Per Plate',
    base_unit: 'plate',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['cooked daal at average hotel'],
    description: 'Cooked pulse (Daal) serving per plate at average hotel.'
  },
  {
    id: 'cigarettes_capstan',
    sr_default: 33,
    pbs_name: "Cigarettes Capstan 20'S Packet",
    canonical_name: "Cigarettes Capstan 20'S Packet",
    urdu_name: 'سگریٹ کیپسٹن 20 پیکٹ',
    category: 'Prepared Food & Tobacco',
    display_unit: 'Each',
    base_unit: 'pack',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ["cigarettes capstan 20's packet", 'cigarettes capstan 20s packet'],
    description: "Capstan 20's cigarette packet retail price."
  },

  // 7. Clothing & Footwear
  {
    id: 'long_cloth',
    sr_default: 34,
    pbs_name: 'Long Cloth 57" Gul Ahmed/Al Karam',
    canonical_name: 'Long Cloth 57" Gul Ahmed/Al Karam',
    urdu_name: 'لٹھا 57 انچ',
    category: 'Clothing & Footwear',
    display_unit: '1 mtr',
    base_unit: 'meter',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['long cloth 57" gul ahmed/al karam'],
    description: '57-inch width cotton long cloth per meter.'
  },
  {
    id: 'shirting_cloth',
    sr_default: 35,
    pbs_name: 'Shirting (Average Quality)',
    canonical_name: 'Shirting (Average Quality)',
    urdu_name: 'شرٹنگ کپڑا',
    category: 'Clothing & Footwear',
    display_unit: '1 mtr',
    base_unit: 'meter',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['shirting (average quality)'],
    description: 'Average quality shirting fabric per meter.'
  },
  {
    id: 'lawn_printed',
    sr_default: 36,
    pbs_name: 'Lawn Printed Gul Ahmed/Al Karam',
    canonical_name: 'Lawn Printed Gul Ahmed/Al Karam',
    urdu_name: 'پرنٹڈ لان',
    category: 'Clothing & Footwear',
    display_unit: '1 mtr',
    base_unit: 'meter',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['lawn printed gul ahmed/al karam'],
    description: 'Printed summer lawn fabric per meter.'
  },
  {
    id: 'georgette_cloth',
    sr_default: 37,
    pbs_name: 'Georgette (Average Quality)',
    canonical_name: 'Georgette (Average Quality)',
    urdu_name: 'جارجٹ کپڑا',
    category: 'Clothing & Footwear',
    display_unit: '1 mtr',
    base_unit: 'meter',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['georgette (average quality)'],
    description: 'Average quality georgette fabric per meter.'
  },
  {
    id: 'gents_sandal_bata',
    sr_default: 38,
    pbs_name: 'Gents Sandal Bata',
    canonical_name: 'Gents Sandal Bata',
    urdu_name: 'مردانہ سینڈل باٹا',
    category: 'Clothing & Footwear',
    display_unit: 'Pair',
    base_unit: 'pair',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['gents sandal bata'],
    description: 'Standard Bata gents sandal retail pair price.'
  },
  {
    id: 'gents_chappal_bata',
    sr_default: 39,
    pbs_name: 'Gents Sponge Chappal Bata',
    canonical_name: 'Gents Sponge Chappal Bata',
    urdu_name: 'مردانہ چپل باٹا',
    category: 'Clothing & Footwear',
    display_unit: 'Pair',
    base_unit: 'pair',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['gents sponge chappal bata'],
    description: 'Standard Bata gents sponge chappal retail pair price.'
  },
  {
    id: 'ladies_sandal_bata',
    sr_default: 40,
    pbs_name: 'Ladies Sandal Bata',
    canonical_name: 'Ladies Sandal Bata',
    urdu_name: 'زنانہ سینڈل باٹا',
    category: 'Clothing & Footwear',
    display_unit: 'Pair',
    base_unit: 'pair',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['ladies sandal bata'],
    description: 'Standard Bata ladies sandal retail pair price.'
  },

  // 8. Energy & Utilities
  {
    id: 'electricity_q1',
    sr_default: 41,
    pbs_name: 'Electricity Charges for Q1',
    canonical_name: 'Electricity Charges for Q1',
    urdu_name: 'بجلی فی یونٹ',
    category: 'Energy & Utilities',
    display_unit: 'Per Unit',
    base_unit: 'kWh',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['electricity charges for q1'],
    description: 'Lowest consumption quintile (Q1) domestic electricity tariff per unit.'
  },
  {
    id: 'gas_charges_q1',
    sr_default: 42,
    pbs_name: 'Gas Charges for Q1',
    canonical_name: 'Gas Charges for Q1',
    urdu_name: 'قدرتی گیس ایم ایم بی ٹی یو',
    category: 'Energy & Utilities',
    display_unit: 'MMBTU',
    base_unit: 'MMBTU',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['gas charges for q1'],
    description: 'Lowest consumption quintile (Q1) piped natural gas tariff per MMBTU.'
  },
  {
    id: 'energy_saver_bulb',
    sr_default: 43,
    pbs_name: 'Energy Saver Philips 14 Watt',
    canonical_name: 'Energy Saver Philips 14 Watt',
    urdu_name: 'انرجی سیور 14 واٹ',
    category: 'Household & Telecom',
    display_unit: 'Each',
    base_unit: 'each',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['energy saver philips 14 watt'],
    description: 'Philips 14-watt household energy saver bulb.'
  },
  {
    id: 'lpg_cylinder',
    sr_default: 44,
    pbs_name: 'LPG 11.67 kg Cylinder',
    canonical_name: 'LPG 11.67 kg Cylinder',
    urdu_name: 'ایل پی جی سلنڈر 11.67 کلو',
    category: 'Energy & Utilities',
    display_unit: 'Each',
    base_unit: 'cylinder',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['lpg 11.67 kg cylinder'],
    description: 'Domestic 11.67 kg liquefied petroleum gas cylinder price monitored by PBS SPI.'
  },
  {
    id: 'firewood_household',
    sr_default: 45,
    pbs_name: 'Firewood Whole',
    canonical_name: 'Firewood Whole',
    urdu_name: 'لکڑی جلانے والی',
    category: 'Energy & Utilities',
    display_unit: '40 Kg',
    base_unit: '40kg',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['firewood whole'],
    description: 'Whole household firewood per 40 kg maund.'
  },

  // 9. Household & Telecom + Fuel
  {
    id: 'match_box',
    sr_default: 46,
    pbs_name: 'Match Box',
    canonical_name: 'Match Box',
    urdu_name: 'ماچس ڈبی',
    category: 'Household & Telecom',
    display_unit: 'Each',
    base_unit: 'each',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['match box'],
    description: 'Standard household safety match box.'
  },
  {
    id: 'washing_soap_sufi',
    sr_default: 47,
    pbs_name: 'Sufi Washing Soap 250 gm Cake',
    canonical_name: 'Sufi Washing Soap 250 gm Cake',
    urdu_name: 'صوفی دھلائی صابن 250 گرام',
    category: 'Household & Telecom',
    display_unit: 'Each',
    base_unit: 'cake',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['sufi washing soap 250 gm cake'],
    description: 'Sufi 250 gm laundry washing soap cake.'
  },
  {
    id: 'toilet_soap_lifebuoy',
    sr_default: 48,
    pbs_name: 'Toilet Soap LIFEBUOY 115 gm',
    canonical_name: 'Toilet Soap LIFEBUOY 115 gm',
    urdu_name: 'لائف بوائے صابن 115 گرام',
    category: 'Household & Telecom',
    display_unit: 'Each',
    base_unit: 'cake',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['toilet soap lifebuoy 115 gm'],
    description: 'Lifebuoy 115 gm bath soap bar.'
  },
  {
    id: 'fuel_petrol',
    sr_default: 49,
    pbs_name: 'Petrol Super',
    canonical_name: 'Petrol Super',
    urdu_name: 'پیٹرول سپر',
    category: 'Energy & Utilities',
    display_unit: 'Per Litre',
    base_unit: 'litre',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['petrol super'],
    description: 'Regulated motor gasoline (Petrol Super) retail price per litre.'
  },
  {
    id: 'fuel_diesel',
    sr_default: 50,
    pbs_name: 'Hi-Speed Diesel',
    canonical_name: 'Hi-Speed Diesel',
    urdu_name: 'ہائی اسپیڈ ڈیزل',
    category: 'Energy & Utilities',
    display_unit: 'Per Litre',
    base_unit: 'litre',
    unit_multiplier: 1,
    volatility_profile: 'medium',
    exact_aliases: ['hi-speed diesel'],
    description: 'Regulated High-Speed Diesel (HSD) retail price per litre.'
  },
  {
    id: 'telephone_call_charges',
    sr_default: 51,
    pbs_name: 'Telephone Call Charges',
    canonical_name: 'Telephone Call Charges',
    urdu_name: 'ٹیلی فون کال چارجز',
    category: 'Household & Telecom',
    display_unit: 'Per Minute',
    base_unit: 'minute',
    unit_multiplier: 1,
    volatility_profile: 'low',
    exact_aliases: ['telephone call charges'],
    description: 'Domestic telephone call tariff per minute.'
  }
];

const EXACT_LOOKUP = new Map<string, CanonicalCommodity>();
for (const item of COMMODITY_MASTER) {
  EXACT_LOOKUP.set(normalizeCommodityKey(item.pbs_name), item);
  EXACT_LOOKUP.set(normalizeCommodityKey(item.id), item);
  for (const alias of item.exact_aliases) {
    EXACT_LOOKUP.set(normalizeCommodityKey(alias), item);
  }
}

/**
 * Strictly deterministic, exact normalized lookup. No unsafe substring fuzzy matching.
 */
export function resolveCommodityExact(rawName: string): CanonicalCommodity | null {
  const key = normalizeCommodityKey(rawName);
  return EXACT_LOOKUP.get(key) || null;
}
