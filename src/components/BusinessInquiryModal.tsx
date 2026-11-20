import React, { useState } from 'react';
import { X, Building2, CheckCircle2, Send, ShieldCheck, Database, FileSpreadsheet } from 'lucide-react';

interface BusinessInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BusinessInquiryModal({ isOpen, onClose }: BusinessInquiryModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [useCase, setUseCase] = useState<'Bulk Historical Data' | 'Procurement API Feed' | 'ERP Integration' | 'Custom Mandi Coverage'>('Procurement API Feed');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setSubmitting(true);
    try {
      await fetch('/api/enterprise/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          use_case: useCase,
          message
        })
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Enterprise & Procurement Access
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Data Mandi Commercial Services
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              We offer FMCG procurement teams, agribusinesses, and financial analysts automated mandi feeds, historical 5-year data exports, and REST APIs.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="procurement@company.com"
                    className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. National Foods"
                    className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Primary Use Case
                  </label>
                  <select
                    value={useCase}
                    onChange={(e: any) => setUseCase(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Procurement API Feed">Procurement API Feed</option>
                    <option value="Bulk Historical Data">Bulk Historical Data (CSV/Parquet)</option>
                    <option value="ERP Integration">SAP / Oracle ERP Integration</option>
                    <option value="Custom Mandi Coverage">Custom Mandi Ground Ingestion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Specific Requirements or Commodities of Interest
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what data feeds, cities, or integration frequency you need..."
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  NDA & enterprise SLA options available
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{submitting ? 'Submitting...' : 'Request Data Access'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black text-slate-900">Inquiry Received</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Thank you for reaching out, <strong>{name}</strong>. Our enterprise market data team will review your requirements and send access credentials & sample datasets within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
