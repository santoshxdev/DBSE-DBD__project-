import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Pagination from '../components/Pagination';
import { Receipt, CheckCircle, AlertCircle, DollarSign, Filter, Check } from 'lucide-react';

const Fines = () => {
  const [fines, setFines] = useState([]);
  const [summary, setSummary] = useState({ totalPendingAmount: 0, totalPaidAmount: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFines();
  }, [page, status]);

  const fetchFines = async () => {
    try {
      setLoading(true);
      const res = await API.get('/fines', {
        params: { page, limit: 10, status }
      });
      if (res.data.success) {
        setFines(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch fines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (fineId) => {
    try {
      const res = await API.post(`/fines/${fineId}/pay`);
      if (res.data.success) {
        setMessage(res.data.message);
        fetchFines();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to settle fine payment.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
          <Receipt className="w-6 h-6 text-rose-400" />
          <span>Overdue Fine Financial Registry</span>
        </h1>
        <p className="text-xs text-slate-400">
          Track accrued borrowing penalties, manage pending payments, and record librarian collections
        </p>
      </div>

      {/* Notification */}
      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pending Fines</div>
            <div className="text-2xl font-black text-rose-400 mt-1">₹{summary.totalPendingAmount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected Fines</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">₹{summary.totalPaidAmount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fine Records</div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-rose-500"
        >
          <option value="">All Statuses (Pending & Settled)</option>
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
        </select>
      </div>

      {/* Fines Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase tracking-wider text-[10px] font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fine ID</th>
                <th className="py-3.5 px-4">Student Member</th>
                <th className="py-3.5 px-4">Book Title</th>
                <th className="py-3.5 px-4">Overdue Penalty Reason</th>
                <th className="py-3.5 px-4 font-mono">Amount (₹)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Loading fines database...
                  </td>
                </tr>
              ) : fines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No fines recorded matching criteria.
                  </td>
                </tr>
              ) : (
                fines.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-rose-400">{f.fineId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{f.memberId?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{f.memberId?.studentId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {f.transactionId?.bookId?.title || 'Unknown Book'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{f.reason}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-rose-400 text-sm">₹{f.amount}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          f.status === 'PENDING'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {f.status === 'PENDING' ? (
                        <button
                          onClick={() => handlePayFine(f._id)}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1 ml-auto"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono italic">
                          Paid on {f.paidAt ? new Date(f.paidAt).toLocaleDateString() : 'N/A'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default Fines;
