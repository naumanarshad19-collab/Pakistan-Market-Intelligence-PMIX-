import React from 'react';
import { motion } from 'motion/react';
import { X, Download, TrendingUp, TrendingDown, Activity, ArrowRightLeft } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Commodity } from '../types';

interface AnalysisReportProps {
  activeTab: 'single' | 'compare';
  dateRange: number;
  
  singleCommodity?: Commodity | null;
  singleStats?: any;
  analysisCity?: string;

  compareComm1?: Commodity | null;
  compareComm2?: Commodity | null;
  compareCity1?: string;
  compareCity2?: string;
  compareData?: any[];
  
  onClose: () => void;
}

export function AnalysisReport({
  activeTab,
  dateRange,
  singleCommodity,
  singleStats,
  analysisCity,
  compareComm1,
  compareComm2,
  compareCity1,
  compareCity2,
  compareData,
  onClose
}: AnalysisReportProps) {
  
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
          <h2 className="text-xl font-black text-slate-900">Data Mandi - Detailed Analysis Report</h2>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area Starts Here */}
        <div className="p-8 sm:p-12">
          {/* Report Header */}
          <div className="text-center mb-12 border-b border-slate-200 pb-8">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Detailed Analysis Report</h1>
            <p className="text-slate-500 font-medium">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-widest">
                {activeTab === 'single' ? 'Single Asset Deep-Dive' : 'Cross-Asset Comparison'}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-widest">
                {dateRange} Archived Observations
              </span>
            </div>
          </div>

          {activeTab === 'single' && singleCommodity && singleStats && (
            <div className="space-y-12">
              {/* Single Asset Summary */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{singleCommodity.name}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                  <span className="bg-slate-100 px-2 py-1 rounded uppercase text-[10px] tracking-widest font-bold text-slate-600">{singleCommodity.category}</span>
                  <span>Location: <strong className="text-slate-700">{analysisCity}</strong></span>
                  <span>Current Price: <strong className="text-slate-900 font-mono">Rs {singleCommodity.currentPrice.toLocaleString('en-PK')}</strong></span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Period High</h4>
                  <div className="text-lg font-bold text-slate-900 font-mono">Rs {singleStats.max.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Period Low</h4>
                  <div className="text-lg font-bold text-slate-900 font-mono">Rs {singleStats.min.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Average</h4>
                  <div className="text-lg font-bold text-slate-900 font-mono">Rs {Math.round(singleStats.avg).toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Range Spread</h4>
                  <div className="text-lg font-bold text-emerald-600 font-mono">{singleStats.volatility.toFixed(2)}%</div>
                </div>
              </div>

              {/* Chart */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Price Action & 4-Release SMA
                </h3>
                <div className="h-80 w-full bg-white rounded-xl border border-slate-200 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={singleStats.historyWithSMA}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={20} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `Rs ${val}`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="price" name="PBS SPI Price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                      <Area type="monotone" dataKey="sma7" name="4-Release SMA" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Data Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Historical Data Points</h3>
                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-widest">
                        <th className="p-2 font-bold border-b border-slate-200">Date</th>
                        <th className="p-2 font-bold border-b border-slate-200 text-right">PBS Price</th>
                        <th className="p-2 font-bold border-b border-slate-200 text-right">4-Release SMA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...singleStats.historyWithSMA].reverse().map((point: any, idx: number) => (
                        <tr key={idx} className="text-xs bg-white">
                          <td className="p-2 text-slate-600">{point.date}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">Rs {point.price.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono text-slate-500">{point.sma7 ? `Rs ${point.sma7.toLocaleString()}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compare' && compareComm1 && compareComm2 && compareData && (
            <div className="space-y-12">
              {/* Comparison Summary */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Asset A</div>
                  <h2 className="text-xl font-bold text-slate-900">{compareComm1.name}</h2>
                  <p className="text-sm text-slate-500 font-medium">Location: {compareCity1}</p>
                </div>
                <div className="shrink-0 p-3 bg-slate-50 rounded-full border border-slate-200">
                  <ArrowRightLeft className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 sm:text-right">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Asset B</div>
                  <h2 className="text-xl font-bold text-slate-900">{compareComm2.name}</h2>
                  <p className="text-sm text-slate-500 font-medium">Location: {compareCity2}</p>
                </div>
              </div>

              {/* Chart */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Relative Performance Index (0-Base)
                </h3>
                <div className="h-80 w-full bg-white rounded-xl border border-slate-200 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compareData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                      <YAxis tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string, props: any) => {
                          const rawKey = name === `${compareComm1.name} (${compareCity1})` ? 'raw1' : 'raw2';
                          const rawVal = props.payload[rawKey];
                          return [`${value > 0 ? '+' : ''}${value}% (Rs ${Math.round(rawVal).toLocaleString()})`, name];
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey={`${compareComm1.name} (${compareCity1})`} stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey={`${compareComm2.name} (${compareCity2})`} stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Correlation Data Points</h3>
                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-widest">
                        <th className="p-2 font-bold border-b border-slate-200">Date</th>
                        <th className="p-2 font-bold border-b border-slate-200 text-right">{compareComm1.name} ({compareCity1})</th>
                        <th className="p-2 font-bold border-b border-slate-200 text-right">{compareComm2.name} ({compareCity2})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...compareData].reverse().map((point: any, idx: number) => (
                        <tr key={idx} className="text-xs bg-white">
                          <td className="p-2 text-slate-600">{point.date}</td>
                          <td className="p-2 text-right">
                            <span className="font-mono font-bold text-slate-900 block">Rs {Math.round(point.raw1).toLocaleString()}</span>
                            <span className={point[`${compareComm1.name} (${compareCity1})`] >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                              {point[`${compareComm1.name} (${compareCity1})`] > 0 ? '+' : ''}{point[`${compareComm1.name} (${compareCity1})`]}%
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <span className="font-mono font-bold text-slate-900 block">Rs {Math.round(point.raw2).toLocaleString()}</span>
                            <span className={point[`${compareComm2.name} (${compareCity2})`] >= 0 ? "text-blue-600 font-bold" : "text-rose-600 font-bold"}>
                              {point[`${compareComm2.name} (${compareCity2})`] > 0 ? '+' : ''}{point[`${compareComm2.name} (${compareCity2})`]}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
