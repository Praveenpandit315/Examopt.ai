// client/src/pages/admin/ExamSessionBuilderPage.jsx
// Exam Session Builder: Configure scoped exam sessions and auto-populate papers, students, and venues

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarRange, 
  Layers, 
  Users, 
  DoorOpen, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Filter, 
  Building, 
  GraduationCap, 
  Plus, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import { api } from '../../services/api';
import { Toast } from '../../components/Toast';

export function ExamSessionBuilderPage() {
  const navigate = useNavigate();

  // Form State
  const [sessionName, setSessionName] = useState('BCA Odd Semester Examinations 2026');
  const [academicTerm, setAcademicTerm] = useState('2026-Odd');
  const [selectedDepts, setSelectedDepts] = useState(['BCA']);
  const [selectedPrograms, setSelectedPrograms] = useState(['BCA']);
  const [selectedSemesters, setSelectedSemesters] = useState([3]);
  const [startDate, setStartDate] = useState('2026-04-14');
  const [endDate, setEndDate] = useState('2026-04-18');
  const [strategy, setStrategy] = useState('smart_backtracking');

  // Preview & Engine State
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savedSessions, setSavedSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const AVAILABLE_DEPTS = ['BCA', 'CSE', 'MATH', 'ECE'];
  const AVAILABLE_PROGRAMS = ['BCA', 'BTECH-CSE', 'BTECH-ECE'];
  const AVAILABLE_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchScopePreview();
    fetchSavedSessions();
  }, [academicTerm, selectedDepts, selectedPrograms, selectedSemesters]);

  const fetchScopePreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await api.sessions.previewScope({
        academicTerm,
        departments: selectedDepts.join(','),
        programs: selectedPrograms.join(','),
        semesters: selectedSemesters.join(',')
      });
      setPreviewData(res);
    } catch (err) {
      console.error('Failed to preview scope:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchSavedSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.sessions.getAll();
      setSavedSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const toggleDept = (dept) => {
    setSelectedDepts(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const toggleProgram = (prog) => {
    setSelectedPrograms(prev => 
      prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]
    );
  };

  const toggleSemester = (sem) => {
    setSelectedSemesters(prev => 
      prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem]
    );
  };

  const handleGenerateForSession = async () => {
    if (!sessionName || !startDate || !endDate) {
      setToast({ message: 'Please complete session name and exam date range', type: 'error' });
      return;
    }

    setGenerating(true);
    try {
      // 1. Create or save session
      const createRes = await api.sessions.create({
        name: sessionName,
        academicTerm,
        startDate,
        endDate,
        departments: selectedDepts,
        programs: selectedPrograms,
        semesters: selectedSemesters,
        selectedPaperIds: previewData?.eligiblePapers?.map(p => p.id) || []
      });

      // 2. Generate timetable scoped to session
      const genRes = await api.sessions.generate(createRes.sessionId, strategy);
      setToast({
        message: `Generated timetable for ${sessionName}: ${genRes.scheduled}/${genRes.totalExams} scheduled in ${genRes.executionTime}`,
        type: 'success'
      });

      setTimeout(() => {
        navigate('/admin/generate');
      }, 1000);
    } catch (err) {
      setToast({ message: err.message || 'Failed to generate session timetable', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exam Session Builder</h1>
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Scoped Scheduling
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build examination sessions using persistent university master data without re-entering courses, rooms, or students.
          </p>
        </div>

        <button
          onClick={fetchScopePreview}
          disabled={loadingPreview}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Scope</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scope Configuration Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CalendarRange className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Session Parameters & Scope</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Session Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Session Title</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. BCA Odd Semester Examinations 2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
              />
            </div>

            {/* Academic Term */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Academic Term</label>
              <select
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
              >
                <option value="2026-Odd">2026-Odd (July - December)</option>
                <option value="2025-Even">2025-Even (January - June)</option>
                <option value="2025-Odd">2025-Odd (Autumn Session)</option>
              </select>
            </div>

            {/* Departments */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Target Departments</span>
                <span className="text-[10px] text-slate-400">Select multiple</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_DEPTS.map(dept => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedDepts.includes(dept)
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Programs */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Academic Programs</span>
                <span className="text-[10px] text-slate-400">Select multiple</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_PROGRAMS.map(prog => (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => toggleProgram(prog)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedPrograms.includes(prog)
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {prog}
                  </button>
                ))}
              </div>
            </div>

            {/* Semesters */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Semesters</label>
              <div className="grid grid-cols-4 gap-1.5">
                {AVAILABLE_SEMESTERS.map(sem => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => toggleSemester(sem)}
                    className={`py-1 rounded-lg text-xs font-semibold transition text-center ${
                      selectedSemesters.includes(sem)
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            </div>

            {/* Examination Date Range */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Scheduling Strategy Switcher */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Scheduling Algorithm</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStrategy('smart_backtracking')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    strategy === 'smart_backtracking'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs">Smart Backtracking</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">MRV & Soft capacity scoring</p>
                </button>

                <button
                  type="button"
                  onClick={() => setStrategy('first_fit')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    strategy === 'first_fit'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs">First-Fit Baseline</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">Greedy chronological solver</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Scope Preview & Auto-Loaded Papers (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 4 Preview Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Eligible Papers</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {previewData ? previewData.totalEligibleExams : '0'}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Affected Students</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {previewData ? previewData.totalAffectedStudents : '0'}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Available Rooms</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {previewData ? previewData.roomPoolCount : '0'}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Clash Protection</span>
              <p className="text-lg font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active</span>
              </p>
            </div>
          </div>

          {/* Warnings Box if any */}
          {previewData && previewData.warnings && previewData.warnings.length > 0 && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pre-Flight Scope Warnings ({previewData.warnings.length}):</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-700">
                {previewData.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Auto-Loaded Papers Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Automatically Retrieved Examination Papers
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Retrieved directly from database
              </span>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto pr-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                  <tr>
                    <th className="px-3 py-2 rounded-l-lg">Code</th>
                    <th className="px-3 py-2">Subject Title</th>
                    <th className="px-3 py-2">Dept</th>
                    <th className="px-3 py-2">Sem</th>
                    <th className="px-3 py-2">Venue Type</th>
                    <th className="px-3 py-2 text-right rounded-r-lg">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData && previewData.eligiblePapers && previewData.eligiblePapers.length > 0 ? (
                    previewData.eligiblePapers.map((paper) => (
                      <tr key={paper.id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2 font-mono font-bold text-blue-600">{paper.subjectCode}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{paper.subjectName}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-[10px] uppercase">{paper.department}</td>
                        <td className="px-3 py-2 text-slate-600">Sem {paper.semester}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            paper.requiredRoomType === 'computer_lab'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {paper.requiredRoomType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-700">{paper.studentCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-3 py-8 text-center text-slate-400">
                        No eligible examinations found for this scope. Try adjusting department or semester filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Launch Scheduling Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Ready to schedule with university-wide clash prevention.
              </span>

              <button
                type="button"
                onClick={handleGenerateForSession}
                disabled={generating || !previewData || previewData.totalEligibleExams === 0}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <span>Optimizing Session...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Session Timetable</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Exam Sessions Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">University Examination Sessions Directory</h2>
          </div>
          <span className="text-xs text-slate-400">{savedSessions.length} Sessions Configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Session Code</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Academic Term</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Departments</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {savedSessions.length > 0 ? (
                savedSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{sess.session_code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{sess.name}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{sess.academic_term}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{sess.start_date} to {sess.end_date}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {(JSON.parse(sess.departments_filter || '[]')).join(', ') || 'All Departments'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        sess.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sess.status === 'scheduled'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {sess.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate('/admin/generate')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View Timetable
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No examination sessions configured yet. Use the parameters above to create your first session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
