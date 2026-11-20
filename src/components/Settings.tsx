import React, { useState, useEffect } from 'react';
import { DataSource, LogEntry, PublishGateResult } from '../types';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  ShieldCheck,
  ShieldAlert,
  Archive,
  DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface SettingsProps {
  onPipelineRun?: () => void;
}

interface PublishGatePayload {
  gate: PublishGateResult;
  archive: {
    archived_weeks: number;
    oldest_week: string | null;
    newest_week: string | null;
  };
  forex: {
    date: string;
    usd_pkr: number;
    source_url: string;
    fetched_at: string;
  } | null;
  last_pipeline_error: string | null;
}

export function Settings({ onPipelineRun }: SettingsProps) {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [gateInfo, setGateInfo] = useState<PublishGatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [formData, setFormData] = useState<Partial<DataSource>>({});

  const fetchData = async () => {
    try {
      const [srcRes, logRes, gateRes] = await Promise.all([
        fetch('/api/sources'),
        fetch('/api/logs'),
        fetch('/api/publish-gate')
      ]);
      const [srcData, logData, gateData] = await Promise.all([
        srcRes.json(),
        logRes.json(),
        gateRes.json()
      ]);
      setSources(srcData);
      setLogs(logData);
      setGateInfo(gateData);
    } catch (err) {
      console.error('Failed to fetch sources, logs, or gate info', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerPipeline = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/pipeline/run', { method: 'POST' });
      await fetchData();
      if (onPipelineRun) onPipelineRun();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenModal = (source?: DataSource) => {
    if (source) {
      setEditingSource(source);
      setFormData(source);
    } else {
      setEditingSource(null);
      setFormData({
        name: '',
        organization: '',
        url: '',
        geography: 'National',
        frequency: 'Weekly',
        format: 'Excel (.xlsx)',
        data_type: 'Retail Prices',
        parser: 'CustomEndpointUnimplemented',
        coverage_notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSource && editingSource.source_id) {
        await fetch(`/api/sources/${editingSource.source_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save source', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete source', err);
    }
  };

  const getStatusPresentation = (source: DataSource) => {
    switch (source.status) {
      case 'success':
        return {
          label: 'Verified Live',
          textClass: 'text-emerald-700',
          bgClass: 'bg-emerald-50 border-emerald-200',
          icon: CheckCircle2
        };
      case 'error':
        return {
          label: 'Fetch Error',
          textClass: 'text-rose-700',
          bgClass: 'bg-rose-50 border-rose-200',
          icon: AlertCircle
        };
      case 'not_implemented':
        return {
          label: 'Not Implemented',
          textClass: 'text-amber-700',
          bgClass: 'bg-amber-50 border-amber-200',
          icon: AlertCircle
        };
      case 'fetching':
        return {
          label: 'Fetching',
          textClass: 'text-slate-700',
          bgClass: 'bg-slate-100 border-slate-200',
          icon: RefreshCw
        };
      default:
        return {
          label: 'Idle',
          textClass: 'text-slate-600',
          bgClass: 'bg-slate-50 border-slate-200',
          icon: AlertCircle
        };
    }
  };

  return (
    <div className="col-span-1 lg:col-span-10 p-6 overflow-y-auto space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              Verification Architecture · Live Source Registry
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Pipeline & Data Sources
            </h2>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Honest connector telemetry, live PBS SPI discovery, historical release archive, and Publish Gate invariants.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Source</span>
            </button>
            <button
              onClick={handleTriggerPipeline}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              <span>{refreshing ? 'Running Discovery...' : 'Run Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Archive, Forex & Publish Gate Strip */}
        {gateInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Publish Gate Status</span>
                {gateInfo.gate.status === 'PASSED' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                )}
              </div>
              <div
                className={cn(
                  'text-lg font-black font-mono mt-1',
                  gateInfo.gate.status === 'PASSED' ? 'text-emerald-700' : 'text-rose-700'
                )}
              >
                {gateInfo.gate.status}
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                {gateInfo.gate.week_ended_date
                  ? `Week ${gateInfo.gate.week_ended_date} · ${gateInfo.gate.items_parsed}/51 items · ${gateInfo.gate.annex_cities_count}/17 cities`
                  : 'No verified PBS release loaded'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Disk Historical Archive</span>
                <Archive className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-lg font-black font-mono text-slate-900 mt-1">
                {gateInfo.archive.archived_weeks} Weeks Stored
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5 font-mono">
                {gateInfo.archive.oldest_week && gateInfo.archive.newest_week
                  ? `${gateInfo.archive.oldest_week} → ${gateInfo.archive.newest_week}`
                  : 'Empty archive'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Live USD/PKR Reference</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-black font-mono text-slate-900 mt-1">
                {gateInfo.forex ? `Rs ${gateInfo.forex.usd_pkr.toFixed(2)}` : 'Unavailable'}
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                {gateInfo.forex ? `Fetched ${gateInfo.forex.date}` : 'Forex feed pending'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sources Grid */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading Source Registry...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((source) => {
            const statusUI = getStatusPresentation(source);
            const StatusIcon = statusUI.icon;
            return (
              <div
                key={source.source_id || source.name}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      {source.source_id}
                    </span>
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border',
                        statusUI.bgClass,
                        statusUI.textClass
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusUI.label}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {source.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {source.organization}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleOpenModal(source)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                        title="Edit Source"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(source.source_id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded"
                        title="Delete Source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-semibold">Geography</span>
                      <span className="text-slate-800 font-bold">{source.geography || 'National'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Frequency</span>
                      <span className="text-slate-800 font-bold">{source.frequency || 'Weekly'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Format</span>
                      <span className="text-slate-800 font-bold">{source.format || 'Excel'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Observations</span>
                      <span className="text-slate-800 font-bold font-mono">
                        {source.total_observations.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 rounded p-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Runtime Status Detail
                    </span>
                    {source.status_detail || source.coverage_notes}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>Official Endpoint</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-500 font-mono">
                    {source.last_success
                      ? `Synced ${new Date(source.last_success).toLocaleDateString()}`
                      : source.implementation_status === 'not_implemented'
                      ? 'Excluded from calcs'
                      : 'Pending sync'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pipeline Stage Architecture & Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            Verified Data Processing Lifecycle
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <strong className="text-slate-900 block">Dynamic Discovery (DISCOVER & INGEST)</strong>
                Queries PBS WordPress release API and Price Statistics listings to locate the newest weekly SPI report and Appendix-A Excel workbooks without hardcoded URLs.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <strong className="text-slate-900 block">Header-Driven Exact Parsing (PARSE)</strong>
                Detects Page 1, Page 2, and 17-city Appendix-A columns dynamically by header labels and resolves all 51 official PBS items 1:1 via exact normalized keys.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <strong className="text-slate-900 block">Persistent Weekly Archive (ARCHIVE)</strong>
                Stores parsed weekly PBS SPI workbooks and live USD/PKR snapshots to disk so historical trends reflect strictly real archived observations—zero synthetic random walks.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <strong className="text-slate-900 block">Strict Publish Gate (VALIDATE & PUBLISH)</strong>
                Requires 51/51 items, release age &le; 8 days, verified Page 1 index/WoW/YoY, arithmetic WoW% check, and 17 city headers. Unimplemented sources are marked explicitly and never fabricated.
              </div>
            </div>
          </div>
        </div>

        {/* Live Execution Logs */}
        <div className="lg:col-span-6 bg-slate-900 text-slate-200 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Pipeline Execution Stream
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Auditable Logs</span>
          </div>

          <div className="flex-1 max-h-[280px] overflow-y-auto font-mono text-[11px] space-y-2 pr-1">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="p-2 rounded bg-slate-800/80 border border-slate-700/50">
                <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                  <span className="text-emerald-400 font-bold">[{log.stage || 'PIPELINE'}]</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div
                  className={cn(
                    'font-medium leading-tight',
                    log.level === 'error'
                      ? 'text-rose-400'
                      : log.level === 'warn'
                      ? 'text-amber-400'
                      : log.level === 'success'
                      ? 'text-emerald-300'
                      : 'text-slate-300'
                  )}
                >
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit Source */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {editingSource ? 'Edit Source Configuration' : 'Register New Source Endpoint'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  New custom endpoints default to Not Implemented until a verified parser is attached.
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Source Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                      placeholder="e.g. Sindh Bureau of Statistics"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Organization / Department
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.organization || ''}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                      placeholder="e.g. Government of Sindh"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Endpoint URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                    placeholder="https://example.gov.pk/prices"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Format
                    </label>
                    <input
                      type="text"
                      value={formData.format || 'JSON'}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency || 'Weekly'}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Geography
                    </label>
                    <input
                      type="text"
                      value={formData.geography || ''}
                      onChange={(e) => setFormData({ ...formData, geography: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                      placeholder="e.g. Sindh, National"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Coverage Notes
                  </label>
                  <textarea
                    value={formData.coverage_notes || ''}
                    onChange={(e) => setFormData({ ...formData, coverage_notes: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 min-h-[72px] resize-y"
                    placeholder="Brief description of endpoint schema..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingSource ? 'Update Source' : 'Register Source'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
