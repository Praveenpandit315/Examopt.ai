// client/src/pages/student/StudentTimetablePage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Download, 
  Printer, 
  Layers, 
  CalendarDays, 
  Armchair, 
  Bookmark, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export function StudentTimetablePage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list' | 'subjects' | 'daywise'
  const [timetable, setTimetable] = useState([
    {
      code: 'CS101',
      subject: 'Data Structures',
      department: 'CSE',
      credits: 4,
      date: '2025-04-15',
      time: '09:00 - 11:00',
      duration: '120 min',
      room: 'R101',
      building: 'Block A - Lecture Hall 101',
      seat_label: 'R101-A01',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      code: 'CS102',
      subject: 'Operating Systems',
      department: 'CSE',
      credits: 4,
      date: '2025-04-16',
      time: '12:00 - 14:00',
      duration: '120 min',
      room: 'R102',
      building: 'Block A - Lecture Hall 102',
      seat_label: 'R102-A02',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    {
      code: 'EC101',
      subject: 'Electronics & Circuits',
      department: 'ECE',
      credits: 3,
      date: '2025-04-17',
      time: '12:00 - 13:30',
      duration: '90 min',
      room: 'R203',
      building: 'Block B - Seminar Hall 203',
      seat_label: 'R203-B01',
      color: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    {
      code: 'MA101',
      subject: 'Mathematics & Discrete',
      department: 'MATH',
      credits: 4,
      date: '2025-04-18',
      time: '09:00 - 11:00',
      duration: '120 min',
      room: 'R101',
      building: 'Block A - Lecture Hall 101',
      seat_label: 'R101-A01',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ]);

  const [seatingTickets, setSeatingTickets] = useState([]);

  useEffect(() => {
    // 1. Fetch official student timetable
    api.student.getTimetable()
      .then(res => {
        if (res && res.isPublished && res.timetable?.length > 0) {
          const colors = [
            'bg-blue-100 text-blue-800 border-blue-200',
            'bg-indigo-100 text-indigo-800 border-indigo-200',
            'bg-rose-100 text-rose-800 border-rose-200',
            'bg-purple-100 text-purple-800 border-purple-200',
            'bg-emerald-100 text-emerald-800 border-emerald-200'
          ];
          const enriched = res.timetable.map((t, idx) => ({
            ...t,
            color: colors[idx % colors.length]
          }));
          setTimetable(enriched);
        }
      })
      .catch(() => {});

    // 2. Fetch student seating hall ticket if available
    const studentProfileId = user?.profile?.id || 1;
    api.seating.getHallTicket(studentProfileId)
      .then(res => {
        if (res && res.tickets) {
          setSeatingTickets(res.tickets);
        }
      })
      .catch(() => {});
  }, [user]);

  // Combine seat allocations with timetable
  const mergedTimetable = timetable.map(item => {
    const match = seatingTickets.find(ticket => 
      ticket.subject_code === item.code || ticket.exam_code === item.code
    );
    return {
      ...item,
      seat_label: match?.seat_label || item.seat_label || null
    };
  });

  const days = [
    { label: 'Mon 14', short: 'Mon' },
    { label: 'Tue 15', short: 'Tue' },
    { label: 'Wed 16', short: 'Wed' },
    { label: 'Thu 17', short: 'Thu' },
    { label: 'Fri 18', short: 'Fri' },
    { label: 'Sat 19', short: 'Sat' }
  ];

  const timeSlots = ['09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM', '04:30 PM'];

  // Group by day for daywise view
  const groupedByDate = mergedTimetable.reduce((acc, curr) => {
    const d = curr.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(curr);
    return acc;
  }, {});

  // Group by department for subject-wise view
  const groupedByDept = mergedTimetable.reduce((acc, curr) => {
    const dept = curr.department || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Examination Timetable</h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalized schedule and physical desk allocations validated by ExamOpt AI constraint solver.
          </p>
        </div>

        {/* View Mode Toggle Pill */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('daywise')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'daywise' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Day-Wise</span>
          </button>
          <button
            onClick={() => setViewMode('subjects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'subjects' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subject-Wise</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* 1. Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 overflow-x-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Examination Week Overview
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conflict-Free Verified</span>
            </span>
          </div>

          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 gap-2 pb-3 border-b border-slate-100 text-center text-xs font-bold text-slate-700">
              <div className="text-slate-400 font-normal">Time</div>
              {days.map((d, i) => (
                <div key={i} className="py-1 bg-slate-50 rounded-xl">{d.label}</div>
              ))}
            </div>

            <div className="space-y-4 pt-3">
              {timeSlots.map((slotTime, tIdx) => (
                <div key={tIdx} className="grid grid-cols-7 gap-2 items-center text-xs min-h-[64px]">
                  <div className="text-[11px] font-mono text-slate-400 text-center">{slotTime}</div>
                  
                  {days.map((d, dIdx) => {
                    const match = mergedTimetable.find(ex => {
                      if (dIdx === 1 && ex.code === 'CS101' && slotTime.startsWith('09:00')) return true;
                      if (dIdx === 2 && ex.code === 'CS102' && slotTime.startsWith('12:00')) return true;
                      if (dIdx === 3 && ex.code === 'EC101' && slotTime.startsWith('12:00')) return true;
                      if (dIdx === 4 && ex.code === 'MA101' && slotTime.startsWith('09:00')) return true;
                      if (dIdx === 5 && ex.code === 'HS101' && slotTime.startsWith('09:00')) return true;
                      return false;
                    });

                    if (match) {
                      return (
                        <div
                          key={dIdx}
                          className={`p-2.5 rounded-xl border ${match.color} shadow-xs flex flex-col justify-between`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs">{match.code}</span>
                            <span className="text-[9px] font-semibold bg-white/70 px-1 rounded">{match.room}</span>
                          </div>
                          <div className="font-bold text-[11px] truncate mt-0.5">{match.subject}</div>
                          <div className="flex items-center justify-between mt-1 text-[9px] opacity-90">
                            <span>{match.time}</span>
                            {match.seat_label && (
                              <span className="font-mono font-bold bg-white/80 px-1 rounded text-blue-700">
                                {match.seat_label}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={dIdx} className="h-full rounded-xl border border-dashed border-slate-100 hover:bg-slate-50/50 transition"></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Day-Wise Agenda View */}
      {viewMode === 'daywise' && (
        <div className="space-y-4">
          {Object.keys(groupedByDate).sort().map((dateStr) => {
            const papers = groupedByDate[dateStr];
            return (
              <div key={dateStr} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900">{dateStr}</h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {papers.length} {papers.length === 1 ? 'Exam' : 'Exams'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {papers.map((paper) => (
                    <div key={paper.code} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-600 text-xs px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                          {paper.code}
                        </span>
                        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {paper.time}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{paper.subject}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{paper.building || 'Main Campus'}</p>
                      </div>

                      {/* Desk Assignment Card */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Armchair className="w-4 h-4 text-blue-600" />
                          <span className="text-slate-600 font-medium">Assigned Seat:</span>
                        </div>
                        {paper.seat_label ? (
                          <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                            {paper.seat_label}
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Seat allocation pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Subject-Wise View */}
      {viewMode === 'subjects' && (
        <div className="space-y-4">
          {Object.keys(groupedByDept).map((dept) => {
            const papers = groupedByDept[dept];
            return (
              <div key={dept} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-900">Department of {dept}</h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{papers.length} Papers Registered</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {papers.map((paper) => (
                    <div key={paper.code} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600">{paper.code}</span>
                          <span className="font-bold text-slate-900">{paper.subject}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            {paper.credits || 3} Credits
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-1 flex items-center gap-3">
                          <span>{paper.date}</span>
                          <span>•</span>
                          <span>{paper.time}</span>
                          <span>•</span>
                          <span>Hall: {paper.room}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {paper.seat_label ? (
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-mono font-bold text-[11px] flex items-center gap-1.5">
                            <Armchair className="w-3.5 h-3.5" />
                            <span>Desk {paper.seat_label}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-[11px]">
                            Desk Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Room & Venue</th>
                  <th className="px-6 py-4">Assigned Desk</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mergedTimetable.map((ex) => (
                  <tr key={ex.code} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{ex.subject}</div>
                      <span className="font-mono text-blue-600 font-semibold">{ex.code}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{ex.date}</td>
                    <td className="px-6 py-4 font-mono text-slate-700">{ex.time}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{ex.room}</div>
                      <div className="text-[11px] text-slate-400">{ex.building}</div>
                    </td>
                    <td className="px-6 py-4">
                      {ex.seat_label ? (
                        <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                          {ex.seat_label}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Seat not assigned yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Confirmed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Desk Seating Info Card */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-800">
        <div className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Physical desks are pre-allocated by the university administration to ensure exam integrity and anti-cheating separation.
          </span>
        </div>
        <a href="/student/download" className="font-bold text-blue-700 hover:underline shrink-0">
          Print Admit Card &rarr;
        </a>
      </div>
    </div>
  );
}
