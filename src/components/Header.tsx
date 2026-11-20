import React from 'react';
import { Search, Building2, ShieldCheck, ShieldAlert } from 'lucide-react';
import logoUrl from '../assets/images/data_mandi_logo_1787808997843.jpg';
import { PublishGateResult } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onGoProClick?: () => void;
  onCommercialAccessClick?: () => void;
  verifiedSourcesCount?: number;
  gateStatus?: PublishGateResult | null;
}

export function Header({
  searchQuery,
  setSearchQuery,
  onGoProClick,
  onCommercialAccessClick,
  verifiedSourcesCount = 0,
  gateStatus
}: HeaderProps) {
  const isGatePassed = gateStatus?.status === 'PASSED';

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-white border-b border-slate-200 shrink-0 z-10">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 overflow-hidden rounded-lg border border-slate-200 flex items-center justify-center bg-slate-900 shrink-0">
          <img
            src={logoUrl}
            alt="Pakistan Market Intelligence"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap shrink-0">
          Pakistan Market Intelligence
        </h1>
      </div>

      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-xs font-medium text-slate-800 transition-colors"
            placeholder="Search 51 PBS SPI commodities or cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0">
          {gateStatus ? (
            isGatePassed ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Gate Passed · Week {gateStatus.week_ended_date}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Gate Failed · {gateStatus.failed_checks.length} Issue(s)</span>
              </span>
            )
          ) : (
            <span className="text-slate-500">Checking Verification Gate...</span>
          )}
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-slate-500 font-mono">{verifiedSourcesCount} Live Feed{verifiedSourcesCount === 1 ? '' : 's'}</span>
        </div>

        <button
          onClick={onCommercialAccessClick || onGoProClick}
          className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-md font-semibold text-xs hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          title="Historical datasets, bulk downloads, and procurement API access"
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Commercial Access</span>
        </button>
      </div>
    </header>
  );
}
