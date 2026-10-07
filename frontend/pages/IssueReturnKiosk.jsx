import React, { useState } from 'react';
import API from '../services/api';
import RFIDBadge from '../components/RFIDBadge';
import {
  Repeat,
  Scan,
  UserCheck,
  BookCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Cpu,
  BookmarkCheck,
  DollarSign
} from 'lucide-react';

const IssueReturnKiosk = () => {
  // Input fields
  const [studentInput, setStudentInput] = useState('');
  const [bookInput, setBookInput] = useState('');

  // Scanned entities
  const [studentData, setStudentData] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [activeTxn, setActiveTxn] = useState(null);

  // Status & Telemetry
  const [scanningStudent, setScanningStudent] = useState(false);
  const [scanningBook, setScanningBook] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '', details: {} }

  // Quick Preset Autofill Helpers
  const autofillStudent = (uid, inputVal) => {
    setStudentInput(inputVal || uid);
    handleScanStudent(inputVal || uid);
  };

  const autofillBook = (uid, inputVal) => {
    setBookInput(inputVal || uid);
    handleScanBook(inputVal || uid);
  };

  // Scan Student via RFID API
  const handleScanStudent = async (inputVal = studentInput) => {
    if (!inputVal) return;
    setScanningStudent(true);
    setMessage(null);
    try {
      const res = await API.post('/rfid/scan', { uid: inputVal.trim() });
      if (res.data.success && res.data.scanResult.entity) {
        if (res.data.scanResult.type === 'MEMBER') {
          setStudentData(res.data.scanResult.entity);
        } else {
          setMessage({
            type: 'error',
            text: `RFID UID '${inputVal}' is mapped to a Book, not a Student Member Card!`
          });
        }
      } else {
        // Fallback search member by studentId or memberId
        const memberRes = await API.get('/members', { params: { search: inputVal } });
        if (memberRes.data.success && memberRes.data.data.length > 0) {
          setStudentData(memberRes.data.data[0]);
        } else {
          setMessage({
            type: 'error',
            text: `No Student Member found matching '${inputVal}'`
          });
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to scan student card'
      });
    } finally {
      setScanningStudent(false);
    }
  };

  // Scan Book via RFID API
  const handleScanBook = async (inputVal = bookInput) => {
    if (!inputVal) return;
    setScanningBook(true);
    setMessage(null);
    try {
      const res = await API.post('/rfid/scan', { uid: inputVal.trim() });
      if (res.data.success && res.data.scanResult.entity) {
        if (res.data.scanResult.type === 'BOOK') {
          setBookData(res.data.scanResult.entity);
          setActiveTxn(res.data.scanResult.activeTransaction || null);
        } else {
          setMessage({
            type: 'error',
            text: `RFID UID '${inputVal}' is mapped to a Student Card, not a Book!`
          });
        }
      } else {
        // Fallback search book by ISBN or bookId
        const bookRes = await API.get('/books', { params: { search: inputVal } });
        if (bookRes.data.success && bookRes.data.data.length > 0) {
          const b = bookRes.data.data[0];
          setBookData(b);
          // Check active transaction
          const txnRes = await API.get(`/books/${b._id}`);
          if (txnRes.data.success) {
            setActiveTxn(txnRes.data.activeTransaction || null);
          }
        } else {
          setMessage({
            type: 'error',
            text: `No Book found matching '${inputVal}'`
          });
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to scan book RFID tag'
      });
    } finally {
      setScanningBook(false);
    }
  };

  // Issue Book Action
  const handleIssueBook = async () => {
    if (!studentData || !bookData) {
      setMessage({ type: 'error', text: 'Please scan both a Student Member Card and a Book Tag first!' });
      return;
    }
    setProcessingAction(true);
    setMessage(null);
    try {
      const res = await API.post('/transactions/issue', {
        memberIdentifier: studentData._id,
        bookIdentifier: bookData._id
      });
      if (res.data.success) {
        setMessage({
          type: 'success',
          text: res.data.message,
          details: {
            transactionId: res.data.data.transactionId,
            dueDate: new Date(res.data.data.dueDate).toLocaleDateString(),
            action: 'ISSUE'
          }
        });
        // Reset or refresh scan
        handleScanBook(bookData.bookId);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Book Issue transaction failed.'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Return Book Action
  const handleReturnBook = async () => {
    if (!bookData) {
      setMessage({ type: 'error', text: 'Please scan the Book RFID tag to initiate return.' });
      return;
    }
    setProcessingAction(true);
    setMessage(null);
    try {
      const res = await API.post('/transactions/return', {
        bookIdentifier: bookData._id
      });
      if (res.data.success) {
        const { fineAmount, overdueDays } = res.data.data;
        setMessage({
          type: 'success',
          text: res.data.message,
          details: {
            fineAmount,
            overdueDays,
            action: 'RETURN'
          }
        });
        // Refresh book state
        handleScanBook(bookData.bookId);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Book Return transaction failed.'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleResetKiosk = () => {
    setStudentInput('');
    setBookInput('');
    setStudentData(null);
    setBookData(null);
    setActiveTxn(null);
    setMessage(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <Repeat className="w-6 h-6 text-brand-400" />
            <span>RFID Issue / Return Dual Kiosk</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated RFID hardware scanning workstation for instant book issuance and return processing
          </p>
        </div>

        <button
          onClick={handleResetKiosk}
          className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Kiosk Session</span>
        </button>
      </div>

      {/* Preset Quick Test Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Demo RFID Chip Presets</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => autofillStudent('CARD_E4A28B10')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-mono"
          >
            Scan Student: Aarav Gupta (CARD_E4A28B10)
          </button>
          <button
            onClick={() => autofillStudent('CARD_93F1C822')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-mono"
          >
            Scan Student: Ananya Roy (CARD_93F1C822)
          </button>
          <button
            onClick={() => autofillBook('TAG_B8F3D122')}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all font-mono"
          >
            Scan Book: DB Systems (TAG_B8F3D122)
          </button>
          <button
            onClick={() => autofillBook('TAG_11A22B33')}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all font-mono"
          >
            Scan Book: Clean Code (TAG_11A22B33)
          </button>
        </div>
      </div>

      {/* Transaction Output Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold text-sm mb-1">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>

          {message.details && (
            <div className="mt-2 pt-2 border-t border-emerald-500/20 font-mono space-y-1 text-[11px] text-slate-300">
              {message.details.transactionId && <div>Transaction ID: {message.details.transactionId}</div>}
              {message.details.dueDate && <div>Book Return Due Date: {message.details.dueDate}</div>}
              {message.details.overdueDays > 0 && (
                <div className="text-rose-300 font-bold">
                  Overdue Return: {message.details.overdueDays} Day(s) Late • Fine Accrued: ₹{message.details.fineAmount}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dual Scan Workstation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Student Scan Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">1. Student Identification</h2>
            </div>
            {studentData && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                Identified
              </span>
            )}
          </div>

          {/* Student Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Scan Student RFID Card / Enter Roll No.</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Scan className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanStudent()}
                  placeholder="CARD_E4A28B10 or STU-2024-001"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={() => handleScanStudent()}
                disabled={scanningStudent}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {scanningStudent ? 'Scanning...' : 'Scan Card'}
              </button>
            </div>
          </div>

          {/* Student Details Card */}
          {studentData ? (
            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-slate-100 text-base">{studentData.name}</div>
                <RFIDBadge uid={studentData.RFIDCardId} type="MEMBER_CARD" />
              </div>
              <div className="text-xs text-slate-400 space-y-1 font-mono">
                <div>Student ID : <span className="text-emerald-400 font-bold">{studentData.studentId}</span></div>
                <div>Department : <span className="text-slate-200">{studentData.department}</span> (Year {studentData.year})</div>
                <div>Email : <span className="text-slate-300">{studentData.email}</span></div>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic">
              Tap Student RFID Card or enter Student ID to identify member.
            </div>
          )}
        </div>

        {/* Step 2: Book Scan Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <BookCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">2. Book Identification</h2>
            </div>
            {bookData && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 uppercase">
                Identified
              </span>
            )}
          </div>

          {/* Book Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Scan Book RFID Tag / Enter ISBN or ID</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Scan className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={bookInput}
                  onChange={(e) => setBookInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanBook()}
                  placeholder="TAG_B8F3D122 or BK-1001"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => handleScanBook()}
                disabled={scanningBook}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {scanningBook ? 'Scanning...' : 'Scan Book'}
              </button>
            </div>
          </div>

          {/* Book Details Card */}
          {bookData ? (
            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-slate-100 text-base">{bookData.title}</div>
                <RFIDBadge uid={bookData.RFIDTagId} type="BOOK_TAG" />
              </div>
              <div className="text-xs text-slate-400 space-y-1 font-mono">
                <div>Author : <span className="text-slate-200">{bookData.author}</span></div>
                <div>ISBN : <span className="text-indigo-400 font-bold">{bookData.ISBN}</span></div>
                <div>Shelf Location : <span className="text-amber-300 font-bold">{bookData.shelfLocation}</span></div>
                <div className="pt-1 flex items-center justify-between">
                  <span>Available Copies:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    bookData.availableCopies > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {bookData.availableCopies} / {bookData.totalCopies}
                  </span>
                </div>
              </div>

              {activeTxn && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 space-y-0.5 font-mono">
                  <div className="font-bold flex items-center space-x-1">
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    <span>Currently Issued to: {activeTxn.memberId?.name} ({activeTxn.memberId?.studentId})</span>
                  </div>
                  <div>Due Date: {new Date(activeTxn.dueDate).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic">
              Tap Book RFID Tag or enter ISBN to identify item.
            </div>
          )}
        </div>
      </div>

      {/* Primary Execution Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="text-xs text-slate-400 space-y-1 text-center sm:text-left">
          <div className="font-bold text-slate-200 uppercase tracking-wider">Transaction Execution Controls</div>
          <div>Issue requires Student & Book scan. Return requires Book scan.</div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleIssueBook}
            disabled={processingAction || !studentData || !bookData || bookData.availableCopies <= 0}
            className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-brand-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Repeat className="w-4 h-4" />
            <span>ISSUE BOOK</span>
          </button>

          <button
            onClick={handleReturnBook}
            disabled={processingAction || !bookData}
            className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>RETURN BOOK</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueReturnKiosk;
