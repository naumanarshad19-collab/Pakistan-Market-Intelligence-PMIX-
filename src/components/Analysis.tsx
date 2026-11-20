import React, { useState, useMemo, useEffect } from 'react';
import { Commodity, PricePoint } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { BarChart2, ArrowRightLeft, TrendingUp, Activity, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';
import { AnalysisReport } from './AnalysisReport';

interface AnalysisProps {
  commodities: Commodity[];
}

export function Analysis({ commodities }: AnalysisProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'compare'>('single');
  const [showReport, setShowReport] = useState(false);

  // Number of archived weekly observations to show (4, 12, or all archived)
  const [pointLimit, setPointLimit] = useState<number>(999);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    commodities.forEach((c) => {
      c.cityOffers?.forEach((o) => cities.add(o.city));
    });
    return Array.from(cities).sort();
  }, [commodities]);

  const [analysisCity, setAnalysisCity] = useState<string>('All');
  const [singleSelectedId, setSingleSelectedId] = useState<string>(commodities[0]?.id || '');

  // Real city-specific historical series cache (fetched from /api/history/:id?city=...)
  const [singleCityHistory, setSingleCityHistory] = useState<PricePoint[] | null>(null);

  // Compare State
  const [compareId1, setCompareId1] = useState<string>(commodities[0]?.id || '');
  const [compareCity1, setCompareCity1] = useState<string>('All');
  const [compareHistory1, setCompareHistory1] = useState<PricePoint[] | null>(null);

  const [compareId2, setCompareId2] = useState<string>(commodities[1]?.id || commodities[0]?.id || '');
  const [compareCity2, setCompareCity2] = useState<string>('All');
  const [compareHistory2, setCompareHistory2] = useState<PricePoint[] | null>(null);

  useEffect(() => {
    if (!singleSelectedId && commodities.length > 0) {
      setSingleSelectedId(commodities[0].id);
    }
    if (!compareId1 && commodities.length > 0) {
      setCompareId1(commodities[0].id);
    }
    if (!compareId2 && commodities.length > 1) {
      setCompareId2(commodities[1].id);
    }
  }, [commodities, singleSelectedId, compareId1, compareId2]);

  // Fetch real Appendix-A historical series when a specific city is selected
  useEffect(() => {
    if (!singleSelectedId || analysisCity === 'All') {
      setSingleCityHistory(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/history/${encodeURIComponent(singleSelectedId)}?city=${encodeURIComponent(analysisCity)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.historySeries) {
          setSingleCityHistory(data.historySeries);
        }
      })
      .catch(() => {
        if (!cancelled) setSingleCityHistory(null);
      });
    return () => {
      cancelled = true;
    };
  }, [singleSelectedId, analysisCity]);

  useEffect(() => {
    if (!compareId1 || compareCity1 === 'All') {
      setCompareHistory1(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/history/${encodeURIComponent(compareId1)}?city=${encodeURIComponent(compareCity1)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.historySeries) {
          setCompareHistory1(data.historySeries);
        }
      })
      .catch(() => {
        if (!cancelled) setCompareHistory1(null);
      });
    return () => {
      cancelled = true;
    };
  }, [compareId1, compareCity1]);

  useEffect(() => {
    if (!compareId2 || compareCity2 === 'All') {
      setCompareHistory2(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/history/${encodeURIComponent(compareId2)}?city=${encodeURIComponent(compareCity2)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.historySeries) {
          setCompareHistory2(data.historySeries);
        }
      })
      .catch(() => {
        if (!cancelled) setCompareHistory2(null);
      });
    return () => {
      cancelled = true;
    };
  }, [compareId2, compareCity2]);

  const baseSingleCommodity = useMemo(
    () => commodities.find((c) => c.id === singleSelectedId) || commodities[0],
    [commodities, singleSelectedId]
  );

  const singleCommodity = useMemo(() => {
    if (!baseSingleCommodity) return undefined;
    if (analysisCity === 'All') return baseSingleCommodity;
    const cityOffer = baseSingleCommodity.cityOffers?.find((o) => o.city === analysisCity);
    return {
      ...baseSingleCommodity,
      currentPrice: cityOffer ? cityOffer.price : baseSingleCommodity.currentPrice,
      historySeries: singleCityHistory ?? baseSingleCommodity.historySeries
    };
  }, [baseSingleCommodity, analysisCity, singleCityHistory]);

  const compareComm1 = useMemo(
    () => commodities.find((c) => c.id === compareId1),
    [commodities, compareId1]
  );
  const compareComm2 = useMemo(
    () => commodities.find((c) => c.id === compareId2),
    [commodities, compareId2]
  );

  // Derived stats strictly from real archived observations
  const singleStats = useMemo(() => {
    if (!singleCommodity) return null;
    const rawSeries = singleCommodity.historySeries || [];
    const slicedHistory = pointLimit >= rawSeries.length ? rawSeries : rawSeries.slice(-pointLimit);

    if (slicedHistory.length === 0) {
      return {
        max: singleCommodity.currentPrice,
        min: singleCommodity.currentPrice,
        avg: singleCommodity.currentPrice,
        volatility: 0,
        historyWithSMA: []
      };
    }

    const prices = slicedHistory.map((d) => d.price);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const volatility = min > 0 ? ((max - min) / min) * 100 : 0;

    // 4-observation Simple Moving Average (SMA) over archived releases
    const historyWithSMA = slicedHistory.map((point, index, arr) => {
      let sma4: number | null = null;
      if (index >= 3) {
        const slice = arr.slice(index - 3, index + 1);
        sma4 = slice.reduce((sum, p) => sum + p.price, 0) / slice.length;
      }
      return { ...point, sma7: sma4 ? Number(sma4.toFixed(2)) : null };
    });

    return { max, min, avg, volatility, historyWithSMA };
  }, [singleCommodity, pointLimit]);

  // Comparison aligned by isoDate across real archived PBS releases
  const compareData = useMemo(() => {
    if (!compareComm1 || !compareComm2) return [];

    const series1Raw: PricePoint[] = compareCity1 === 'All' ? (compareComm1.historySeries || []) : (compareHistory1 ?? compareComm1.historySeries ?? []);
    const series2Raw: PricePoint[] = compareCity2 === 'All' ? (compareComm2.historySeries || []) : (compareHistory2 ?? compareComm2.historySeries ?? []);

    const map2 = new Map<string, PricePoint>(series2Raw.map((p) => [p.isoDate, p]));
    const sharedPoints = series1Raw.filter((p) => map2.has(p.isoDate));
    const sliced1 = pointLimit >= sharedPoints.length ? sharedPoints : sharedPoints.slice(-pointLimit);

    if (sliced1.length === 0) return [];

    const base1 = sliced1[0].price || 1;
    const base2 = map2.get(sliced1[0].isoDate)?.price || 1;

    return sliced1.map((point1) => {
      const point2 = map2.get(point1.isoDate)!;
      const change1 = ((point1.price - base1) / base1) * 100;
      const change2 = ((point2.price - base2) / base2) * 100;

      return {
        date: point1.date,
        [`${compareComm1.name} (${compareCity1})`]: Number(change1.toFixed(2)),
        [`${compareComm2.name} (${compareCity2})`]: Number(change2.toFixed(2)),
        raw1: point1.price,
        raw2: point2.price
      };
    });
  }, [compareComm1, compareComm2, compareCity1, compareCity2, compareHistory1, compareHistory2, pointLimit]);

  const singleRegionalSpread = useMemo(() => {
    if (!singleCommodity || !singleCommodity.cityOffers) return [];

    return singleCommodity.cityOffers
      .filter((offer) => analysisCity === 'All' || offer.city !== analysisCity)
      .map((offer) => {
        const diff =
          singleCommodity.currentPrice > 0
            ? ((offer.price - singleCommodity.currentPrice) / singleCommodity.currentPrice) * 100
            : 0;
        return {
          city: offer.city,
          price: offer.price,
          diff: Number(diff.toFixed(2))
        };
      })
      .sort((a, b) => b.diff - a.diff);
  }, [singleCommodity, analysisCity]);

  if (commodities.length === 0) {
    return (
      <div className="col-span-1 lg:col-span-10 flex-1 flex items-center justify-center p-6 bg-[#F8F9FA]">
        <div className="text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">No Verified Data Available</h2>
          <p className="text-sm text-slate-500 mt-2">
            Run the live PBS SPI pipeline from Settings to populate verified historical series.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-1 lg:col-span-10 flex-1 overflow-y-auto p-6 md:p-10 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Technical Analysis</h2>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Archived PBS SPI weekly trajectories and real Appendix-A city comparisons.
            </p>
          </div>

          <div className="flex gap-3 items-center shrink-0 flex-wrap">
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <div className="flex bg-white border border-slate-200 rounded-md p-1">
              <select
                value={analysisCity}
                onChange={(e) => setAnalysisCity(e.target.value)}
                className="px-2 py-1 text-xs font-bold bg-transparent border-0 focus:ring-0 text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Cities (PBS Natl Avg)</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex bg-white border border-slate-200 rounded-md p-1">
              <button
                onClick={() => setActiveTab('single')}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded transition-colors',
                  activeTab === 'single' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <BarChart2 className="w-4 h-4" />
                Single Analysis
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded transition-colors',
                  activeTab === 'compare' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Compare
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'single' && singleCommodity && singleStats && (
          <div className="space-y-6">
            {/* Control */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">
                  Select Commodity:
                </label>
                <select
                  value={singleSelectedId}
                  onChange={(e) => setSingleSelectedId(e.target.value)}
                  className="flex-1 min-w-[220px] rounded border border-slate-200 py-2 px-3 text-sm bg-slate-50 focus:outline-none focus:border-emerald-500 font-bold text-slate-800"
                >
                  {commodities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center bg-slate-100 rounded p-1 border border-slate-200 shrink-0">
                <button
                  onClick={() => setPointLimit(4)}
                  className={cn(
                    'px-3 py-1 text-xs font-bold rounded transition-colors',
                    pointLimit === 4 ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  4 Releases
                </button>
                <button
                  onClick={() => setPointLimit(12)}
                  className={cn(
                    'px-3 py-1 text-xs font-bold rounded transition-colors',
                    pointLimit === 12 ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  12 Releases
                </button>
                <button
                  onClick={() => setPointLimit(999)}
                  className={cn(
                    'px-3 py-1 text-xs font-bold rounded transition-colors',
                    pointLimit === 999 ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  All Archived
                </button>
              </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Latest Price ({analysisCity})
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  Rs {singleCommodity.currentPrice.toLocaleString()}
                </div>
                <div
                  className={cn(
                    'text-xs font-bold font-mono flex items-center mt-1',
                    singleCommodity.weeklyChangePercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {singleCommodity.weeklyChangePercentage >= 0 ? '+' : ''}
                  {singleCommodity.weeklyChangePercentage.toFixed(2)}% (WoW)
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Archived High
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  Rs {singleStats.max.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Across {singleStats.historyWithSMA.length} points
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Archived Low
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  Rs {singleStats.min.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Avg Rs {Math.round(singleStats.avg).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Range Spread
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {singleStats.volatility.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">High-to-Low Span</div>
              </div>
            </div>

            {/* Chart & Text Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                      Archived PBS SPI Price History ({analysisCity})
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                      {singleStats.historyWithSMA.length} Verified Releases · 4-Release Moving Average
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500" />
                      PBS Price
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <div className="w-3 h-0.5 bg-blue-500" /> 4-Pt SMA
                    </div>
                  </div>
                </div>
                <div className="h-72 w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={singleStats.historyWithSMA}
                      margin={{ top: 10, right: 0, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        minTickGap={20}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(val) => `Rs ${val}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ color: '#0f172a', fontWeight: 700, fontSize: '12px' }}
                        labelStyle={{
                          color: '#64748b',
                          textTransform: 'uppercase',
                          fontSize: '10px',
                          letterSpacing: '0.05em'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        name="PBS SPI Price"
                      />
                      <Line
                        type="monotone"
                        dataKey="sma7"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                        name="4-Release SMA"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-span-1 bg-white p-6 rounded-xl border border-slate-200 flex flex-col">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">
                  Archived Summary & Appendix-A Spread
                </h3>
                <div className="flex-1 space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Observed Range
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Across <strong className="font-mono">{singleStats.historyWithSMA.length}</strong>{' '}
                      archived PBS releases, {singleCommodity.name} traded between{' '}
                      <strong className="font-mono">Rs {singleStats.min.toLocaleString()}</strong> and{' '}
                      <strong className="font-mono">Rs {singleStats.max.toLocaleString()}</strong> (
                      <strong className="font-mono">{singleStats.volatility.toFixed(1)}%</strong>{' '}
                      span).
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Verified Appendix-A Spread
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      Variance vs {analysisCity === 'All' ? 'National Avg' : analysisCity}:
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {singleRegionalSpread.length > 0 ? (
                        singleRegionalSpread.map((spread) => (
                          <div
                            key={spread.city}
                            className="flex justify-between items-center text-xs"
                          >
                            <span className="font-semibold text-slate-700">{spread.city}</span>
                            <span
                              className={cn(
                                'font-mono font-bold',
                                spread.diff > 0
                                  ? 'text-rose-600'
                                  : spread.diff < 0
                                  ? 'text-emerald-600'
                                  : 'text-slate-500'
                              )}
                            >
                              Rs {spread.price.toLocaleString()} ({spread.diff > 0 ? '+' : ''}
                              {spread.diff}%)
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 italic">
                          No city-level observations available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compare' && compareComm1 && compareComm2 && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                  Asset A
                </label>
                <div className="flex gap-2">
                  <select
                    value={compareId1}
                    onChange={(e) => setCompareId1(e.target.value)}
                    className="flex-1 rounded border border-slate-200 py-2 px-3 text-sm bg-slate-50 focus:outline-none focus:border-emerald-500 font-bold text-slate-800 min-w-0"
                  >
                    {commodities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={compareCity1}
                    onChange={(e) => setCompareCity1(e.target.value)}
                    className="w-28 sm:w-36 rounded border border-slate-200 py-2 px-2 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-emerald-500 font-bold text-slate-800 shrink-0"
                  >
                    <option value="All">National Avg</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="shrink-0 hidden md:flex items-center justify-center p-2 rounded-full bg-slate-100">
                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
              </div>

              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                  Asset B
                </label>
                <div className="flex gap-2">
                  <select
                    value={compareId2}
                    onChange={(e) => setCompareId2(e.target.value)}
                    className="flex-1 rounded border border-slate-200 py-2 px-3 text-sm bg-slate-50 focus:outline-none focus:border-blue-500 font-bold text-slate-800 min-w-0"
                  >
                    {commodities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={compareCity2}
                    onChange={(e) => setCompareCity2(e.target.value)}
                    className="w-28 sm:w-36 rounded border border-slate-200 py-2 px-2 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-blue-500 font-bold text-slate-800 shrink-0"
                  >
                    <option value="All">National Avg</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="shrink-0 w-full md:w-auto flex items-center justify-center bg-slate-100 rounded p-1 border border-slate-200 mt-2 md:mt-0 md:ml-4">
                <button
                  onClick={() => setPointLimit(4)}
                  className={cn(
                    'px-3 py-1 text-xs font-bold rounded transition-colors',
                    pointLimit === 4 ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  4W
                </button>
                <button
                  onClick={() => setPointLimit(12)}
                  className={cn(
                    'px-3 py-1 text-xs font-bold rounded transition-colors',
                    pointLimit === 12 ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  12W
                </button>
                <button
                  onClick={() => setPointLimit(999)}
                  className={cn(
                    'px-3 py-1 text-xs font-bold rounded transition-colors',
                    pointLimit === 999 ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  All
                </button>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                    Relative Archived Performance (Indexed %)
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                    Comparing percentage change across {compareData.length} matched PBS releases
                  </p>
                </div>
              </div>

              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      minTickGap={20}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      labelStyle={{
                        color: '#64748b',
                        textTransform: 'uppercase',
                        fontSize: '10px',
                        letterSpacing: '0.05em',
                        marginBottom: '8px'
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const rawKey = name === `${compareComm1.name} (${compareCity1})` ? 'raw1' : 'raw2';
                        const rawVal = props.payload[rawKey];
                        return [`${value > 0 ? '+' : ''}${value}% (Rs ${Number(rawVal).toLocaleString()})`, name];
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    <Line
                      type="monotone"
                      dataKey={`${compareComm1.name} (${compareCity1})`}
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={`${compareComm2.name} (${compareCity2})`}
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {compareData.length > 0 && (
              <div className="bg-slate-900 p-5 rounded-xl text-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
                    Archived Period Comparison
                  </h4>
                  <p className="text-sm text-slate-300">
                    Over {compareData.length} matched PBS SPI releases,{' '}
                    <strong>
                      {compareComm1.name} ({compareCity1})
                    </strong>{' '}
                    moved{' '}
                    <strong className="font-mono text-white">
                      {compareData[compareData.length - 1]?.[`${compareComm1.name} (${compareCity1})`]}%
                    </strong>
                    , compared to{' '}
                    <strong>
                      {compareComm2.name} ({compareCity2})
                    </strong>{' '}
                    at{' '}
                    <strong className="font-mono text-white">
                      {compareData[compareData.length - 1]?.[`${compareComm2.name} (${compareCity2})`]}%
                    </strong>
                    .
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showReport && (
          <AnalysisReport
            activeTab={activeTab}
            dateRange={singleStats?.historyWithSMA.length || compareData.length}
            singleCommodity={singleCommodity}
            singleStats={singleStats}
            analysisCity={analysisCity}
            compareComm1={compareComm1}
            compareComm2={compareComm2}
            compareCity1={compareCity1}
            compareCity2={compareCity2}
            compareData={compareData}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
