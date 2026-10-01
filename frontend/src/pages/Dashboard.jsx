import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import StatCard from '../components/StatCard';
import RFIDBadge from '../components/RFIDBadge';
import {
  BookOpen,
  CheckCircle2,
  BookmarkCheck,
  Users,
  AlertTriangle,
  Cpu,
  Repeat,
  PlusCircle,
  Activity,
  History,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [rfidEvents, setRfidEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, txnsRes, rfidRes] = await Promise.all([
        API.get('/dashboard/stats'),
        API.get('/dashboard/recent-transactions'),
        API.get('/dashboard/rfid-activity')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (txnsRes.data.success) setRecentTxns(txnsRes.data.data);
      if (rfidRes.data.success) setRfidEvents(rfidRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-brand-400 font-semibold animate-pulse">
          <Cpu className="w-6 h-6 animate-spin" />
          <span>Loading RFID Library Telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl font-black tracking-tight text-white">Library Management & RFID Dashboard</h1>
          <p className="text-xs text-slate-400">
            Database Systems Engineering • Real-Time Hardware Event Stream & Circulation Aggregates
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <Link
            to="/kiosk"
            className="py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2"
          >
            <Repeat className="w-4 h-4" />
            <span>Launch Issue/Return Kiosk</span>
          </Link>
          <Link
            to="/rfid-simulator"
            className="py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex items-center space-x-2"
          >
            <Cpu className="w-4 h-4" />
            <span>Hardware Simulator</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Books Catalog"
          value={stats?.totalBooks || 0}
          subtitle={`${stats?.totalCopies || 0} Total Volume Copies`}
          icon={BookOpen}
          color="brand"
        />
        <StatCard
          title="Available Copies"
          value={stats?.availableCopies || 0}
          subtitle="Ready on Library Shelves"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Active Borrowed"
          value={stats?.borrowedCopies || 0}
          subtitle={`${stats?.overdueTransactions || 0} Overdue Returns`}
          icon={BookmarkCheck}
          color="amber"
        />
        <StatCard
          title="Today's RFID Scans"
          value={stats?.rfidScansToday || 0}
          subtitle="Live Hardware Telemetry"
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Main Content Grid: Transactions & RFID Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-brand-400" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">Recent Circulation Activity</h2>
            </div>
            <Link to="/transactions" className="text-xs font-semibold text-brand-400 hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase tracking-wider text-[10px] font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Student Member</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentTxns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                        No circulation transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentTxns.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-brand-400">{tx.transactionId}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{tx.memberId?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{tx.memberId?.studentId}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200 max-w-[200px] truncate">
                          {tx.bookId?.title || 'Unknown Book'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {new Date(tx.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              tx.status === 'ISSUED'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : tx.status === 'RETURNED'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: RFID Live Event Feed & Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Live RFID Activity Stream */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">Live RFID Event Feed</h2>
              </div>
              <Link to="/rfid-monitor" className="text-xs font-semibold text-purple-400 hover:underline">
                Monitor
              </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl max-h-[380px] overflow-y-auto">
              {rfidEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  No RFID hardware scans logged today.
                </div>
              ) : (
                rfidEvents.map((evt) => (
                  <div
                    key={evt._id}
                    className="p-3 rounded-xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            evt.eventType === 'ISSUE' || evt.eventType === 'RETURN'
                              ? 'bg-emerald-400 animate-ping'
                              : evt.eventType === 'MEMBER_SCAN'
                              ? 'bg-blue-400'
                              : evt.eventType === 'BOOK_SCAN'
                              ? 'bg-indigo-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                          {evt.eventType}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <RFIDBadge uid={evt.UID} />
                      <span className="text-[10px] text-slate-400 font-mono">{evt.deviceId}</span>
                    </div>

                    {(evt.relatedBook || evt.relatedMember) && (
                      <div className="text-[11px] text-slate-300 font-medium pt-1 border-t border-slate-800">
                        {evt.relatedBook ? `Book: ${evt.relatedBook.title}` : `Member: ${evt.relatedMember.name}`}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
