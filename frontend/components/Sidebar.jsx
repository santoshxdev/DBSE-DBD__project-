import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Repeat,
  Cpu,
  BookOpen,
  Users,
  History,
  Activity,
  Receipt,
  Settings,
  BookMarked
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Issue / Return Kiosk', path: '/kiosk', icon: Repeat, badge: 'RFID' },
    { label: 'RFID Simulator', path: '/rfid-simulator', icon: Cpu, highlight: true },
    { label: 'Books Catalog', path: '/books', icon: BookOpen },
    { label: 'Student Members', path: '/members', icon: Users },
    { label: 'Transactions', path: '/transactions', icon: History },
    { label: 'RFID Monitor', path: '/rfid-monitor', icon: Activity },
    { label: 'Overdue Fines', path: '/fines', icon: Receipt },
    { label: 'System Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* App Title Header */}
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white">RFID Library</h1>
            <p className="text-[10px] text-slate-400 font-mono">DBSE B.Tech System</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30 shadow-sm'
                      : item.highlight
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
        <div className="flex justify-between">
          <span>Backend REST API</span>
          <span className="font-mono text-emerald-400 font-semibold">v1.0</span>
        </div>
        <div className="flex justify-between">
          <span>Database</span>
          <span className="font-mono text-blue-400">MongoDB</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
