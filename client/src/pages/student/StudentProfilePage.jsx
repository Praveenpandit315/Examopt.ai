// client/src/pages/student/StudentProfilePage.jsx
import React from 'react';
import { User, Mail, GraduationCap, Hash, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function StudentProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Academic Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Official verified university record and enrollment permissions.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm max-w-2xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/30">
            {user?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full mt-1 inline-block">
              Enrolled Student • Verified
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-slate-400 block font-semibold">University Roll Number</span>
            <span className="text-sm font-bold font-mono text-slate-800">{user?.profile?.roll_number || 'CS-2024-042'}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-slate-400 block font-semibold">Program</span>
            <span className="text-sm font-bold text-slate-800">{user?.profile?.program || 'B.Tech - Computer Science'}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-slate-400 block font-semibold">Current Semester</span>
            <span className="text-sm font-bold text-slate-800">Semester {user?.profile?.semester || 3}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-slate-400 block font-semibold">Allocated Section / Cohort</span>
            <span className="text-sm font-bold text-slate-800">Section {user?.profile?.section || 'A'}</span>
          </div>
        </div>

        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-[11px] leading-relaxed">
            Academic records and course enrollments are protected by university administrative access policies and cannot be modified directly by students.
          </p>
        </div>
      </div>
    </div>
  );
}
