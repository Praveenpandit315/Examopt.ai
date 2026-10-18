// client/src/pages/admin/ScheduleHistoryPage.jsx
// Schedule Version History, Diff Comparisons, and System Audit Logs

import React, { useState, useEffect } from 'react';
import { 
  History, 
  GitCompare, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

export function ScheduleHistoryPage() {
  const [activeTab, setActiveTab] = useState('versions');
  const [versions, setVersions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Diff comparison states
  const [diffV1, setDiffV1] = useState('');
  const [diffV2, setDiffV2] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  // Audit filter state
  const [auditActionFilter, setAuditActionFilter] = useState('');

  useEffect(() => {
    loadVersions();
    loadAuditLogs();
  }, []);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const res = await api.history.getVersions();
      const list = res.versions || [];
      setVersions(list);
      if (list.length >= 2) {
        setDiffV1(list[1].id);
        setDiffV2(list[0].id);
      } else if (list.length === 1) {
        setDiffV1(list[0].id);
        setDiffV2(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load schedule versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async (action = '') => {
    try {
      const res = await api.history.getAuditLogs({ action });
      setAuditLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const handleCompare = async () => {
    if (!diffV1 || !diffV2) return;
    setLoadingDiff(true);
    try {
      const res = await api.history.getDiff(diffV1, diffV2);
      setDiffResult(res);
    } catch (err) {
      console.error('Failed to compare versions:', err);
    } finally {
      setLoadingDiff(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Schedule History & Audit</h1>
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Governance & Versioning
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete traceability of all timetable generations, publish events, version deltas, and user audit actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadVersions(); loadAuditLogs(auditActionFilter); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('versions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'versions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Version Timeline ({versions.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('diff'); handleCompare(); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'diff'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Version Diff Tool</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>System Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Version Timeline */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Version Code</th>
                    <th className="py-3 px-4">Schedule Name</th>
                    <th className="py-3 px-4">Strategy</th>
                    <th className="py-3 px-4 text-center">Scheduled</th>
                    <th className="py-3 px-4 text-center">Conflicts</th>
                    <th className="py-3 px-4 text-center">Utilization</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {versions.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{v.version_code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{v.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 capitalize">
                        {v.strategy.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {v.scheduled_exams} / {v.total_exams}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.hard_conflicts === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {v.hard_conflicts} conflicts
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {v.seating_utilization?.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-slate-600">{v.created_by_name || 'System Admin'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          v.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : v.status === 'approved'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {v.created_at?.slice(0, 16)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Version Diff Tool */}
      {activeTab === 'diff' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Base Version (A)
                </label>
                <select
                  value={diffV1}
                  onChange={(e) => setDiffV1(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>{v.version_code} ({v.strategy})</option>
                  ))}
                </select>
              </div>

              <div className="text-slate-400 font-bold self-end pb-2">VS</div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Comparison Version (B)
                </label>
                <select
                  value={diffV2}
                  onChange={(e) => setDiffV2(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>{v.version_code} ({v.strategy})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={loadingDiff || !diffV1 || !diffV2}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              <span>{loadingDiff ? 'Calculating Delta...' : 'Compare Versions'}</span>
            </button>
          </div>

          {diffResult && (
            <div className="space-y-4">
              {/* Metrics Delta Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Changed Exams</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{diffResult.totalChanges} Exams</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Utilization Delta</span>
                  <p className="text-lg font-bold text-blue-600 mt-0.5">
                    {diffResult.metricsDelta.utilizationDelta > 0 ? '+' : ''}{diffResult.metricsDelta.utilizationDelta}%
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Conflicts Delta</span>
                  <p className="text-lg font-bold text-emerald-600 mt-0.5">
                    {diffResult.metricsDelta.conflictsDelta}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Solver Speed Delta</span>
                  <p className="text-lg font-bold text-slate-700 mt-0.5">
                    {diffResult.metricsDelta.executionTimeDeltaMs}ms
                  </p>
                </div>
              </div>

              {/* Assignment Delta Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Detailed Assignment Moves & Modifications
                  </h3>
                  <span className="text-xs text-slate-400">
                    Comparing {diffResult.v1.version_code} with {diffResult.v2.version_code}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Paper Code</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Status in Version B</th>
                        <th className="py-3 px-4">Base Slot / Venue (A)</th>
                        <th className="py-3 px-4">New Slot / Venue (B)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {diffResult.diffs.length > 0 ? (
                        diffResult.diffs.map((d) => (
                          <tr key={d.examId} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-blue-600">{d.examCode}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{d.subjectName}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                d.status === 'modified' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {d.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                              {d.v1 ? `${d.v1.date} ${d.v1.time} • Room ${d.v1.room}` : '—'}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] font-bold text-blue-600">
                              {d.v2 ? `${d.v2.date} ${d.v2.time} • Room ${d.v2.room}` : '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-10 text-center text-slate-400">
                            Zero modifications detected between these two schedule versions.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Filter Action:</span>
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    loadAuditLogs(e.target.value);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">All Actions</option>
                  <option value="SEAT_ALLOCATION">SEAT_ALLOCATION</option>
                  <option value="IMPORT_COMMIT">IMPORT_COMMIT</option>
                  <option value="SESSION_CREATE">SESSION_CREATE</option>
                  <option value="PUBLISH_SCHEDULE">PUBLISH_SCHEDULE</option>
                  <option value="RESCUE_SIMULATION">RESCUE_SIMULATION</option>
                </select>
              </div>
              <span className="text-xs text-slate-400">Immutable SQL Audit Log Trail</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Entity ID</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-slate-400">#{log.id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{log.entity_type}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{log.entity_id || '—'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                        {log.details_json}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{log.user_name || 'Admin'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                        {log.created_at?.slice(0, 19).replace('T', ' ')}
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
  );
}
