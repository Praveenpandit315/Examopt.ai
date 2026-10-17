// client/src/pages/student/StudentDashboardPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Bell, Download, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const studentName = user?.full_name || 'Rahul Kumar';
  const profile = user?.profile || {
    program: 'B.Tech - Computer Science',
    semester: 3,
    section: 'A',
    roll_number: 'CS-2024-042'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Welcome Card Matching Mockup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Welcome back, {studentName}!</p>
        </div>

        {/* Student Profile Pill Matching Mockup */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            {studentName.charAt(0)}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900">{studentName}</div>
            <div className="text-[11px] text-slate-500">{profile.program}</div>
            <div className="text-[10px] text-blue-600 font-semibold">Semester {profile.semester} • Section {profile.section} (Roll: {profile.roll_number})</div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards Matching Mockup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Enrolled Exams */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled Exams</span>
          <div className="my-2">
            <span className="text-4xl font-extrabold text-slate-900">5</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All papers scheduled without conflicts</span>
          </div>
        </div>

        {/* Next Examination Card Matching Mockup */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md shadow-blue-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Next Examination</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">In 3 Days</span>
          </div>

          <div className="my-2">
            <h3 className="text-base font-bold">CS101 — Data Structures</h3>
            <div className="flex items-center gap-2 text-xs text-blue-100 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>15 Apr 2025 • 09:00 AM - 11:00 AM</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-100 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Room R101 (Block A - Lecture Hall)</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/student/timetable')}
            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <span>View Full Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Upcoming Exams Summary Matching Mockup */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Exams</span>
            <button onClick={() => navigate('/student/timetable')} className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </button>
          </div>

          <div className="my-2 space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <span className="font-semibold text-slate-800">CS102 — Operating Systems</span>
              <span className="text-slate-500 font-mono text-[11px]">16 Apr (12:00 PM)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <span className="font-semibold text-slate-800">EC101 — Electronics</span>
              <span className="text-slate-500 font-mono text-[11px]">17 Apr (12:00 PM)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <span className="font-semibold text-slate-800">MA101 — Mathematics</span>
              <span className="text-slate-500 font-mono text-[11px]">18 Apr (09:00 AM)</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400">
            Source: Controller of Examinations approved schedule.
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Actions & Recent Updates Matching Mockup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/student/timetable')}
              className="w-full p-3 bg-blue-50/60 hover:bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-left transition flex items-center justify-between text-xs font-semibold"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span>View My Timetable (Calendar & List)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>

            <button
              onClick={() => navigate('/student/download')}
              className="w-full p-3 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100 text-left transition flex items-center justify-between text-xs font-semibold"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Download Official Examination Timetable (PDF / CSV)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>

            <button
              onClick={() => navigate('/student/notifications')}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 text-left transition flex items-center justify-between text-xs font-semibold"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-600" />
                <span>Check Official Examination Notifications</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Recent Updates Card Matching Mockup */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Recent Updates</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <div className="flex-1">
                <div className="font-bold text-slate-800">Timetable published for Semester 3</div>
                <p className="text-[11px] text-slate-500">Official schedule approved by Examination Office.</p>
              </div>
              <span className="text-[10px] text-slate-400">2 hours ago</span>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <div className="flex-1">
                <div className="font-bold text-slate-800">Seating Allocated for CS101</div>
                <p className="text-[11px] text-slate-500">Assigned to Room R101 (Block A).</p>
              </div>
              <span className="text-[10px] text-slate-400">5 hours ago</span>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
              <div className="flex-1">
                <div className="font-bold text-slate-800">Exam Window Notice</div>
                <p className="text-[11px] text-slate-500">Please carry your student ID card to all exam venues.</p>
              </div>
              <span className="text-[10px] text-slate-400">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
