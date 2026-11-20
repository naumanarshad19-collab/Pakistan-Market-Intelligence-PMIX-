import React, { useMemo, useState } from 'react';
import { Commodity } from '../types';
import { motion } from 'motion/react';
import { X, TrendingUp, TrendingDown, Activity, Download, Map } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '../lib/utils';

const PROVINCE_MAP: Record<string, string> = {
  Islamabad: 'Federal',
  Rawalpindi: 'Punjab',
  Gujranwala: 'Punjab',
  Sialkot: 'Punjab',
  Lahore: 'Punjab',
  Faisalabad: 'Punjab',
  Sargodha: 'Punjab',
  Multan: 'Punjab',
  Bahawalpur: 'Punjab',
  Karachi: 'Sindh',
  Hyderabad: 'Sindh',
  Sukkur: 'Sindh',
  Larkana: 'Sindh',
  Peshawar: 'KPK',
  Bannu: 'KPK',
  Quetta: 'Balochistan',
  Khuzdar: 'Balochistan'
};

interface MarketReportProps {
  commodities: Commodity[];
  onClose: () => void;
}

export function MarketReport({ commodities, onClose }: MarketReportProps) {
  const [spreadMode, setSpreadMode] = useState<'city' | 'province'>('city');

  const topGainers = [...commodities]
    .sort((a, b) => b.weeklyChangePercentage - a.weeklyChangePercentage)
    .slice(0, 5);
  const topLosers = [...commodities]
    .sort((a, b) => a.weeklyChangePercentage - b.weeklyChangePercentage)
    .slice(0, 5);

  const regionalGrouped = useMemo(() => {
    const regionMap = new Map<string, Map<string, { commodity: Commodity; prices: number[] }>>();

    commodities.forEach((c) => {
      if (c.cityOffers) {
        c.cityOffers.forEach((offer) => {
          const region = spreadMode === 'city' ? offer.city : PROVINCE_MAP[offer.city] || 'Other';
          if (!regionMap.has(region)) {
            regionMap.set(region, new Map<string, { commodity: Commodity; prices: number[] }>());
          }

          const commMap = regionMap.get(region)!;
          if (!commMap.has(c.id)) {
            commMap.set(c.id, { commodity: c, prices: [] });
          }
          commMap.get(c.id)!.prices.push(offer.price);
        });
      }
    });

    const result: Array<[string, Array<{ commodity: Commodity; price: number }>]> = [];
    regionMap.forEach((commMap, region) => {
      const items: Array<{ commodity: Commodity; price: number }> = [];
      commMap.forEach((item) => {
        const avgPrice = item.prices.reduce((a, b) => a + b, 0) / (item.prices.length || 1);
        items.push({ commodity: item.commodity, price: avgPrice });
      });
      result.push([region, items]);
    });

    return result.sort((a, b) => a[0].localeCompare(b[0]));
  }, [commodities, spreadMode]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-slate-900/40 backdrop-blur-sm overflow-y-auto print:bg-white print:backdrop-blur-none p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-4xl shadow-2xl rounded-xl relative print:shadow-none print:w-full print:max-w-full"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100 print:hidden">
          <h2 className="text-xl font-black text-slate-900">Pakistan Market Intelligence — PBS SPI Report</h2>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area Starts Here */}
        <div className="p-8 sm:p-12">
          {/* Report Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
              PBS SPI Market Analysis Report
            </h1>
            <p className="text-slate-500 font-medium">
              Generated on{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}{' '}
              · {commodities.length} Commodities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Weekly Gainers (WoW)
              </h3>
              <div className="space-y-4">
                {topGainers.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center border-b border-slate-200 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="font-bold text-slate-700">{c.name}</span>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm">
                        Rs {c.currentPrice.toLocaleString('en-PK')}
                      </div>
                      <div className="text-xs font-bold font-mono text-emerald-600">
                        +{c.weeklyChangePercentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500" /> Top Weekly Decliners (WoW)
              </h3>
              <div className="space-y-4">
                {topLosers.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center border-b border-slate-200 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="font-bold text-slate-700">{c.name}</span>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm">
                        Rs {c.currentPrice.toLocaleString('en-PK')}
                      </div>
                      <div className="text-xs font-bold font-mono text-rose-600">
                        {c.weeklyChangePercentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reference Commodity Archived Trend */}
          <div className="mb-12">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" /> Reference Commodity Archived Trajectory ({commodities[0]?.name || 'Wheat Flour Bag'})
            </h3>
            <div className="h-64 w-full bg-slate-50 rounded-xl border border-slate-100 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={commodities[0]?.historySeries || []}>
                  <defs>
                    <linearGradient id="marketColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={20} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `Rs ${val}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#marketColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Commodity Listing Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">
              Verified 51-Commodity PBS SPI Listing
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-widest">
                    <th className="p-3 font-bold border-b border-slate-200">Commodity</th>
                    <th className="p-3 font-bold border-b border-slate-200">Category</th>
                    <th className="p-3 font-bold border-b border-slate-200 text-right">Current Price</th>
                    <th className="p-3 font-bold border-b border-slate-200 text-right">Change (WoW)</th>
                    <th className="p-3 font-bold border-b border-slate-200 text-right">Change (YoY)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commodities.map((c) => (
                    <tr key={c.id} className="text-sm bg-white">
                      <td className="p-3 font-bold text-slate-800">
                        {c.name} <span className="text-slate-400 font-normal text-xs block">{c.unit}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-50 px-2 py-1 rounded">
                          {c.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        Rs {c.currentPrice.toLocaleString('en-PK')}
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span className={c.weeklyChangePercentage >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                          {c.weeklyChangePercentage >= 0 ? '+' : ''}
                          {c.weeklyChangePercentage.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        {typeof c.yearlyChangePercentage === 'number'
                          ? `${c.yearlyChangePercentage >= 0 ? '+' : ''}${c.yearlyChangePercentage.toFixed(2)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regional Split */}
          {regionalGrouped.length > 0 && (
            <div className="mt-12 pt-12 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Regional Market Breakdown</h3>
                
                <div className="flex bg-slate-100 p-1 rounded-md print:hidden">
                  <button 
                    onClick={() => setSpreadMode('city')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded uppercase tracking-widest transition-colors",
                      spreadMode === 'city' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    City-wise
                  </button>
                  <button 
                    onClick={() => setSpreadMode('province')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded uppercase tracking-widest transition-colors",
                      spreadMode === 'province' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Province-wise
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {regionalGrouped.map(([region, items]) => (
                  <div key={region} className="bg-slate-50 rounded-xl p-6 border border-slate-100 print:border-none print:p-2">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">{region} Market Rates</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {items.map((item, idx) => (
                        <div key={`${region}-${idx}`} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-slate-100 print:border-b print:shadow-none print:rounded-none">
                          <span className="font-bold text-slate-700 text-sm">{item.commodity.name}</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">Rs {item.price.toLocaleString('en-PK', { maximumFractionDigits: 1 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
