import React, { useState } from 'react';
import API from '../services/api';
import RFIDBadge from '../components/RFIDBadge';
import {
  Cpu,
  Radio,
  Zap,
  Repeat,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Terminal,
  ArrowRight,
  Layers
} from 'lucide-react';

const RFIDSimulator = () => {
  const [studentUid, setStudentUid] = useState('CARD_E4A28B10');
  const [bookUid, setBookUid] = useState('TAG_B8F3D122');
  const [deviceId, setDeviceId] = useState('ESP32_RFID_READER_01');

  const [lastScanResult, setLastScanResult] = useState(null);
  const [lastTxnResult, setLastTxnResult] = useState(null);
  const [rawPayload, setRawPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  const presets = [
    { label: 'Student: Aarav Gupta', studentUid: 'CARD_E4A28B10', bookUid: 'TAG_B8F3D122' },
    { label: 'Student: Ananya Roy', studentUid: 'CARD_93F1C822', bookUid: 'TAG_11A22B33' },
    { label: 'Book: DB System Concepts', studentUid: 'CARD_E4A28B10', bookUid: 'TAG_B8F3D122' },
    { label: 'Book: Clean Code', studentUid: 'CARD_93F1C822', bookUid: 'TAG_11A22B33' },
    { label: 'Unknown Hardware Tag', studentUid: 'UNKNOWN_TAG_9988', bookUid: 'UNKNOWN_BOOK_77' }
  ];

  const handleScanStudent = async () => {
    if (!studentUid) return;
    setLoading(true);
    setLastTxnResult(null);
    try {
      const res = await API.post('/rfid/scan', {
        uid: studentUid.trim(),
        deviceId
      });
      setLastScanResult(res.data.scanResult);
      setRawPayload(res.data);
    } catch (err) {
      setLastScanResult({
        error: err.response?.data?.error || 'Scan failed'
      });
      setRawPayload(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleScanBook = async () => {
    if (!bookUid) return;
    setLoading(true);
    setLastTxnResult(null);
    try {
      const res = await API.post('/rfid/scan', {
        uid: bookUid.trim(),
        deviceId
      });
      setLastScanResult(res.data.scanResult);
      setRawPayload(res.data);
    } catch (err) {
      setLastScanResult({
        error: err.response?.data?.error || 'Scan failed'
      });
      setRawPayload(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleIssueBook = async () => {
    if (!studentUid || !bookUid) return;
    setLoading(true);
    setLastScanResult(null);
    try {
      const res = await API.post('/transactions/issue', {
        memberIdentifier: studentUid.trim(),
        bookIdentifier: bookUid.trim(),
        deviceId
      });
      setLastTxnResult({
        type: 'ISSUE',
        success: true,
        data: res.data
      });
      setRawPayload(res.data);
    } catch (err) {
      setLastTxnResult({
        type: 'ISSUE',
        success: false,
        error: err.response?.data?.error || 'Issue transaction failed'
      });
      setRawPayload(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async () => {
    if (!bookUid) return;
    setLoading(true);
    setLastScanResult(null);
    try {
      const res = await API.post('/transactions/return', {
        bookIdentifier: bookUid.trim(),
        deviceId
      });
      setLastTxnResult({
        type: 'RETURN',
        success: true,
        data: res.data
      });
      setRawPayload(res.data);
    } catch (err) {
      setLastTxnResult({
        type: 'RETURN',
        success: false,
        error: err.response?.data?.error || 'Return transaction failed'
      });
      setRawPayload(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const generateUnknownTag = () => {
    const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    setBookUid(`TAG_UNK_${randomHex}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-amber-400" />
            <span>ESP32 & RC522 RFID Hardware Simulator</span>
          </h1>
          <p className="text-xs text-slate-400">
            Simulate physical microcontrollers transmitting RFID UID scan events to backend REST APIs
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300 font-mono text-xs">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Device: {deviceId}</span>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>Quick Hardware Preset Configurations</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setStudentUid(p.studentUid);
                setBookUid(p.bookUid);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all font-mono"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Inputs & Action Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Inputs */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Hardware Simulation Inputs</span>
            <button
              onClick={generateUnknownTag}
              className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center space-x-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Generate Unknown RFID Tag</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Student RFID Card UID (HEX)</label>
              <input
                type="text"
                value={studentUid}
                onChange={(e) => setStudentUid(e.target.value)}
                placeholder="CARD_E4A28B10"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Book RFID Tag UID (HEX)</label>
              <input
                type="text"
                value={bookUid}
                onChange={(e) => setBookUid(e.target.value)}
                placeholder="TAG_B8F3D122"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target RFID Reader Device ID</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handleScanStudent}
              disabled={loading}
              className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all disabled:opacity-50"
            >
              Scan Student
            </button>

            <button
              onClick={handleScanBook}
              disabled={loading}
              className="py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition-all disabled:opacity-50"
            >
              Scan Book
            </button>

            <button
              onClick={handleIssueBook}
              disabled={loading}
              className="py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all disabled:opacity-50 shadow-md shadow-brand-600/30"
            >
              Issue Book
            </button>

            <button
              onClick={handleReturnBook}
              disabled={loading}
              className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all disabled:opacity-50 shadow-md shadow-teal-600/30"
            >
              Return Book
            </button>
          </div>
        </div>

        {/* Live Scan & Telemetry Output */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Telemetry & Result Stream</span>
              <span className="text-[10px] text-slate-500 font-mono">POST /api/rfid/scan</span>
            </div>

            {/* Scan Output Card */}
            {lastScanResult ? (
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2 text-xs font-mono animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scan UID: <span className="text-amber-300 font-bold">{lastScanResult.uid}</span></span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    lastScanResult.type === 'MEMBER' ? 'bg-emerald-500/20 text-emerald-300' : lastScanResult.type === 'BOOK' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {lastScanResult.type}
                  </span>
                </div>

                {lastScanResult.entity ? (
                  <div className="p-2.5 bg-slate-900 rounded-xl space-y-1 text-slate-200">
                    <div className="font-bold text-slate-100">{lastScanResult.entity.name || lastScanResult.entity.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {lastScanResult.entity.studentId ? `Student ID: ${lastScanResult.entity.studentId}` : `ISBN: ${lastScanResult.entity.ISBN}`}
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-400 italic">Unregistered / Unassigned Tag UID</div>
                )}
              </div>
            ) : lastTxnResult ? (
              <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 animate-fade-in ${
                lastTxnResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-sm">
                  {lastTxnResult.success ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                  <span>{lastTxnResult.type} Operation {lastTxnResult.success ? 'SUCCESSFUL' : 'FAILED'}</span>
                </div>
                {lastTxnResult.error && <div>Error: {lastTxnResult.error}</div>}
                {lastTxnResult.data && <div>Message: {lastTxnResult.data.message}</div>}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic">
                Trigger a hardware scan or transaction action to see live telemetry stream.
              </div>
            )}
          </div>

          {/* JSON Terminal Debug Window */}
          {rawPayload && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Raw REST API JSON Response</span>
              </div>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 max-h-36 overflow-y-auto">
                {JSON.stringify(rawPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RFIDSimulator;
