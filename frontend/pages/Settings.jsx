import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, CheckCircle, ShieldAlert, Cpu, DollarSign, Calendar, BookOpen } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    DAILY_FINE: 5,
    BORROWING_DAYS: 14,
    MAX_BOOKS_PER_MEMBER: 3,
    RFID_DEVICE_ID: 'RFID_DEVICE_01'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/settings');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const res = await API.put('/settings', settings);
      if (res.data.success) {
        setMessage('System circulation settings updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400 font-semibold italic text-xs">
        Loading system configuration settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-brand-400" />
          <span>System & RFID Reader Settings</span>
        </h1>
        <p className="text-xs text-slate-400">
          Configure runtime rules for borrowing durations, daily fine penalties, student member limits, and RFID reader parameters
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Daily Fine */}
          <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
              <DollarSign className="w-4 h-4 text-rose-400" />
              <span>Daily Overdue Fine (₹)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Financial penalty rate charged per day for books returned after due date.
            </p>
            <input
              type="number"
              min="0"
              required
              disabled={!isAdmin}
              value={settings.DAILY_FINE}
              onChange={(e) => setSettings({ ...settings, DAILY_FINE: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
            />
          </div>

          {/* Borrowing Days */}
          <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span>Borrowing Allowance (Days)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Standard number of days a student is permitted to keep a borrowed book.
            </p>
            <input
              type="number"
              min="1"
              required
              disabled={!isAdmin}
              value={settings.BORROWING_DAYS}
              onChange={(e) => setSettings({ ...settings, BORROWING_DAYS: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
            />
          </div>

          {/* Max Books Limit */}
          <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Max Books per Student</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Maximum concurrent unreturned books allowed per student member.
            </p>
            <input
              type="number"
              min="1"
              required
              disabled={!isAdmin}
              value={settings.MAX_BOOKS_PER_MEMBER}
              onChange={(e) => setSettings({ ...settings, MAX_BOOKS_PER_MEMBER: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
            />
          </div>

          {/* RFID Device Identifier */}
          <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Primary RFID Scanner Device ID</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Hardware serial / device name registered in ESP32 microcontroller firmware.
            </p>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={settings.RFID_DEVICE_ID}
              onChange={(e) => setSettings({ ...settings, RFID_DEVICE_ID: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
            />
          </div>
        </div>

        {isAdmin ? (
          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving System Rules...' : 'Save Configuration Changes'}</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-amber-400 font-medium italic text-center border-t border-slate-800 pt-3">
            Note: System settings can only be modified by Administrator accounts.
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
