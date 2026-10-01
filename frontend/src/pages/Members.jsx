import React, { useState, useEffect } from 'react';
import API from '../services/api';
import RFIDBadge from '../components/RFIDBadge';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Users, Search, Plus, Edit2, Trash2, Cpu, CheckCircle, CreditCard } from 'lucide-react';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRfidModalOpen, setIsRfidModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    department: 'Computer Science',
    year: 1,
    phone: '',
    RFIDCardId: ''
  });

  const [rfidCardInput, setRfidCardInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchMembers();
  }, [page, search, department, status]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/members', {
        params: { page, limit: 8, search, department, status }
      });
      if (res.data.success) {
        setMembers(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch members catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await API.post('/members', formData);
      if (res.data.success) {
        setSuccessMsg(`Student ${res.data.data.name} registered successfully!`);
        setIsAddModalOpen(false);
        resetForm();
        fetchMembers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to register student member.');
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await API.put(`/members/${selectedMember._id}`, formData);
      if (res.data.success) {
        setSuccessMsg('Member record updated!');
        setIsEditModalOpen(false);
        fetchMembers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update member.');
    }
  };

  const handleDeleteMember = async (memberId, name) => {
    if (!window.confirm(`Are you sure you want to remove member ${name}?`)) return;
    try {
      const res = await API.delete(`/members/${memberId}`);
      if (res.data.success) {
        setSuccessMsg(`Member ${name} removed.`);
        fetchMembers();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  const handleAssignRfid = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await API.put(`/members/${selectedMember._id}`, {
        RFIDCardId: rfidCardInput.trim().toUpperCase()
      });
      if (res.data.success) {
        setSuccessMsg(`RFID Card ${rfidCardInput.toUpperCase()} assigned to student!`);
        setIsRfidModalOpen(false);
        fetchMembers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to assign RFID card.');
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      studentId: member.studentId,
      name: member.name,
      email: member.email,
      department: member.department,
      year: member.year,
      phone: member.phone,
      RFIDCardId: member.RFIDCardId || ''
    });
    setIsEditModalOpen(true);
  };

  const openRfidModal = (member) => {
    setSelectedMember(member);
    setRfidCardInput(member.RFIDCardId || '');
    setIsRfidModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      name: '',
      email: '',
      department: 'Computer Science',
      year: 1,
      phone: '',
      RFIDCardId: ''
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-brand-400" />
            <span>Student Members Registry</span>
          </h1>
          <p className="text-xs text-slate-400">Manage student profiles, departments, contact info, and RFID access cards</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Student Member</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Student ID, Name, Email, or RFID Card..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Electronics & Comm">Electronics & Comm</option>
          <option value="Mechanical Engg">Mechanical Engg</option>
          <option value="Information Tech">Information Tech</option>
          <option value="Electrical Engg">Electrical Engg</option>
          <option value="Civil Engg">Civil Engg</option>
          <option value="Artificial Intel">Artificial Intel</option>
        </select>
      </div>

      {/* Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase tracking-wider text-[10px] font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student Details</th>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Department & Year</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">RFID Card UID</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Loading members database...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No members matched criteria.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{m.name}</div>
                      <div className="text-[11px] text-slate-400">{m.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-brand-400">{m.studentId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{m.department}</div>
                      <div className="text-[10px] text-slate-400">Year {m.year}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{m.phone}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <RFIDBadge uid={m.RFIDCardId} type="MEMBER_CARD" />
                        <button
                          onClick={() => openRfidModal(m)}
                          title="Assign RFID Member Card"
                          className="p-1 rounded bg-slate-800 hover:bg-emerald-600/30 text-slate-400 hover:text-emerald-300 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteMember(m._id, m.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Student Member">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarav Gupta"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Student Roll / ID *</label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g. STU-2024-001"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">University Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aarav.cs24@univ.ac.in"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics & Comm">Electronics & Comm</option>
                <option value="Mechanical Engg">Mechanical Engg</option>
                <option value="Information Tech">Information Tech</option>
                <option value="Electrical Engg">Electrical Engg</option>
                <option value="Civil Engg">Civil Engg</option>
                <option value="Artificial Intel">Artificial Intel</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Academic Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">RFID Card UID</label>
              <input
                type="text"
                value={formData.RFIDCardId}
                onChange={(e) => setFormData({ ...formData, RFIDCardId: e.target.value })}
                placeholder="CARD_E4A28B10"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors"
          >
            Register Student
          </button>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student Member">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleUpdateMember} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Student Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">RFID Card UID</label>
              <input
                type="text"
                value={formData.RFIDCardId}
                onChange={(e) => setFormData({ ...formData, RFIDCardId: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono uppercase"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors"
          >
            Update Student Details
          </button>
        </form>
      </Modal>

      {/* RFID Card Assign Modal */}
      <Modal isOpen={isRfidModalOpen} onClose={() => setIsRfidModalOpen(false)} title="Assign RFID Student Smartcard">
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-800/60 rounded-xl space-y-1 border border-slate-700/50">
            <div className="font-bold text-slate-200">{selectedMember?.name}</div>
            <div className="text-slate-400 font-mono">Student ID: {selectedMember?.studentId} • {selectedMember?.department}</div>
          </div>

          <form onSubmit={handleAssignRfid} className="space-y-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">RFID Card UID (HEX)</label>
              <input
                type="text"
                required
                value={rfidCardInput}
                onChange={(e) => setRfidCardInput(e.target.value)}
                placeholder="e.g. CARD_E4A28B10"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bind RFID Card to Student</span>
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Members;
