import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Cpu, ShieldCheck, Clock } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shadow-sm">
      {/* Left: Branding & Subtitle */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-400">RFID Gateway Online</span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 border-l border-slate-800 pl-4">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Right: User profile & Logout */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-sm">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-semibold text-slate-200">{user?.name || 'User'}</div>
            <div className="text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-brand-400" />
              <span>{user?.role || 'Staff'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out of system"
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700/60 hover:border-rose-500/30 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
