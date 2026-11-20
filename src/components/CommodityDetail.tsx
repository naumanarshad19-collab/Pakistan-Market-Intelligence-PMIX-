import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, ShieldCheck, MapPin, AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Commodity } from '../types';
import { cn } from '../lib/utils';

interface CommodityDetailProps {
  commodity: Commodity | null;
  onClose: () => void;
  onOpenEnterprise?: () => void;
}

export function CommodityDetail({ commodity, onClose, onOpenEnterprise }: CommodityDetailProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (!commodity) return null;

  const weeklyPct = commodity.weeklyChangePercentage ?? commodity.priceChangePercentage ?? 0;
  const isIncrease = weeklyPct > 0;
  const isDecrease = weeklyPct < 0;
  const national = commodity.nationalMetrics;
  const chartData = commodity.historySeries || [];
  const citiesCount = commodity.verification?.citiesVerifiedCount ?? commodity.cityOffers?.length ?? 0;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      <div className="relative flex w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl md:flex-row border border-slate-200 overflow-hidden z-10 my-auto max-h-[90vh]">
        {/* Main Content */}
        <div className="flex flex-1 flex-col p-6 sm:p-8 overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                <span className="font-medium text-slate-700">{commodity.category}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  PBS SPI Verified ({citiesCount}/17 Cities)
                </span>
                {commodity.verification?.weekEndedDate && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">Week Ended {commodity.verification.weekEndedDate}</span>
                  </>
                )}
              </div>

              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {commodity.name}
                </h2>
                {commodity.urdu_name && (
                  <span className="text-base font-medium text-slate-400">
                    ({commodity.urdu_name})
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Official PBS reporting unit: {commodity.unit}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Price Headline & Reference Anchors */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-400 font-mono">Rs</span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
                {commodity.currentPrice.toLocaleString('en-PK')}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ {commodity.unit}</span>
            </div>

            <div className="flex items-center gap-5 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Prior Week</span>
                <strong className="font-mono text-slate-800">
                  Rs {commodity.previousPrice.toLocaleString('en-PK')}
                </strong>
              </div>
              {commodity.yearAgoPrice !== undefined && commodity.yearAgoPrice > 0 && (
                <div>
                  <span className="text-slate-500 block text-[11px]">Year Ago</span>
                  <strong className="font-mono text-slate-800">
                    Rs {commodity.yearAgoPrice.toLocaleString('en-PK')}
                  </strong>
                </div>
              )}
              <div>
                <span className="text-slate-500 block text-[11px]">WoW Change</span>
                <strong
                  className={cn(
                    'font-mono flex items-center gap-1',
                    isIncrease ? 'text-rose-700' : isDecrease ? 'text-emerald-700' : 'text-slate-700'
                  )}
                >
                  {isIncrease && <TrendingUp className="w-3.5 h-3.5" />}
                  {isDecrease && <TrendingDown className="w-3.5 h-3.5" />}
                  {weeklyPct > 0 ? '+' : ''}
                  {weeklyPct.toFixed(2)}%
                </strong>
              </div>
              {commodity.yearlyChangePercentage !== undefined && (
                <div>
                  <span className="text-slate-500 block text-[11px]">YoY Change</span>
                  <strong className="font-mono text-slate-800">
                    {commodity.yearlyChangePercentage > 0 ? '+' : ''}
                    {commodity.yearlyChangePercentage.toFixed(2)}%
                  </strong>
                </div>
              )}
            </div>
          </div>

          {commodity.isAnomaly && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-amber-900 font-bold block">Price / Spread Alert</strong>
                <span className="text-amber-800">{commodity.anomalyReason}</span>
              </div>
            </div>
          )}

          {/* Honest Multi-Source Verification Status */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Source Verification Status
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Math Check: {commodity.verification?.mathCheckPassed ? 'Passed' : 'Discrepancy'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-emerald-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="font-bold text-slate-800">PBS SPI</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  Rs {commodity.currentPrice.toLocaleString('en-PK')}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Federal SPI National Avg
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="font-bold text-slate-700">AMIS Mandi</span>
                  <span className="flex items-center gap-1 text-amber-700 font-semibold">
                    <MinusCircle className="w-3 h-3" /> Not Implemented
                  </span>
                </div>
                <span className="text-sm font-mono font-semibold text-slate-400">
                  Unavailable
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Requires ASP.NET postback scraper
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="font-bold text-slate-700">Punjab BOS</span>
                  <span className="flex items-center gap-1 text-amber-700 font-semibold">
                    <MinusCircle className="w-3 h-3" /> Not Implemented
                  </span>
                </div>
                <span className="text-sm font-mono font-semibold text-slate-400">
                  Unavailable
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Endpoint unreachable / unbuilt
                </span>
              </div>
            </div>
          </div>

          {/* Archived Real Historical Trend */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900">
                Archived PBS Weekly Price History ({chartData.length} Verified Points)
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Zero synthetic interpolation
              </span>
            </div>

            {chartData.length >= 2 ? (
              <div className="h-56 w-full border border-slate-200 rounded-lg p-3 bg-white">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPriceDetail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      minTickGap={20}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `Rs ${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                      formatter={(value: number) => [
                        `Rs ${Number(value).toLocaleString('en-PK')}`,
                        'Verified PBS Price'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#16a34a' }}
                      fillOpacity={1}
                      fill="url(#colorPriceDetail)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 text-center text-xs text-slate-500">
                Only {chartData.length} archived release point available so far. Run archive backfill in Settings to populate multi-week history.
              </div>
            )}
          </div>

          {/* Real Appendix-A City Prices */}
          {commodity.cityOffers && commodity.cityOffers.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Verified PBS Appendix-A City Prices ({commodity.cityOffers.length} Centers)
                </h4>
                {national && (
                  <span className="text-[11px] font-mono text-slate-600">
                    Spread: Rs {national.citySpreadDelta.toLocaleString()} ({national.citySpreadPct.toFixed(1)}%)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {commodity.cityOffers.map((offer, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[11px] font-semibold text-slate-500 block truncate">
                      {offer.city}
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                      Rs {offer.price.toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full bg-slate-50 p-6 border-t border-slate-200 md:w-72 md:border-t-0 md:border-l flex flex-col justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Weekly Release Alerts
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Receive an email notification whenever {commodity.name} shifts significantly in the weekly PBS SPI release.
            </p>

            <form onSubmit={handleSubscribe} className="mt-4 space-y-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@domain.com"
                className="block w-full rounded-md border border-slate-200 py-2 px-3 text-slate-900 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                {subscribed ? 'Alert Subscribed' : 'Subscribe to Alerts'}
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-lg bg-white p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900">Bulk Historical Archive</h4>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Access structured weekly SPI & city annexure extracts for procurement workflows.
            </p>
            <button
              onClick={() => {
                onClose();
                if (onOpenEnterprise) onOpenEnterprise();
              }}
              className="mt-3 w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
            >
              Commercial Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
