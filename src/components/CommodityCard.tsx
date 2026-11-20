import React from 'react';
import { Commodity } from '../types';
import { cn } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';

interface CommodityCardProps {
  key?: React.Key;
  commodity: Commodity;
  onClick: () => void;
}

export function CommodityCard({ commodity, onClick }: CommodityCardProps) {
  const weeklyChange = commodity.weeklyChangePercentage ?? commodity.priceChangePercentage ?? 0;
  const isWeeklyIncrease = weeklyChange > 0;
  const isWeeklyDecrease = weeklyChange < 0;
  const yearlyChange = commodity.yearlyChangePercentage;
  const citiesCount = commodity.verification?.citiesVerifiedCount ?? commodity.cityOffers?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="bg-white p-4 rounded-xl border border-slate-200 text-left w-full hover:border-emerald-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 flex flex-col h-full group"
    >
      {/* Clean unboxed category & Urdu label */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-1">
        <span className="truncate font-medium">{commodity.category}</span>
        {commodity.urdu_name && (
          <span className="shrink-0 text-slate-400 font-sans">{commodity.urdu_name}</span>
        )}
      </div>

      {/* Primary Commodity Title */}
      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-800 transition-colors">
        {commodity.name}
      </h3>

      {/* Price and Weekly Change */}
      <div className="flex items-end justify-between mt-3">
        <div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            Rs {commodity.currentPrice.toLocaleString('en-PK')}
          </span>
          <div className="text-[11px] text-slate-500 font-medium">
            per {commodity.unit}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span
            className={cn(
              'text-xs font-bold flex items-center font-mono',
              isWeeklyIncrease
                ? 'text-rose-700'
                : isWeeklyDecrease
                ? 'text-emerald-700'
                : 'text-slate-600'
            )}
          >
            {weeklyChange > 0 ? '+' : ''}
            {weeklyChange.toFixed(2)}% WoW
            {isWeeklyIncrease && <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />}
            {isWeeklyDecrease && <ArrowDownRight className="w-3.5 h-3.5 ml-0.5" />}
          </span>
          {yearlyChange !== undefined && (
            <span className="text-[11px] font-mono text-slate-500 mt-0.5">
              YoY: {yearlyChange > 0 ? '+' : ''}{yearlyChange.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Honest Verification Metadata */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
        <span className="flex items-center gap-1 font-medium text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>PBS SPI · {citiesCount}/17 Cities</span>
        </span>
        {commodity.isAnomaly && (
          <span className="flex items-center gap-1 text-amber-700 font-semibold">
            <AlertTriangle className="w-3 h-3" /> Spread/Move
          </span>
        )}
      </div>

      {/* Regional City Extremes */}
      {commodity.cityOffers && commodity.cityOffers.length >= 2 && commodity.nationalMetrics && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 mt-auto">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-slate-400" />
              City Range
            </span>
            <span className="font-mono font-semibold text-slate-700">
              Δ {commodity.nationalMetrics.citySpreadPct.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-600 truncate">
              Low: {commodity.nationalMetrics.lowestCity.city} (Rs {commodity.nationalMetrics.lowestCity.price.toLocaleString()})
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono mt-0.5">
            <span className="text-slate-600 truncate">
              High: {commodity.nationalMetrics.highestCity.city} (Rs {commodity.nationalMetrics.highestCity.price.toLocaleString()})
            </span>
          </div>
        </div>
      )}
    </button>
  );
}
