// client/src/pages/admin/SeatAllocationPage.jsx
// Post-Scheduling Physical Seat Allocation and Visual Desk Grid Layout

import React, { useState, useEffect } from 'react';
import { 
  Armchair, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  RefreshCw, 
  Building2, 
  Users, 
  Calendar, 
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';

export function SeatAllocationPage() {
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  
  const [strategy, setStrategy] = useState('sequential');
  const [allocating, setAllocating] = useState(false);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    if (selectedScheduleId) {
      loadScheduleSummary(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  useEffect(() => {
    if (selectedAssignmentId) {
      loadAssignmentGrid(selectedAssignmentId);
    }
  }, [selectedAssignmentId]);

  const loadSchedules = async () => {
    try {
      const res = await api.schedules.getAll();
      setSchedules(res.schedules || []);
      if (res.schedules && res.schedules.length > 0) {
        setSelectedScheduleId(res.schedules[0].id);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  };

  const loadScheduleSummary = async (scheduleId) => {
    try {
      const res = await api.seating.getSummary(scheduleId);
      setSummaryData(res);
      if (res.assignments && res.assignments.length > 0) {
        setSelectedAssignmentId(res.assignments[0].assignment_id);
      } else {
        setSelectedAssignmentId(null);
        setAssignmentDetails(null);
      }
    } catch (err) {
      console.error('Failed to load seating summary:', err);
    }
  };

  const loadAssignmentGrid = async (assignmentId) => {
    setLoadingGrid(true);
    try {
      const res = await api.seating.getAssignment(assignmentId);
      setAssignmentDetails(res);
    } catch (err) {
      console.error('Failed to load assignment seating grid:', err);
    } finally {
      setLoadingGrid(false);
    }
  };

  const handleRunAllocation = async () => {
    if (!selectedScheduleId) return;
    setAllocating(true);
    setAlertMsg(null);
    try {
      const res = await api.seating.allocate(selectedScheduleId, { strategy, reallocate: true });
      setAlertMsg({
        type: 'success',
        text: `Allocated ${res.totalSeatsAllocated} seats across ${res.totalAssignments} exams successfully!`
      });
      loadScheduleSummary(selectedScheduleId);
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message || 'Seat allocation failed' });
    } finally {
      setAllocating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physical Seat Allocation</h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Post-Scheduling Desk Map
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Map enrolled candidates to physical examination room desks with anti-cheating separation algorithms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Chart</span>
          </button>
          <button
            onClick={handleRunAllocation}
            disabled={allocating || !selectedScheduleId}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{allocating ? 'Allocating Desks...' : 'Run Auto Allocation'}</span>
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="font-medium">{alertMsg.text}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Schedule Version
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
            >
              {schedules.map(s => (
                <option key={s.id} value={s.id}>
                  {s.version_code} ({s.status}) - {s.scheduled_exams} Exams
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Seating Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
            >
              <option value="sequential">Sequential Roll Numbers</option>
              <option value="alternate">Alternate / Checkerboard Spacing</option>
            </select>
          </div>
        </div>

        {summaryData && (
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Allocated</span>
              <div className="text-base font-bold text-blue-600">{summaryData.totalSeatsAllocated} Desks</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Exam Sessions</span>
              <div className="text-base font-bold text-slate-800">{summaryData.totalAssignments} Rooms</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid & Room Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Exam Assignment List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Exam Venues</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-medium">
              {summaryData?.assignments?.length || 0} scheduled
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {summaryData?.assignments?.map((a) => {
              const isSelected = selectedAssignmentId === a.assignment_id;
              const isFullyAllocated = a.allocated_seats >= a.enrolled_students && a.enrolled_students > 0;

              return (
                <button
                  key={a.assignment_id}
                  onClick={() => setSelectedAssignmentId(a.assignment_id)}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{a.room_code} • {a.room_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isFullyAllocated 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : a.allocated_seats > 0 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {a.allocated_seats} / {a.enrolled_students} seats
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-blue-600 mt-1 line-clamp-1">{a.subject_name}</div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {a.exam_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {a.start_time}-{a.end_time}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Visual Seat Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Room {assignmentDetails?.assignment?.room_code || '—'}</span>
                <span className="text-slate-400 font-normal">({assignmentDetails?.assignment?.room_name})</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Paper: {assignmentDetails?.assignment?.subject_name} ({assignmentDetails?.assignment?.exam_code})
              </p>
            </div>

            {/* Candidate Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Find student roll or name..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Invigilator Podium / Stage Marker */}
          <div className="w-full py-2 bg-slate-100 rounded-xl text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
            Blackboard / Invigilator Podium
          </div>

          {/* Physical Desks Grid */}
          {loadingGrid ? (
            <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading seating chart...</span>
            </div>
          ) : assignmentDetails?.seats && assignmentDetails.seats.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 py-4 max-h-[500px] overflow-y-auto">
              {assignmentDetails.seats.map((seat) => {
                const alloc = seat.allocation;
                const isMatched = searchStudent && (
                  alloc?.roll_number?.toLowerCase().includes(searchStudent.toLowerCase()) ||
                  alloc?.full_name?.toLowerCase().includes(searchStudent.toLowerCase())
                );

                return (
                  <div
                    key={seat.id}
                    className={`p-2 rounded-xl text-center border transition-all text-xs flex flex-col justify-between h-20 ${
                      isMatched
                        ? 'bg-amber-300 border-amber-500 ring-2 ring-amber-400 text-slate-900 shadow-md font-bold'
                        : alloc
                        ? 'bg-blue-50 border-blue-200 text-slate-800'
                        : 'bg-slate-50/60 border-slate-200/80 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{seat.seat_number}</span>
                      <Armchair className={`w-3 h-3 ${alloc ? 'text-blue-600' : 'text-slate-300'}`} />
                    </div>

                    <div className="my-auto">
                      {alloc ? (
                        <>
                          <div className="font-bold text-[11px] text-slate-900 leading-tight">
                            {alloc.roll_number}
                          </div>
                          <div className="text-[9px] text-slate-500 truncate max-w-full">
                            {alloc.full_name}
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium">Empty</div>
                      )}
                    </div>

                    <div className="text-[9px] text-slate-400 font-medium">
                      Row {seat.row_label}-{seat.column_index}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              No physical seats mapped for this venue. Click "Run Auto Allocation" above to initialize seating.
            </div>
          )}

          {/* Legend */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-100 border border-blue-300"></span>
              <span>Allocated Desk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200"></span>
              <span>Available Desk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-300 border border-amber-500"></span>
              <span>Search Highlight</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
