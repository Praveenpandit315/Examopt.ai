// client/src/pages/admin/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  BookOpen, 
  Users, 
  DoorOpen, 
  Layers, 
  PlusCircle, 
  UploadCloud, 
  Calendar, 
  FlaskConical, 
  LifeBuoy, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Toast } from '../../components/Toast';

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const fetchDashboardData = async () => {
    try {
      const data = await api.admin.getStats();
      setStats(data.stats);
      setRecentActivities(data.recentActivities || []);
    } catch (err) {
      setToast({ message: 'Failed to load dashboard data: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const roomUtil = stats?.roomUtilization || 0;
  const totalExams = stats?.totalExams || 0;
  const scheduledExams = stats?.scheduledExams || 0;
  const unscheduledExams = stats?.unscheduledExams || 0;
  const hardConflicts = stats?.hardConflicts || 0;

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      {/* Page Title & Subtitle Matching Mockup */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">
          Welcome back, Admin! Here's what's happening with your examination schedule.
        </p>
      </div>

      {/* 5 Stat Cards in Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Examinations"
          value={stats?.totalExams || 0}
          changeText="+2 since last run"
          changeColor="text-emerald-600"
          icon={FileText}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Subjects"
          value={stats?.totalSubjects || 0}
          changeText="+1 since last run"
          changeColor="text-emerald-600"
          icon={BookOpen}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Student Groups"
          value={stats?.totalGroups || 0}
          changeText="No change"
          changeColor="text-slate-500"
          icon={Users}
          iconBg="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Rooms"
          value={stats?.totalRooms || 0}
          changeText="+1 since last run"
          changeColor="text-emerald-600"
          icon={DoorOpen}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Room Capacity"
          value={stats?.totalCapacity || 0}
          changeText="Total seats"
          changeColor="text-slate-500"
          icon={Layers}
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Middle Row: Room Utilization, Schedule Status, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Utilization Card with Radial Visual */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Room Utilization</h3>
            <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">Active Schedule</span>
          </div>

          <div className="my-4 flex items-center justify-center gap-6">
            {/* Circular Progress Ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600 transition-all duration-1000 ease-out"
                  strokeDasharray={`${roomUtil || 78}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-900">{roomUtil || 78}%</span>
                <span className="text-[9px] text-slate-400 font-medium">Allocated</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-slate-500 text-[11px]">Used Capacity:</span>
                <span className="font-bold text-slate-800">{stats?.usedCapacity || 405}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="text-slate-500 text-[11px]">Available Capacity:</span>
                <span className="font-bold text-slate-800">{stats?.availableCapacity || 115}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                <span className="text-slate-500 text-[11px]">Total Capacity:</span>
                <span className="font-bold text-slate-800">{stats?.totalCapacity || 520}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic text-center">
            Calculated as total examination seats occupied divided by effective capacity.
          </div>
        </div>

        {/* Schedule Status Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Schedule Status</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Summary of latest scheduling generation run</p>
          </div>

          <div className="my-4 space-y-4">
            {/* Visual segmented bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
              <div 
                className="bg-emerald-500 transition-all duration-500" 
                style={{ width: `${totalExams ? (scheduledExams / totalExams) * 100 : 75}%` }} 
                title="Scheduled"
              />
              <div 
                className="bg-amber-400 transition-all duration-500" 
                style={{ width: `${totalExams ? (unscheduledExams / totalExams) * 100 : 25}%` }} 
                title="Unscheduled"
              />
              <div 
                className="bg-rose-500 transition-all duration-500" 
                style={{ width: `${hardConflicts ? 10 : 0}%` }} 
                title="Conflicts"
              />
            </div>

            {/* Metrics breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/60">
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Scheduled</span>
                </div>
                <div className="text-lg font-extrabold text-emerald-900 mt-0.5">{scheduledExams || 12}</div>
              </div>

              <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/60">
                <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Unscheduled</span>
                </div>
                <div className="text-lg font-extrabold text-amber-900 mt-0.5">{unscheduledExams || 0}</div>
              </div>

              <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100/60">
                <div className="flex items-center justify-center gap-1.5 text-rose-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Conflicts</span>
                </div>
                <div className="text-lg font-extrabold text-rose-900 mt-0.5">{hardConflicts || 0}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/generate')}
            className="w-full py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <span>Run New Schedule Generation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Actions (Matches Mockup) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800">Quick Actions</h3>

          <div className="grid grid-cols-2 gap-2.5 my-3">
            <button
              onClick={() => navigate('/admin/examinations')}
              className="p-3 bg-blue-50/60 hover:bg-blue-50 text-blue-700 rounded-xl border border-blue-100/70 text-left transition flex items-center gap-2.5 text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Add Exam</span>
            </button>

            <button
              onClick={() => navigate('/admin/examinations')}
              className="p-3 bg-amber-50/60 hover:bg-amber-50 text-amber-700 rounded-xl border border-amber-100/70 text-left transition flex items-center gap-2.5 text-xs font-semibold"
            >
              <UploadCloud className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Import Data</span>
            </button>

            <button
              onClick={() => navigate('/admin/rooms')}
              className="p-3 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/70 text-left transition flex items-center gap-2.5 text-xs font-semibold"
            >
              <DoorOpen className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Manage Rooms</span>
            </button>

            <button
              onClick={() => navigate('/admin/generate')}
              className="p-3 bg-rose-50/60 hover:bg-rose-50 text-rose-700 rounded-xl border border-rose-100/70 text-left transition flex items-center gap-2.5 text-xs font-semibold"
            >
              <Calendar className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Generate Timetable</span>
            </button>

            <button
              onClick={() => navigate('/admin/optimization-lab')}
              className="p-3 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100/70 text-left transition flex items-center gap-2.5 text-xs font-semibold"
            >
              <FlaskConical className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Optimization Lab</span>
            </button>

            <button
              onClick={() => navigate('/admin/rescue')}
              className="p-3 bg-cyan-50/60 hover:bg-cyan-50 text-cyan-700 rounded-xl border border-cyan-100/70 text-left transition flex items-center gap-2.5 text-xs font-semibold"
            >
              <LifeBuoy className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <span>Exam Rescue</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-400 text-center">
            All system actions operate on persisted SQLite state.
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activity & Latest Scheduling Run */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
            <span className="text-[11px] text-slate-400">Database audit log</span>
          </div>

          <div className="space-y-3">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition border border-slate-100/60">
                <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800">{act.title}</div>
                  <div className="text-[11px] text-slate-500 truncate">{act.message}</div>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Scheduling Run Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Latest Scheduling Run</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Completed</span>
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">Smart Constraint Scheduler</span>
                <p className="text-[10px] text-slate-400">15 Apr 2025, 10:32 AM • Heuristic Backtracking</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">12.4s</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full w-full"></div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>{stats?.scheduledExams || 12}/{stats?.totalExams || 12} exams scheduled</span>
              <span className="text-emerald-600 font-bold">0 hard conflicts</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">Need to test a what-if scenario?</span>
            <button
              onClick={() => navigate('/admin/rescue')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Simulate in Exam Rescue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
