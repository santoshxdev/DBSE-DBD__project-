import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Pagination from '../components/Pagination';
import RFIDBadge from '../components/RFIDBadge';
import { History, Search, Filter, CheckCircle, AlertTriangle, Clock, Calendar } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [page, status, search]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/transactions', {
        params: { page, limit: 10, status, search }
      });
      if (res.data.success) {
        setTransactions(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
          <History className="w-6 h-6 text-brand-400" />
          <span>Circulation Transactions Log</span>
        </h1>
        <p className="text-xs text-slate-400">
          Complete audit history of book issues, returns, due dates, and financial fine penalties
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Transaction ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Statuses (Active, Returned, Overdue)</option>
          <option value="ISSUED">Active Issued</option>
          <option value="RETURNED">Returned</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase tracking-wider text-[10px] font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Txn ID</th>
                <th className="py-3.5 px-4">Student Member</th>
                <th className="py-3.5 px-4">Book Title</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Return Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    Loading circulation transaction history...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No transactions match criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-brand-400">{tx.transactionId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{tx.memberId?.name || 'Deleted Member'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tx.memberId?.studentId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{tx.bookId?.title || 'Deleted Book'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ISBN: {tx.bookId?.ISBN}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(tx.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-300">
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
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
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {tx.fineAmount > 0 ? (
                        <span className="text-rose-400">₹{tx.fineAmount}</span>
                      ) : (
                        <span className="text-slate-500">₹0</span>
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

export default Transactions;
