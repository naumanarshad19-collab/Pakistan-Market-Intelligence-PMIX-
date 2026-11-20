import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CommodityCard } from './components/CommodityCard';
import { CommodityDetail } from './components/CommodityDetail';
import { Analysis } from './components/Analysis';
import { MarketReport } from './components/MarketReport';
import { MarketPulseView } from './components/MarketPulseView';
import { CityComparisonView } from './components/CityComparisonView';
import { Settings } from './components/Settings';
import { BusinessInquiryModal } from './components/BusinessInquiryModal';
import { Commodity, CityConfig, DataSource, PublishGateResult } from './types';
import {
  LayoutDashboard,
  LineChart,
  LayoutGrid,
  List,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  RefreshCcw,
  X,
  Sparkles,
  MapPin,
  Database,
  Building2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommodityId, setSelectedCommodityId] = useState<string | null>(null);
  const [selectedCommodityData, setSelectedCommodityData] = useState<Commodity | null>(null);
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'market-pulse' | 'cities' | 'analysis' | 'sources'
  >('dashboard');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [liveCommodities, setLiveCommodities] = useState<Commodity[]>([]);
  const [cities, setCities] = useState<CityConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifiedSourcesCount, setVerifiedSourcesCount] = useState<number>(0);
  const [gateStatus, setGateStatus] = useState<PublishGateResult | null>(null);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('All');

  // Export & Modals
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMarketReport, setShowMarketReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedCommodityId) {
      setSelectedCommodityData(null);
      return;
    }

    const match = liveCommodities.find((c) => c.id === selectedCommodityId);
    if (match) {
      setSelectedCommodityData(match);
    }

    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/commodities/${selectedCommodityId}`);
        if (res.ok) {
          const fullData: Commodity = await res.json();
          setSelectedCommodityData(fullData);
        }
      } catch (e) {
        console.error('Failed to fetch commodity detail', e);
      }
    };
    fetchDetail();
  }, [selectedCommodityId, liveCommodities]);

  const fetchCommodities = async () => {
    try {
      const res = await fetch('/api/commodities');
      if (res.ok) {
        setLiveCommodities(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch('/api/cities');
      if (res.ok) {
        setCities(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data: DataSource[] = await res.json();
        setVerifiedSourcesCount(data.filter((s) => s.status === 'success').length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPublishGate = async () => {
    try {
      const res = await fetch('/api/publish-gate');
      if (res.ok) {
        const data = await res.json();
        setGateStatus(data.gate || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCommodities();
    fetchCities();
    fetchSources();
    fetchPublishGate();
    const interval = setInterval(() => {
      fetchCommodities();
      fetchSources();
      fetchPublishGate();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/pipeline/run', { method: 'POST' });
      await Promise.all([fetchCommodities(), fetchSources(), fetchPublishGate()]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    liveCommodities.forEach((c) => {
      c.cityOffers?.forEach((o) => citySet.add(o.city));
    });
    return Array.from(citySet).sort();
  }, [liveCommodities]);

  const categories = [
    'All',
    'Grains & Staples',
    'Pulses',
    'Meat, Poultry & Dairy',
    'Oils & Condiments',
    'Vegetables & Fruits',
    'Prepared Food & Tobacco',
    'Clothing & Footwear',
    'Energy & Utilities',
    'Household & Telecom'
  ];

  const filteredCommodities = useMemo(() => {
    let filtered = liveCommodities.filter((c) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(query) ||
        (c.urdu_name && c.urdu_name.includes(query)) ||
        c.category.toLowerCase().includes(query);

      const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    if (selectedCityFilter !== 'All') {
      filtered = filtered
        .filter((c) => c.cityOffers && c.cityOffers.some((o) => o.city === selectedCityFilter))
        .map((c) => {
          const offer = c.cityOffers?.find((o) => o.city === selectedCityFilter);
          if (offer) {
            return { ...c, currentPrice: offer.price };
          }
          return c;
        });
    }

    return filtered;
  }, [searchQuery, liveCommodities, activeCategory, selectedCityFilter]);

  const handleExportCSV = () => {
    setShowExportMenu(false);
    const headers = [
      'Sr',
      'Commodity',
      'Urdu Name',
      'Category',
      'Unit',
      'Current Price (PKR)',
      'Prev Week (PKR)',
      'WoW Change (%)',
      'YoY Change (%)',
      'Verified Cities',
      'Week Ended'
    ];
    const rows = filteredCommodities.map((c) => [
      c.sr ?? '',
      `"${c.name}"`,
      `"${c.urdu_name || ''}"`,
      `"${c.category}"`,
      `"${c.unit}"`,
      c.currentPrice,
      c.previousPrice ?? '',
      c.weeklyChangePercentage ?? 0,
      c.yearlyChangePercentage ?? '',
      c.verification?.citiesVerifiedCount ?? c.cityOffers?.length ?? 0,
      `"${c.verification?.weekEndedDate || gateStatus?.week_ended_date || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `PBS_SPI_Market_Intelligence_${gateStatus?.week_ended_date || new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const enabledCitiesCount = cities.filter((c) => c.isEnabled).length || 17;

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] font-sans text-slate-800 overflow-hidden">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onGoProClick={() => setShowLoginPopup(true)}
        onCommercialAccessClick={() => setShowEnterpriseModal(true)}
        verifiedSourcesCount={verifiedSourcesCount}
        gateStatus={gateStatus}
      />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="hidden lg:flex col-span-2 bg-white border-r border-slate-200 flex-col overflow-y-auto z-0">
          <nav className="p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">
              Market Intelligence
            </div>

            <button
              onClick={() => setCurrentView('dashboard')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left',
                currentView === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              Live Commodity Board
            </button>

            <button
              onClick={() => setCurrentView('market-pulse')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left',
                currentView === 'market-pulse'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Weekly Market Pulse
              </span>
            </button>

            <button
              onClick={() => setCurrentView('cities')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left',
                currentView === 'cities'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              Inter-City Spreads
            </button>

            <button
              onClick={() => setCurrentView('analysis')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left',
                currentView === 'analysis'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <LineChart className="w-4 h-4 text-emerald-600" />
              Technical Analysis
            </button>

            <button
              onClick={() => setCurrentView('sources')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left',
                currentView === 'sources'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Database className="w-4 h-4 text-emerald-600" />
              Settings & Pipeline
            </button>

            {/* Category Filter section (visible on dashboard) */}
            {currentView === 'dashboard' && (
              <div className="pt-5 mt-4 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 mb-1">
                  PBS SPI Categories
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-left',
                      activeCategory === cat
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <span className="truncate">{cat}</span>
                    {cat === 'All' ? (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {liveCommodities.length}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {liveCommodities.filter((c) => c.category === cat).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </nav>

          {/* Enterprise prompt in sidebar */}
          <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              B2B Data Feeds
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Access archived PBS SPI series and verified city matrices via REST API.
            </p>
            <button
              onClick={() => setShowEnterpriseModal(true)}
              className="mt-2.5 w-full py-1.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              Commercial Inquiries
            </button>
          </div>
        </aside>

        {/* Dynamic View Switcher */}
        {currentView === 'market-pulse' ? (
          <MarketPulseView />
        ) : currentView === 'cities' ? (
          <CityComparisonView commodities={liveCommodities} cities={cities} />
        ) : currentView === 'analysis' ? (
          <Analysis commodities={liveCommodities} />
        ) : currentView === 'sources' ? (
          <Settings
            onPipelineRun={() => {
              fetchCommodities();
              fetchSources();
              fetchPublishGate();
            }}
          />
        ) : (
          /* Main Dashboard View */
          <section className="col-span-1 lg:col-span-10 p-6 overflow-y-auto flex flex-col">
            {/* Publish Gate Failed Banner */}
            {gateStatus && gateStatus.status === 'FAILED' && (
              <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Publish Gate Failed — Social Export Blocked
                    </h3>
                    <p className="text-xs text-rose-700 mt-0.5">
                      {gateStatus.failed_checks.join(' · ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('market-pulse')}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold shrink-0"
                >
                  Inspect Gate Checks
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    PBS SPI Commodity Board
                  </h2>
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    {filteredCommodities.length} / {liveCommodities.length} Items
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Official Pakistan Bureau of Statistics (PBS) weekly retail averages across {enabledCitiesCount} urban centers.
                  {gateStatus?.week_ended_date ? ` Release Week Ended ${gateStatus.week_ended_date}.` : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Refresh Pipeline Button */}
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  title="Run live PBS discovery & Excel parser"
                >
                  <RefreshCcw className={cn('w-3.5 h-3.5 text-emerald-600', isRefreshing && 'animate-spin')} />
                  <span>{isRefreshing ? 'Syncing...' : 'Refresh Pipeline'}</span>
                </button>

                {/* City Filter */}
                <div className="flex bg-white border border-slate-200 rounded-md px-2 py-1 items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedCityFilter}
                    onChange={(e) => setSelectedCityFilter(e.target.value)}
                    className="text-xs font-bold bg-transparent border-0 focus:ring-0 text-slate-700 outline-none cursor-pointer pr-1"
                  >
                    <option value="All">All Cities (Natl Avg)</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Export dropdown */}
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                        <button
                          onClick={() => {
                            setShowMarketReport(true);
                            setShowExportMenu(false);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                        >
                          <FileText className="w-4 h-4 text-emerald-600" />
                          PDF Market Report
                        </button>
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                          CSV Verified Dataset
                        </button>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Grid vs Table View */}
                <div className="flex bg-white border border-slate-200 rounded-md p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      viewMode === 'grid'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-400 hover:text-slate-700'
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      viewMode === 'table'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-400 hover:text-slate-700'
                    )}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Content: Grid vs Table */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Loading PBS SPI Pipeline...
                  </span>
                </div>
              </div>
            ) : filteredCommodities.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {filteredCommodities.map((commodity) => (
                    <CommodityCard
                      key={commodity.id}
                      commodity={commodity}
                      onClick={() => setSelectedCommodityId(commodity.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest font-bold text-slate-500">
                        <tr>
                          <th className="px-5 py-3.5">Sr</th>
                          <th className="px-5 py-3.5">Commodity</th>
                          <th className="px-5 py-3.5">Category</th>
                          <th className="px-5 py-3.5 text-right">Spot Price (PKR)</th>
                          <th className="px-5 py-3.5 text-right">WoW Change</th>
                          <th className="px-5 py-3.5 text-right">YoY Change</th>
                          <th className="px-5 py-3.5 text-center">Verification</th>
                          <th className="px-5 py-3.5 text-center">City Spread</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredCommodities.map((commodity) => (
                          <tr
                            key={commodity.id}
                            onClick={() => setSelectedCommodityId(commodity.id)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-3 font-mono text-slate-400">
                              {commodity.sr ?? '—'}
                            </td>
                            <td className="px-5 py-3 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span>{commodity.name}</span>
                                {commodity.urdu_name && (
                                  <span className="text-slate-400 font-normal">
                                    ({commodity.urdu_name})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-500 font-medium">
                              {commodity.category}
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                              Rs {commodity.currentPrice.toLocaleString()}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">
                                /{commodity.unit}
                              </span>
                            </td>
                            <td
                              className={cn(
                                'px-5 py-3 text-right font-mono font-bold',
                                commodity.weeklyChangePercentage > 0
                                  ? 'text-emerald-600'
                                  : commodity.weeklyChangePercentage < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-500'
                              )}
                            >
                              {commodity.weeklyChangePercentage > 0 ? '+' : ''}
                              {commodity.weeklyChangePercentage.toFixed(2)}%
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-semibold text-slate-700">
                              {typeof commodity.yearlyChangePercentage === 'number'
                                ? `${commodity.yearlyChangePercentage > 0 ? '+' : ''}${commodity.yearlyChangePercentage.toFixed(2)}%`
                                : '—'}
                            </td>
                            <td className="px-5 py-3 text-center font-mono text-slate-700">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                {commodity.verification?.citiesVerifiedCount ?? 0}/17 Cities
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center font-mono text-slate-600 font-semibold text-[11px]">
                              {commodity.nationalMetrics
                                ? `Δ ${commodity.nationalMetrics.citySpreadPct.toFixed(1)}%`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              <div className="mt-16 flex flex-col items-center justify-center text-center">
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  No matching commodities found
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {liveCommodities.length === 0
                    ? 'No verified PBS SPI release loaded yet. Check Settings & Pipeline.'
                    : 'Try adjusting your search query or category filter.'}
                </p>
                {liveCommodities.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                      setSelectedCityFilter('All');
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="px-6 py-2 bg-slate-900 text-slate-400 text-[10px] flex flex-col sm:flex-row justify-between items-center shrink-0 border-t border-slate-800 gap-2">
        <span>
          &copy; 2026 Pakistan Market Intelligence · Primary Feed: Pakistan Bureau of Statistics (PBS SPI).
        </span>
        <div className="flex space-x-4 uppercase font-bold tracking-tight font-mono">
          <span>{enabledCitiesCount} PBS Urban Centers</span>
          <span>Basket: {liveCommodities.length} / 51 SPI Commodities</span>
          <span className={gateStatus?.status === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}>
            Gate: {gateStatus?.status || 'CHECKING'}
          </span>
        </div>
      </footer>

      {/* Commodity Detail Modal */}
      {selectedCommodityData && (
        <CommodityDetail
          commodity={selectedCommodityData}
          onClose={() => setSelectedCommodityId(null)}
          onOpenEnterprise={() => setShowEnterpriseModal(true)}
        />
      )}

      {/* Market Report PDF View Modal */}
      <AnimatePresence>
        {showMarketReport && (
          <MarketReport commodities={liveCommodities} onClose={() => setShowMarketReport(false)} />
        )}
      </AnimatePresence>

      {/* Business Inquiry Modal */}
      <BusinessInquiryModal
        isOpen={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
      />

      {/* Go Pro Sign-in Popup */}
      <AnimatePresence>
        {showLoginPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative border border-slate-200"
            >
              <button
                onClick={() => setShowLoginPopup(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center mb-5">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-widest">
                  Professional Tier
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-2">
                  Go Pro
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sign in to your analytical account
                </p>
              </div>
              <form
                className="space-y-3.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowLoginPopup(false);
                }}
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white rounded-md py-2 font-bold uppercase tracking-widest text-xs hover:bg-emerald-500 transition-colors mt-2"
                >
                  Sign In
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
