// client/src/layouts/StudentLayout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileText, 
  Bell, 
  Download, 
  User, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Timetable', path: '/student/timetable', icon: CalendarDays },
    { name: 'Exam Details', path: '/student/details', icon: FileText },
    { name: 'Notifications', path: '/student/notifications', icon: Bell },
    { name: 'Download Timetable', path: '/student/download', icon: Download },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Dark Navy Sidebar */}
      <aside className="w-64 bg-[#0A1224] text-slate-300 flex flex-col fixed inset-y-0 z-30">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <GraduationCap className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight">ExamOpt AI</h1>
            <p className="text-[10px] text-indigo-400 font-medium tracking-wide uppercase">Student Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pl-64 min-h-screen">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm/50">
          <div>
            <div className="text-xs text-slate-400 font-medium">Student Academic Examination Portal</div>
            <div className="text-sm font-bold text-slate-800">{user?.profile?.program || 'B.Tech Program'}</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                {user?.full_name?.charAt(0) || 'S'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{user?.full_name}</div>
                <div className="text-[10px] text-slate-400 font-medium">Roll: {user?.profile?.roll_number || 'N/A'} • Sec {user?.profile?.section || 'A'}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
