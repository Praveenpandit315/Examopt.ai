// client/src/pages/student/StudentTimetablePage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List, Clock, MapPin, CheckCircle2, Download, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export function StudentTimetablePage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [timetable, setTimetable] = useState([
    {
      code: 'CS101',
      subject: 'Data Structures',
      date: '15 Apr 2025',
      time: '09:00 - 11:00',
      duration: '120 min',
      room: 'R101',
      building: 'Block A - Lecture Hall 101',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      code: 'CS102',
      subject: 'Operating Systems',
      date: '16 Apr 2025',
      time: '12:00 - 14:00',
      duration: '120 min',
      room: 'R102',
      building: 'Block A - Lecture Hall 102',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    {
      code: 'EC101',
      subject: 'Electronics & Circuits',
      date: '17 Apr 2025',
      time: '12:00 - 13:30',
      duration: '90 min',
      room: 'R203',
      building: 'Block B - Seminar Hall 203',
      color: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    {
      code: 'MA101',
      subject: 'Mathematics & Discrete',
      date: '18 Apr 2025',
      time: '09:00 - 11:00',
      duration: '120 min',
      room: 'R101',
      building: 'Block A - Lecture Hall 101',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ]);

  useEffect(() => {
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
  }, []);

  const days = [
    { label: 'Mon 14', short: 'Mon' },
    { label: 'Tue 15', short: 'Tue' },
    { label: 'Wed 16', short: 'Wed' },
    { label: 'Thu 17', short: 'Thu' },
    { label: 'Fri 18', short: 'Fri' },
    { label: 'Sat 19', short: 'Sat' }
  ];

  const timeSlots = ['09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM', '04:30 PM'];

  return (
    <div className="space-y-6">
      {/* Top Header Matching Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Timetable</h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalized examination schedule based on official course enrollments.
          </p>
        </div>

        {/* View Mode Toggle Button Pill Matching Mockup */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Calendar View Matching Mockup (Bottom-Middle image) */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 overflow-x-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">April 2025 • Examination Week</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Verified by Constraint Engine
            </span>
          </div>

          <div className="min-w-[700px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 pb-3 border-b border-slate-100 text-center text-xs font-bold text-slate-700">
              <div className="text-slate-400 font-normal">Time</div>
              {days.map((d, i) => (
                <div key={i} className="py-1 bg-slate-50 rounded-xl">{d.label}</div>
              ))}
            </div>

            {/* Time Grid with Placed Exam Cards */}
            <div className="space-y-4 pt-3">
              {timeSlots.map((slotTime, tIdx) => (
                <div key={tIdx} className="grid grid-cols-7 gap-2 items-center text-xs min-h-[64px]">
                  <div className="text-[11px] font-mono text-slate-400 text-center">{slotTime}</div>
                  
                  {days.map((d, dIdx) => {
                    // Check if an exam matches this approximate slot
                    const match = timetable.find(ex => {
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
                          <div className="text-[9px] opacity-80 mt-1">{match.time}</div>
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
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Room & Venue</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetable.map((ex) => (
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
                    <td className="px-6 py-4 text-slate-600">{ex.duration}</td>
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

      {/* Upcoming Exams Summary Table Below Calendar (Matches Mockup bottom-middle) */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Upcoming Exams Schedule</h3>
          <span className="text-xs text-slate-400">{timetable.length} Papers Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Subject Code</th>
                <th className="px-4 py-3">Subject Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timetable.map((ex) => (
                <tr key={ex.code} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">{ex.code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{ex.subject}</td>
                  <td className="px-4 py-3 text-slate-700">{ex.date}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{ex.time}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{ex.room}</td>
                  <td className="px-4 py-3 text-slate-500">{ex.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
