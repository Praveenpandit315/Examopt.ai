// client/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, EyeOff, ShieldCheck, Zap, BarChart3, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Toast } from '../components/Toast';

export function LoginPage() {
  const [role, setRole] = useState('admin'); // 'admin' | 'student'
  const [email, setEmail] = useState('admin@university.edu');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [demoAccounts, setDemoAccounts] = useState([]);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.auth.getDemoAccounts()
      .then(res => setDemoAccounts(res.accounts || []))
      .catch(() => {});
  }, []);

  const handleRoleToggle = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'admin') {
      setEmail('admin@university.edu');
      setPassword('Admin@123');
    } else {
      setEmail('rahul.kumar@student.university.edu');
      setPassword('Student@123');
    }
  };

  const handleQuickSelect = (acc) => {
    setRole(acc.role);
    setEmail(acc.email);
    setPassword(acc.defaultPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast({ message: '', type: 'info' });

    try {
      const user = await login(email, password, role);
      setToast({ message: `Welcome back, ${user.full_name}!`, type: 'success' });
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }, 500);
    } catch (err) {
      setToast({ message: err.message || 'Login failed. Please check your credentials.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Toast Notification */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      {/* Left Hero Panel (Matches Mockup) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#091122] flex-col justify-between p-12 text-white overflow-hidden">
        {/* Subtle geometric & campus architectural pattern background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
              <Calendar className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">ExamOpt AI</span>
              <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">Commit2Win</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-blue-200/80 font-medium">Generate. Optimize. Explain. Reschedule.</p>
        </div>

        {/* University Visual Card */}
        <div className="relative z-10 my-auto py-8">
          <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
            <div className="h-44 rounded-xl bg-gradient-to-tr from-blue-950 via-slate-900 to-indigo-950 flex flex-col justify-end p-5 relative overflow-hidden border border-slate-700/50">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
              <div className="relative z-10">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-900/60 px-2 py-1 rounded">GLA HackVision 2.0</span>
                <h2 className="text-xl font-bold mt-2 text-white">Automated Conflict-Free Examination Timetabling</h2>
                <p className="text-xs text-slate-300 mt-1">Heuristic constraint backtracking with transparent explanations and emergency rescue rescheduling.</p>
              </div>
            </div>

            {/* Feature Pills Matching Mockup */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-[11px]">Smart Scheduling</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-[11px]">Conflict Detection</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="font-medium text-[11px]">Better Utilization</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-400">
          © 2025 ExamOpt AI. GLA HackVision 2.0. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Panel (Matches Mockup) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100">
          {/* Header */}
          <div className="text-left">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          {/* Role Pill Switcher (Admin vs Student) */}
          <div className="mt-6 p-1 bg-slate-100 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => handleRoleToggle('admin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                role === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => handleRoleToggle('student')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                role === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Login
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'admin' ? 'admin@university.edu' : 'student@university.edu'}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('For demo, use default password: Admin@123 or Student@123'); }} className="font-semibold text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Helper for Hackathon Evaluators */}
          {demoAccounts.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>1-Click Evaluator Demo Accounts</span>
              </div>
              <div className="space-y-1.5">
                {demoAccounts.slice(0, 3).map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickSelect(acc)}
                    className="w-full text-left px-3 py-1.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 flex items-center justify-between transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{acc.name}</span>
                      <span className="ml-2 text-[10px] text-slate-400">({acc.role})</span>
                    </div>
                    <span className="text-[10px] font-mono text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">Select</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
