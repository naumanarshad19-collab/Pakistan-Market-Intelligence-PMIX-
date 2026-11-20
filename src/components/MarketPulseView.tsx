import React, { useEffect, useState } from 'react';
import { ArchiveWeekSummary, MarketPulse } from '../types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';

export function MarketPulseView() {
  const [pulse, setPulse] = useState<MarketPulse | null>(null);
  const [archiveWeeks, setArchiveWeeks] = useState<ArchiveWeekSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [targetDate, setTargetDate] = useState<string>('');

  const loadPulse = async (dateStr: string) => {
    setLoading(true);
    try {
      const url = dateStr ? `/api/market-pulse?date=${encodeURIComponent(dateStr)}` : '/api/market-pulse';
      const [pulseRes, weeksRes] = await Promise.all([
        fetch(url),
        fetch('/api/archive/weeks')
      ]);
      if (pulseRes.ok) {
        setPulse(await pulseRes.json());
      }
      if (weeksRes.ok) {
        setArchiveWeeks(await weeksRes.json());
      }
    } catch (err) {
      console.error('Failed to load market pulse', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPulse(targetDate);
  }, [targetDate]);

  const handleCopyPost = () => {
    if (!pulse || pulse.publish_gate.status !== 'PASSED' || !pulse.social_ready_post) return;
    navigator.clipboard.writeText(pulse.social_ready_post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading && !pulse) {
    return (
      <div className="col-span-1 lg:col-span-10 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="mt-4 text-xs font-semibold text-slate-500">
            Evaluating Publish Gate & Market Pulse...
          </span>
        </div>
      </div>
    );
  }

  if (!pulse) {
    return (
      <div className="col-span-1 lg:col-span-10 p-8 text-center">
        <p className="text-sm text-rose-700 font-semibold">Failed to load market pulse endpoint.</p>
      </div>
    );
  }

  const gatePassed = pulse.publish_gate.status === 'PASSED';

  return (
    <div className="col-span-1 lg:col-span-10 p-6 overflow-y-auto space-y-6 max-w-7xl mx-auto w-full">
      {/* Header & Publish Gate Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-slate-700">Weekly Intelligence Bulletin</span>
              <span aria-hidden="true">·</span>
              <span>{pulse.date}</span>
              {pulse.week_ended_date && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">Week Ended {pulse.week_ended_date}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Pakistan Market Pulse
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {pulse.headline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {archiveWeeks.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-md">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="bg-transparent border-0 text-xs font-semibold text-slate-700 outline-none focus:ring-0 cursor-pointer"
                  aria-label="Select archived PBS SPI week"
                >
                  <option value="">Latest Release (Live Gate)</option>
                  {archiveWeeks.map((w) => (
                    <option key={w.week_ended_date} value={w.week_ended_date}>
                      Archived: {w.week_ended_date} (SPI {w.spi_combined_index})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleCopyPost}
              disabled={!gatePassed || !pulse.social_ready_post}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0',
                gatePassed && pulse.social_ready_post
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              )}
            >
              {!gatePassed ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Export Blocked (Gate Failed)</span>
                </>
              ) : copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Social Post</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Gate Invariant Matrix */}
        <div
          className={cn(
            'mt-6 pt-5 border-t border-slate-200 rounded-lg p-4',
            gatePassed ? 'bg-emerald-50/60 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {gatePassed ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <h3
                className={cn(
                  'text-sm font-bold',
                  gatePassed ? 'text-emerald-900' : 'text-rose-900'
                )}
              >
                Publish Gate: {pulse.publish_gate.status}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-600">
              {pulse.publish_gate.items_parsed}/51 Items · {pulse.publish_gate.annex_cities_count} Cities · Age:{' '}
              {pulse.publish_gate.release_age_days ?? 'N/A'}d
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {pulse.publish_gate.checks.map((chk, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-md p-2.5 flex items-start gap-2 text-xs"
              >
                {chk.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{chk.name}</div>
                  <div className="text-[11px] text-slate-600 leading-snug mt-0.5">{chk.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Metrics & Breadth (only when Gate Passed) */}
        {gatePassed && pulse.market_breadth && pulse.pbs_spi_metrics && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">SPI Combined Index</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                  {pulse.pbs_spi_metrics.spi_combined_index.toFixed(2)}
                </span>
                <span className="text-xs text-slate-600 font-mono">
                  {pulse.pbs_spi_metrics.spi_combined_wow_change > 0 ? '+' : ''}
                  {pulse.pbs_spi_metrics.spi_combined_wow_change.toFixed(2)}% WoW ·{' '}
                  {pulse.pbs_spi_metrics.spi_combined_yoy_change > 0 ? '+' : ''}
                  {pulse.pbs_spi_metrics.spi_combined_yoy_change.toFixed(2)}% YoY
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">Market Direction</span>
                <span
                  className={cn(
                    'text-xl font-extrabold mt-1 block',
                    pulse.market_direction === 'Bullish'
                      ? 'text-rose-700'
                      : pulse.market_direction === 'Bearish'
                      ? 'text-emerald-700'
                      : 'text-slate-900'
                  )}
                >
                  {pulse.market_direction}
                </span>
                <span className="text-xs text-slate-600 font-mono">
                  {pulse.advancers_count} up · {pulse.decliners_count} down · {pulse.unchanged_count} flat
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">Verified Universe</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                  {pulse.monitored_commodities_count}/51 Items
                </span>
                <span className="text-xs text-slate-600">
                  {pulse.monitored_cities_count} PBS Urban Centers
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">Lowest Quintile (Q1)</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                  {pulse.pbs_spi_metrics.spi_q1_index.toFixed(2)}
                </span>
                <a
                  href={pulse.pbs_spi_metrics.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1 hover:underline mt-0.5"
                >
                  <span>Official Release</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Segmented Breadth Bar */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2 gap-1">
                <span className="font-bold text-slate-800">
                  Full 51-Commodity Market Breadth (100% of PBS SPI Basket)
                </span>
                <span className="font-mono text-slate-500">
                  Week Ended: {pulse.pbs_spi_metrics.week_ended_formatted}
                </span>
              </div>

              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${pulse.market_breadth.advancers_pct}%` }}
                  className="bg-rose-500"
                  title={`Advancers: ${pulse.advancers_count} (${pulse.market_breadth.advancers_pct}%)`}
                />
                <div
                  style={{ width: `${pulse.market_breadth.decliners_pct}%` }}
                  className="bg-emerald-500"
                  title={`Decliners: ${pulse.decliners_count} (${pulse.market_breadth.decliners_pct}%)`}
                />
                <div
                  style={{ width: `${pulse.market_breadth.unchanged_pct}%` }}
                  className="bg-slate-300"
                  title={`Stable: ${pulse.unchanged_count} (${pulse.market_breadth.unchanged_pct}%)`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
                  <span className="font-semibold text-slate-800">Advancers:</span>
                  <span className="font-mono text-slate-600">
                    {pulse.advancers_count} ({pulse.market_breadth.advancers_pct.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800">Decliners:</span>
                  <span className="font-mono text-slate-600">
                    {pulse.decliners_count} ({pulse.market_breadth.decliners_pct.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">Stable:</span>
                  <span className="font-mono text-slate-600">
                    {pulse.unchanged_count} ({pulse.market_breadth.unchanged_pct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fail-Loudly Gate Blocked Banner */}
      {!gatePassed && (
        <div className="bg-white border border-rose-300 rounded-xl p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">
            Publication & Social Export Blocked
          </h3>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-1.5">
            One or more mandatory verification invariants failed. The system refuses to publish unverified, stale, or synthetic figures. Resolve the failed checks above or select a verified archived week.
          </p>
        </div>
      )}

      {/* Gainers & Decliners + Spreads & Social Post (ONLY rendered when Gate Passed) */}
      {gatePassed && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 5 Increases */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Top 5 Significant Increases
                  </h3>
                </div>
                <span className="text-xs text-rose-700 font-mono font-semibold">
                  Top 5 of {pulse.advancers_count}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {pulse.top_gainers.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {item.category} · Rs {item.current_price.toLocaleString()}/{item.unit}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-rose-700 font-mono shrink-0">
                      +{item.weekly_change_pct.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* All Decliners */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    All Weekly Decliners
                  </h3>
                </div>
                <span className="text-xs text-emerald-700 font-mono font-semibold">
                  {pulse.top_losers.length} of {pulse.decliners_count}
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto pr-1">
                {pulse.top_losers.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {item.category} · Rs {item.current_price.toLocaleString()}/{item.unit}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 font-mono shrink-0">
                      {item.weekly_change_pct.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Real Regional Spreads from Appendix-A */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Verified Inter-City Spreads (PBS Appendix-A)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">17 Urban Centers</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Widest verified retail price differentials parsed directly from PBS city headers:
              </p>

              <div className="divide-y divide-slate-100">
                {pulse.regional_spreads.map((spread, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{spread.commodity}</span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        Δ {spread.spread_pct.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      {spread.arbitrage_insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Social Post */}
            {pulse.social_ready_post && (
              <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">
                        Verified Social Bulletin
                      </span>
                    </div>
                    <button
                      onClick={handleCopyPost}
                      className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-200 font-mono whitespace-pre-line leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 max-h-[380px] overflow-y-auto">
                    {pulse.social_ready_post.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    PBS SPI Verified ({pulse.week_ended_date})
                  </span>
                  <span className="font-mono text-slate-300">51/51 Items</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
