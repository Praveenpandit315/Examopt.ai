// client/src/pages/student/StudentNotificationsPage.jsx
import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, Info, AlertTriangle, ArrowRight } from 'lucide-react';

export function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Official Timetable Published for Semester 3',
      message: 'The final conflict-free examination schedule has been approved and published by the Controller of Examinations.',
      time: '2 hours ago',
      type: 'publish',
      read: false
    },
    {
      id: 2,
      title: 'Room Allocation Confirmed for CS101',
      message: 'Your seating venue for Data Structures is Room R101 (Block A - Lecture Hall 101).',
      time: '5 hours ago',
      type: 'info',
      read: true
    },
    {
      id: 3,
      title: 'Institutional Rules & ID Notice',
      message: 'All examinees are strictly required to report 15 minutes prior to slot start time with institutional identity cards.',
      time: '1 day ago',
      type: 'warning',
      read: true
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examination Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">Official alerts regarding timetable publications and room adjustments.</p>
        </div>

        <button
          onClick={markAllAsRead}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl transition"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 divide-y divide-slate-100">
        {notifications.map((notif) => (
          <div key={notif.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              notif.type === 'publish' ? 'bg-emerald-100 text-emerald-700' :
              notif.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Bell className="w-4 h-4" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{notif.title}</h3>
                <span className="text-[11px] text-slate-400">{notif.time}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
