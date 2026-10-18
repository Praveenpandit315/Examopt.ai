// client/src/layouts/AdminLayout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  DoorOpen, 
  CalendarClock, 
  Cpu, 
  AlertTriangle, 
  FlaskConical, 
  LifeBuoy, 
  Send, 
  Settings, 
  Bell, 
  LogOut,
  Calendar,
  UploadCloud,
  CalendarRange,
  Building2,
  Armchair,
  History,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AICopilotDrawer } from '../components/AICopilotDrawer';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'University Data Hub', path: '/admin/data-hub', icon: UploadCloud },
    { name: 'Academic Data Hub', path: '/admin/academic-data', icon: Building2 },
    { name: 'Session Builder', path: '/admin/session-builder', icon: CalendarRange },
    { name: 'Generate Timetable', path: '/admin/generate', icon: Cpu },
    { name: 'Seat Allocation', path: '/admin/seating', icon: Armchair },
    { name: 'Conflict Analysis', path: '/admin/conflicts', icon: AlertTriangle },
    { name: 'Optimization Lab', path: '/admin/optimization-lab', icon: FlaskConical },
    { name: 'Exam Rescue', path: '/admin/rescue', icon: LifeBuoy },
    { name: 'AI Copilot', path: '/admin/ai-copilot', icon: Sparkles },
    { name: 'Publish & Reports', path: '/admin/publish', icon: Send },
    { name: 'Schedule History', path: '/admin/history', icon: History },
    { name: 'Examinations', path: '/admin/examinations', icon: FileText },
    { name: 'Rooms & Venues', path: '/admin/rooms', icon: DoorOpen },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Dark Navy Sidebar */}
      <aside className="w-64 bg-[#0A1224] text-slate-300 flex flex-col fixed inset-y-0 z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Calendar className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight">ExamOpt AI</h1>
            <p className="text-[10px] text-blue-400 font-medium tracking-wide uppercase">Commit2Win</p>
          </div>
        </div>

        {/* Navigation Links */}
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

        {/* Sidebar Footer */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-64 min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm/50">
          <div>
            <div className="text-xs text-slate-400 font-medium">GLA HackVision 2.0 • Intelligent Examination Scheduler</div>
            <div className="text-sm font-bold text-slate-800">ExamOpt AI Control Panel</div>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <div className="relative">
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
              </button>
            </div>

            {/* Profile Chip */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                A
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{user?.full_name || 'Admin'}</div>
                <div className="text-[10px] text-slate-400 font-medium">University Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-8 bg-slate-50">
          <Outlet />
        </main>

        {/* Global AI Copilot Drawer */}
        <AICopilotDrawer />
      </div>
    </div>
  );
}
