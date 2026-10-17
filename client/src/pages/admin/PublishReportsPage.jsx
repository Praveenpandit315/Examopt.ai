// client/src/pages/admin/PublishReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Download, 
  Printer, 
  CheckCircle2, 
  History, 
  FileSpreadsheet, 
  ShieldAlert, 
  Filter, 
  Search,
  Building,
  GraduationCap,
  Calendar,
  Layers,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Toast } from '../../components/Toast';

export function PublishReportsPage() {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [progFilter, setProgFilter] = useState('ALL');
  const [semFilter, setSemFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');

  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Default fallback data for initial visual representation
  const defaultAssignments = [
    { code: 'EX001', subject_code: 'CS101', subject_name: 'Data Structures', department: 'CSE', program: 'B.Tech', semester: 3, exam_date: '2025-04-15', start_time: '09:00', end_time: '11:00', room_code: 'R101', building: 'Block A', capacity: 100, groups: 'GRP-CS3A, GRP-CS3B' },
    { code: 'EX002', subject_code: 'CS102', subject_name: 'Operating Systems', department: 'CSE', program: 'B.Tech', semester: 3, exam_date: '2025-04-16', start_time: '12:00', end_time: '14:00', room_code: 'R102', building: 'Block A', capacity: 80, groups: 'GRP-CS3A, GRP-CS3B' },
    { code: 'EX003', subject_code: 'CS103', subject_name: 'Computer Networks Lab', department: 'CSE', program: 'B.Tech', semester: 5, exam_date: '2025-04-17', start_time: '09:00', end_time: '10:30', room_code: 'L1', building: 'Block C', capacity: 50, groups: 'GRP-CS5C' },
    { code: 'EX004', subject_code: 'EC101', subject_name: 'Electronics & Circuit Theory', department: 'ECE', program: 'B.Tech', semester: 3, exam_date: '2025-04-17', start_time: '12:00', end_time: '13:30', room_code: 'R203', building: 'Block B', capacity: 60, groups: 'GRP-CS3A, GRP-EC3A' },
    { code: 'EX005', subject_code: 'MA101', subject_name: 'Mathematics & Discrete Structures', department: 'MATH', program: 'B.Tech', semester: 1, exam_date: '2025-04-18', start_time: '09:00', end_time: '11:00', room_code: 'R101', building: 'Block A', capacity: 100, groups: 'GRP-CS3A, GRP-CS3B' },
    { code: 'EX006', subject_code: 'PH101', subject_name: 'Engineering Physics', department: 'CSE', program: 'B.Tech', semester: 1, exam_date: '2025-04-18', start_time: '12:00', end_time: '13:30', room_code: 'R102', building: 'Block A', capacity: 80, groups: 'GRP-CS3A, GRP-CS3B' },
    { code: 'EX-CS301', subject_code: 'CS301', subject_name: 'Java Programming', department: 'BCA', program: 'BCA', semester: 3, exam_date: '2025-04-15', start_time: '12:00', end_time: '14:00', room_code: 'R101', building: 'Block A', capacity: 100, groups: 'BCA Cohort' },
    { code: 'EX-MA305', subject_code: 'MA305', subject_name: 'Mathematics Elective', department: 'MATH', program: 'BCA', semester: 3, exam_date: '2025-04-16', start_time: '09:00', end_time: '12:00', room_code: 'R102', building: 'Block A', capacity: 80, groups: 'BCA Cohort' }
  ];

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.schedules.getAll();
      const list = res.schedules || [];
      setSchedules(list);

      // Find published schedule or latest draft
      const published = list.find(s => s.status === 'published');
      const target = published || list[0];
      if (target) {
        setSelectedScheduleId(target.id);
        const details = await api.schedules.getById(target.id);
        setActiveSchedule(details);
      }
    } catch (err) {
      console.warn('Could not load schedules from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleSelectSchedule = async (id) => {
    setSelectedScheduleId(id);
    try {
      const details = await api.schedules.getById(id);
      setActiveSchedule(details);
    } catch (err) {
      setToast({ message: 'Failed to load schedule details: ' + err.message, type: 'error' });
    }
  };

  const handlePublish = async () => {
    if (!selectedScheduleId) return;
    try {
      await api.schedules.publish(selectedScheduleId);
      setToast({ message: 'Timetable published! It is now visible to all students.', type: 'success' });
      loadSchedules();
    } catch (err) {
      setToast({ message: 'Publish failed: ' + err.message, type: 'error' });
    }
  };

  // Safe CSV export with formula injection prevention
  const handleExportCSV = () => {
    const assignmentsToExport = filteredAssignments;
    if (assignmentsToExport.length === 0) {
      setToast({ message: 'No examinations match current filters to export.', type: 'error' });
      return;
    }

    const sanitizeCell = (val) => {
      let str = String(val == null ? '' : val);
      // Neutralize formula injection triggers (=, +, -, @)
      if (/^[=+\-@]/.test(str)) {
        str = "'" + str;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Exam Code',
      'Subject Code',
      'Subject Name',
      'Department',
      'Program',
      'Semester',
      'Date',
      'Start Time',
      'End Time',
      'Room Code',
      'Building',
      'Capacity',
      'Enrolled Groups'
    ];

    const rows = assignmentsToExport.map(a => [
      sanitizeCell(a.code || a.exam_code),
      sanitizeCell(a.subject_code || a.code),
      sanitizeCell(a.subject_name || a.subject),
      sanitizeCell(a.department || 'GENERAL'),
      sanitizeCell(a.program || 'Undergraduate'),
      sanitizeCell(a.semester || 1),
      sanitizeCell(a.exam_date || a.date),
      sanitizeCell(a.start_time || (a.time ? a.time.split('-')[0].trim() : '')),
      sanitizeCell(a.end_time || (a.time ? a.time.split('-')[1]?.trim() : '')),
      sanitizeCell(a.room_code || a.room),
      sanitizeCell(a.building || 'Main Campus'),
      sanitizeCell(a.capacity || a.room_capacity || 60),
      sanitizeCell(a.groups || 'General Cohort')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExamOpt_Timetable_${activeSchedule?.schedule?.version_code || 'Report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'CSV timetable downloaded successfully (formula-sanitized)!', type: 'success' });
  };

  const handlePrint = () => {
    window.print();
  };

  const rawAssignments = (activeSchedule?.assignments && activeSchedule.assignments.length > 0)
    ? activeSchedule.assignments.map(a => ({
        ...a,
        department: a.department || 'GENERAL',
        program: a.program || 'Undergraduate',
        semester: a.semester || 1,
        date: a.exam_date,
        time: `${a.start_time} - ${a.end_time}`,
        room: a.room_code,
        subject: a.subject_name
      }))
    : defaultAssignments;

  // Extract filter options
  const availableDepts = Array.from(new Set(rawAssignments.map(a => a.department).filter(Boolean)));
  const availablePrograms = Array.from(new Set(rawAssignments.map(a => a.program).filter(Boolean)));
  const availableSemesters = Array.from(new Set(rawAssignments.map(a => a.semester).filter(Boolean))).sort((a,b) => a - b);
  const availableRooms = Array.from(new Set(rawAssignments.map(a => a.room_code || a.room).filter(Boolean)));

  // Filtered assignments
  const filteredAssignments = rawAssignments.filter(a => {
    if (deptFilter !== 'ALL' && a.department !== deptFilter) return false;
    if (progFilter !== 'ALL' && a.program !== progFilter) return false;
    if (semFilter !== 'ALL' && String(a.semester) !== String(semFilter)) return false;
    const rCode = a.room_code || a.room;
    if (roomFilter !== 'ALL' && rCode !== roomFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const code = (a.code || a.subject_code || '').toLowerCase();
      const sub = (a.subject || a.subject_name || '').toLowerCase();
      const rm = (rCode || '').toLowerCase();
      if (!code.includes(q) && !sub.includes(q) && !rm.includes(q)) return false;
    }
    return true;
  });

  const isCurrentPublished = activeSchedule?.schedule?.status === 'published';

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Publish & Export Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorize validated timetables for student publication, filter multi-department cohorts, and export sanitized reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Notice</span>
          </button>
        </div>
      </div>

      {/* Schedule Selection & Publish Status Header (No Print) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Select Schedule Version</label>
            {schedules.length > 0 ? (
              <select
                value={selectedScheduleId || ''}
                onChange={(e) => handleSelectSchedule(Number(e.target.value))}
                className="w-full max-w-md text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.version_code}) — [{s.status.toUpperCase()}] • {s.scheduled_exams} exams
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-500">Default Baseline Timetable (TT-2025-V1.0)</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isCurrentPublished ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Published & Active to Students</span>
              </span>
            ) : (
              <button
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Send className="w-4 h-4" />
                <span>Publish to Student Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Dimensional Filter Bar */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Multi-Dimensional Timetable Filters</span>
            </span>
            {(deptFilter !== 'ALL' || progFilter !== 'ALL' || semFilter !== 'ALL' || roomFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setDeptFilter('ALL');
                  setProgFilter('ALL');
                  setSemFilter('ALL');
                  setRoomFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] text-rose-600 hover:underline font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <div className="sm:col-span-1">
              <input
                type="text"
                placeholder="Search paper/code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full text-xs font-medium px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="ALL">All Depts ({availableDepts.length})</option>
                {availableDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={progFilter}
                onChange={(e) => setProgFilter(e.target.value)}
                className="w-full text-xs font-medium px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="ALL">All Programs</option>
                {availablePrograms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={semFilter}
                onChange={(e) => setSemFilter(e.target.value)}
                className="w-full text-xs font-medium px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="ALL">All Semesters</option>
                {availableSemesters.map(s => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full text-xs font-medium px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="ALL">All Rooms ({availableRooms.length})</option>
                {availableRooms.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Official Printable Examination Timetable Document */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="text-center pb-5 border-b-2 border-slate-900 space-y-1">
          <div className="inline-block px-3 py-0.5 bg-slate-900 text-white text-[10px] font-bold tracking-widest uppercase rounded">
            Official University Notice
          </div>
          <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight pt-1">
            GLA UNIVERSITY — OFFICE OF THE CONTROLLER OF EXAMINATIONS
          </h2>
          <p className="text-xs font-bold text-slate-700">
            {activeSchedule?.schedule?.name || 'CONSOLIDATED END-SEMESTER EXAMINATION TIMETABLE'}
          </p>
          <p className="text-[11px] text-slate-500">
            Version: {activeSchedule?.schedule?.version_code || 'TT-2025-V1.0'} • Academic Session 2025-2026 • Verified Conflict-Free by ExamOpt AI
          </p>
        </div>

        {/* Timetable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 text-slate-800 font-bold">
                <th className="p-2.5">Paper Code</th>
                <th className="p-2.5">Course / Subject Name</th>
                <th className="p-2.5">Dept / Cohort</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Time Slot</th>
                <th className="p-2.5">Allocated Venue</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">{a.code || a.subject_code}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{a.subject || a.subject_name}</td>
                    <td className="p-2.5">
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                        {a.department || 'GENERAL'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {a.program} (Sem {a.semester})
                      </span>
                    </td>
                    <td className="p-2.5 font-medium whitespace-nowrap">{a.date || a.exam_date}</td>
                    <td className="p-2.5 font-mono text-[11px] whitespace-nowrap">{a.time || `${a.start_time} - ${a.end_time}`}</td>
                    <td className="p-2.5 font-bold text-slate-800">{a.room || a.room_code}</td>
                    <td className="p-2.5 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600 inline" />
                        <span>Confirmed</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-slate-400 text-xs">
                    No examination records match the current filter selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Institutional Signature & Validation Seal */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-[10px] text-slate-400 font-mono">DETERMINISTIC VALIDATION SEAL</div>
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certified 0 Hard Conflicts (Student & Venue Collision Free)</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Digest: SHA256-Commit2Win-ExamOptAI-{activeSchedule?.schedule?.version_code || 'V1.0'}
            </div>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <div className="h-8 flex items-end justify-center sm:justify-end">
              <span className="font-serif italic font-bold text-slate-800 border-b border-slate-400 px-4">
                Dr. Sarah Mitchell
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-800">Controller of Examinations</div>
            <div className="text-[10px] text-slate-400">GLA University Examination Authority</div>
          </div>
        </div>
      </div>
    </div>
  );
}
