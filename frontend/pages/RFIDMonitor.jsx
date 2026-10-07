import React, { useState, useEffect } from 'react';
import API from '../services/api';
import RFIDBadge from '../components/RFIDBadge';
import Pagination from '../components/Pagination';
import { Activity, RefreshCw, Cpu, Filter, Radio, Search } from 'lucide-react';

const RFIDMonitor = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [eventType, setEventType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [page, eventType, search]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/rfid/events', {
        params: { page, limit: 12, eventType, search }
      });
      if (res.data.success) {
        setEvents(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch RFID events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <Activity className="w-6 h-6 text-purple-400" />
            <span>RFID Hardware Event Monitor</span>
          </h1>
          <p className="text-xs text-slate-400">Live telemetry logs from ESP32 readers and RFID card/tag sensors</p>
        </div>

        <button
          onClick={fetchEvents}
          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-purple-400" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by RFID UID or Device ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
        >
          <option value="">All Event Types</option>
          <option value="MEMBER_SCAN">MEMBER_SCAN</option>
          <option value="BOOK_SCAN">BOOK_SCAN</option>
          <option value="ISSUE">ISSUE</option>
          <option value="RETURN">RETURN</option>
          <option value="UNKNOWN_TAG">UNKNOWN_TAG</option>
        </select>
      </div>

      {/* Event Logs Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase tracking-wider text-[10px] font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Event ID</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">RFID UID Chip</th>
                <th className="py-3.5 px-4">Resolved Entity</th>
                <th className="py-3.5 px-4 text-right">Device ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Fetching hardware telemetry stream...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    No RFID scan events logged matching filter.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-purple-400">{evt.eventId}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          evt.eventType === 'ISSUE' || evt.eventType === 'RETURN'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : evt.eventType === 'MEMBER_SCAN'
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            : evt.eventType === 'BOOK_SCAN'
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <RFIDBadge uid={evt.UID} />
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      {evt.relatedBook ? (
                        <div className="font-semibold text-slate-200">{evt.relatedBook.title}</div>
                      ) : evt.relatedMember ? (
                        <div className="font-semibold text-slate-200">{evt.relatedMember.name} ({evt.relatedMember.studentId})</div>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Unbound Tag</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-semibold">{evt.deviceId}</td>
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

export default RFIDMonitor;
