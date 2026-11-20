import React, { useState } from 'react';
import { Commodity, CityConfig } from '../types';
import { MapPin, TrendingUp, TrendingDown, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface CityComparisonViewProps {
  commodities: Commodity[];
  cities: CityConfig[];
}

export function CityComparisonView({ commodities, cities }: CityComparisonViewProps) {
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>(
    commodities.length > 0 ? commodities[0].id : 'wheat_grain'
  );

  const selectedCommodity = commodities.find(c => c.id === selectedCommodityId) || commodities[0];

  if (!selectedCommodity) {
    return (
      <div className="col-span-1 lg:col-span-10 p-8 text-center text-slate-500">
        No commodities available for city comparison.
      </div>
    );
  }

  const cityOffers = selectedCommodity.cityOffers || [];
  const sortedOffers = [...cityOffers].sort((a, b) => a.price - b.price);
  const nationalAvg = selectedCommodity.nationalMetrics?.nationalAverage || selectedCommodity.currentPrice;

  // Chart data
  const chartData = sortedOffers.map(offer => ({
    city: offer.city,
    price: offer.price,
    deltaPct: nationalAvg ? Math.round(((offer.price - nationalAvg) / nationalAvg) * 1000) / 10 : 0
  }));

  const highest = sortedOffers[sortedOffers.length - 1];
  const lowest = sortedOffers[0];
  const spreadDelta = highest && lowest ? highest.price - lowest.price : 0;
  const spreadPct = highest && lowest && lowest.price > 0 ? ((spreadDelta / lowest.price) * 100).toFixed(1) : '0';

  return (
    <div className="col-span-1 lg:col-span-10 p-6 overflow-y-auto space-y-6 max-w-7xl mx-auto w-full">
      {/* Header selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              Geographic Intelligence · {cities.filter(c => c.isEnabled).length || 17} PBS SPI Urban Centers
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Inter-City Price Comparison
            </h2>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Compare verified PBS Appendix-A retail averages across all {cities.filter(c => c.isEnabled).length || 17} monitored Pakistani urban centers.
            </p>
          </div>

          <div className="w-full md:w-72">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Select Commodity
            </label>
            <select
              value={selectedCommodityId}
              onChange={(e) => setSelectedCommodityId(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">National Benchmark</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block font-mono">
              Rs {nationalAvg.toLocaleString('en-PK')}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              per {selectedCommodity.unit}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Lowest Market</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block font-mono">
              {lowest ? lowest.city : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Rs {lowest ? lowest.price.toLocaleString() : '-'} / {selectedCommodity.unit}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Highest Market</span>
            <span className="text-xl font-black text-rose-600 mt-0.5 block font-mono">
              {highest ? highest.city : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Rs {highest ? highest.price.toLocaleString() : '-'} / {selectedCommodity.unit}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Arbitrage Spread</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block font-mono">
              {spreadPct}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Δ Rs {spreadDelta.toLocaleString()} / {selectedCommodity.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Chart and Ranked Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* City Price Spread Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Price Spread by City (PKR / {selectedCommodity.unit})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Lowest to Highest</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="city" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, 'Price']}
                  labelFormatter={(label) => `City: ${label}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        index === 0 ? '#10b981' :
                        index === chartData.length - 1 ? '#f43f5e' : '#334155'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-[10px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
              Lowest Hub
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block"></span>
              Mid Range
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
              Highest Hub
            </span>
          </div>
        </div>

        {/* City Breakdown Table */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Market Rate Rankings
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Δ vs National Avg</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[330px] overflow-y-auto pr-1">
            {sortedOffers.map((offer, idx) => {
              const delta = nationalAvg ? Math.round(((offer.price - nationalAvg) / nationalAvg) * 1000) / 10 : 0;
              const isAbove = delta > 0;
              return (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{offer.city}</span>
                      <span className="text-[10px] text-slate-400">Representative Mandi Rate</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block font-mono">
                      Rs {offer.price.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold ${isAbove ? 'text-rose-600' : delta < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {delta > 0 ? `+${delta}%` : `${delta}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
