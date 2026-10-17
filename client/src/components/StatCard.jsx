// client/src/components/StatCard.jsx
import React from 'react';

export function StatCard({ title, value, changeText, changeColor = 'text-emerald-600', icon: Icon, iconBg = 'bg-blue-50 text-blue-600' }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900">{value}</span>
      </div>
      {changeText && (
        <div className={`mt-2 text-xs font-medium ${changeColor}`}>
          {changeText}
        </div>
      )}
    </div>
  );
}
