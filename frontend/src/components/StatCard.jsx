import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'brand' }) => {
  const colorStyles = {
    brand: 'from-brand-500/20 to-blue-600/10 text-brand-400 border-brand-500/30',
    emerald: 'from-emerald-500/20 to-teal-600/10 text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/20 to-orange-600/10 text-amber-400 border-amber-500/30',
    rose: 'from-rose-500/20 to-red-600/10 text-rose-400 border-rose-500/30',
    purple: 'from-purple-500/20 to-indigo-600/10 text-purple-400 border-purple-500/30'
  };

  return (
    <div className="relative p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all duration-300 shadow-lg group overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorStyles[color]} blur-2xl opacity-20 pointer-events-none`} />
      
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="text-2xl font-black tracking-tight text-white">{value}</div>
          {subtitle && <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>}
        </div>

        <div className={`w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center ${colorStyles[color].split(' ')[2]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
