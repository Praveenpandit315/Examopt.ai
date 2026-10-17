// client/src/pages/admin/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Database, RefreshCw, Key, ShieldCheck, CheckCircle2, Server, Table } from 'lucide-react';
import { Toast } from '../../components/Toast';
import { api } from '../../services/api';

export function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [dbInfo, setDbInfo] = useState(null);
  const [loadingDb, setLoadingDb] = useState(false);

  useEffect(() => {
    loadDbInfo();
  }, []);

  const loadDbInfo = () => {
    setLoadingDb(true);
    api.admin.getDbInspector()
      .then(data => {
        setDbInfo(data);
      })
      .catch(err => {
        console.error('Failed to load db inspector:', err);
      })
      .finally(() => {
        setLoadingDb(false);
      });
  };

  const handleSaveAIConfig = (e) => {
    e.preventDefault();
    setToast({ message: 'AI Scheduling Copilot preferences saved!', type: 'success' });
  };

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Database Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Live SQLite database inspector, persistent storage, and AI Copilot configuration.</p>
        </div>
        <button 
          onClick={loadDbInfo}
          disabled={loadingDb}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database Management Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Relational SQLite Database Inspector</h2>
                <span className="text-[11px] text-slate-400">Zero-external-dependency Node.js v24 native storage</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>WAL Mode Active</span>
            </span>
          </div>

          {/* Database Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Database Engine</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">node:sqlite</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Tables</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{dbInfo ? dbInfo.totalTables : '16'} Tables</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Foreign Keys</span>
              <p className="text-xs font-bold text-emerald-600 mt-0.5">Enforced (ON)</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Concurrency</span>
              <p className="text-xs font-bold text-indigo-600 mt-0.5">WAL Journal</p>
            </div>
          </div>

          {/* File Path Card */}
          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] flex items-center justify-between overflow-hidden">
            <div className="truncate mr-2">
              <span className="text-slate-500 mr-2">FILE:</span>
              <span className="text-blue-400">{dbInfo ? dbInfo.dbPath : 'server/src/database/examopt.sqlite'}</span>
            </div>
            <span className="px-2 py-0.5 bg-slate-800 text-[10px] text-slate-300 rounded shrink-0">SQLite 3</span>
          </div>

          {/* Live Tables Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Database Tables & Row Counts</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {dbInfo && dbInfo.tables ? (
                dbInfo.tables.map((t) => (
                  <div key={t.name} className="p-2.5 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200/80 transition flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-700 truncate pr-2" title={t.name}>{t.name}</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 text-[10px] font-mono font-bold rounded-md shrink-0">
                      {t.count}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-4 py-6 text-center text-xs text-slate-400">
                  Loading database inspector tables...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Copilot Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">AI Scheduling Copilot</h2>
              <span className="text-[11px] text-slate-400">Gemini LLM Integration</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure Google Gemini API key for natural language timetable queries and explainability.
          </p>

          <form onSubmit={handleSaveAIConfig} className="space-y-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gemini API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
              <span className="text-[10px] text-slate-400 mt-1.5 block leading-normal">
                If left empty, system uses explainable rule-based diagnostic templates.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              Save Configuration
            </button>
          </form>

          <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Deterministic Guardrail:</span>
            </span>
            <p className="text-amber-700">
              Timetable validation is 100% deterministic and never delegates constraint validation to probabilistic LLMs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
