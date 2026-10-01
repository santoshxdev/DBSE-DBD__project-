import React, { useState, useEffect } from 'react';
import API from '../services/api';
import RFIDBadge from '../components/RFIDBadge';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, Plus, Edit2, Trash2, Cpu, Filter, CheckCircle, AlertCircle } from 'lucide-react';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRfidModalOpen, setIsRfidModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    ISBN: '',
    title: '',
    author: '',
    category: '',
    publisher: '',
    publicationYear: '',
    language: 'English',
    totalCopies: 1,
    shelfLocation: '',
    RFIDTagId: ''
  });

  const [rfidTagInput, setRfidTagInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchBooks();
  }, [page, search, category, status]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await API.get('/books', {
        params: { page, limit: 8, search, category, status }
      });
      if (res.data.success) {
        setBooks(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch books catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await API.post('/books', formData);
      if (res.data.success) {
        setSuccessMsg(`Book "${res.data.data.title}" added successfully!`);
        setIsAddModalOpen(false);
        resetForm();
        fetchBooks();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create book record.');
    }
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await API.put(`/books/${selectedBook._id}`, formData);
      if (res.data.success) {
        setSuccessMsg(`Book updated successfully!`);
        setIsEditModalOpen(false);
        fetchBooks();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update book.');
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await API.delete(`/books/${bookId}`);
      if (res.data.success) {
        setSuccessMsg(`Book "${title}" deleted.`);
        fetchBooks();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete book.');
    }
  };

  const handleAssignRfid = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await API.put(`/books/${selectedBook._id}`, {
        RFIDTagId: rfidTagInput.trim().toUpperCase()
      });
      if (res.data.success) {
        setSuccessMsg(`RFID Tag ${rfidTagInput.toUpperCase()} assigned to book!`);
        setIsRfidModalOpen(false);
        fetchBooks();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to assign RFID tag.');
    }
  };

  const openEditModal = (book) => {
    setSelectedBook(book);
    setFormData({
      ISBN: book.ISBN,
      title: book.title,
      author: book.author,
      category: book.category,
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || '',
      language: book.language || 'English',
      totalCopies: book.totalCopies,
      shelfLocation: book.shelfLocation,
      RFIDTagId: book.RFIDTagId || ''
    });
    setIsEditModalOpen(true);
  };

  const openRfidModal = (book) => {
    setSelectedBook(book);
    setRfidTagInput(book.RFIDTagId || '');
    setIsRfidModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      ISBN: '',
      title: '',
      author: '',
      category: '',
      publisher: '',
      publicationYear: '',
      language: 'English',
      totalCopies: 1,
      shelfLocation: '',
      RFIDTagId: ''
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-brand-400" />
            <span>Books Catalog Management</span>
          </h1>
          <p className="text-xs text-slate-400">Manage catalog inventory, copies, shelf locations, and RFID tags</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
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

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Title, Author, ISBN, or RFID Tag..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Categories</option>
          <option value="Database Systems">Database Systems</option>
          <option value="Software Engineering">Software Engineering</option>
          <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
          <option value="Operating Systems">Operating Systems</option>
          <option value="Networking">Networking</option>
          <option value="Artificial Intelligence">Artificial Intelligence</option>
          <option value="Embedded & IoT">Embedded & IoT</option>
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="ISSUED">ISSUED</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
      </div>

      {/* Books Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase tracking-wider text-[10px] font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Book Details</th>
                <th className="py-3.5 px-4">ISBN</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Shelf Location</th>
                <th className="py-3.5 px-4 text-center">Copies (Avail / Total)</th>
                <th className="py-3.5 px-4">RFID Tag</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Loading books database...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No books matched search filter criteria.
                  </td>
                </tr>
              ) : (
                books.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{b.title}</div>
                      <div className="text-[11px] text-slate-400">By {b.author}</div>
                      <div className="text-[10px] text-brand-400 font-mono">{b.bookId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{b.ISBN}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-300">{b.shelfLocation}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-mono font-bold px-2 py-1 rounded-lg ${
                        b.availableCopies > 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                      }`}>
                        {b.availableCopies} / {b.totalCopies}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <RFIDBadge uid={b.RFIDTagId} type="BOOK_TAG" />
                        <button
                          onClick={() => openRfidModal(b)}
                          title="Assign or rebind RFID Tag"
                          className="p-1 rounded bg-slate-800 hover:bg-brand-600/30 text-slate-400 hover:text-brand-300 transition-colors"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteBook(b._id, b.title)}
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

      {/* Add Book Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Book Catalog">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreateBook} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Book Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Distributed System Engineering"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Author Name *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g. Andrew Tanenbaum"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">ISBN Code *</label>
              <input
                type="text"
                required
                value={formData.ISBN}
                onChange={(e) => setFormData({ ...formData, ISBN: e.target.value })}
                placeholder="978-0131103627"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Database Systems"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Total Copies</label>
              <input
                type="number"
                min="1"
                required
                value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Shelf Location *</label>
              <input
                type="text"
                required
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                placeholder="e.g. A1-S3"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">RFID Tag UID</label>
              <input
                type="text"
                value={formData.RFIDTagId}
                onChange={(e) => setFormData({ ...formData, RFIDTagId: e.target.value })}
                placeholder="TAG_B8F3D122"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors"
          >
            Save Book Record
          </button>
        </form>
      </Modal>

      {/* Edit Book Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Book Details">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleUpdateBook} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Book Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Author</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Shelf Location</label>
              <input
                type="text"
                required
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Total Copies</label>
              <input
                type="number"
                min="1"
                required
                value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">RFID Tag UID</label>
              <input
                type="text"
                value={formData.RFIDTagId}
                onChange={(e) => setFormData({ ...formData, RFIDTagId: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono uppercase"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors"
          >
            Update Changes
          </button>
        </form>
      </Modal>

      {/* RFID Tag Assign Modal */}
      <Modal isOpen={isRfidModalOpen} onClose={() => setIsRfidModalOpen(false)} title="Assign RFID Tag Chip">
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-800/60 rounded-xl space-y-1 border border-slate-700/50">
            <div className="font-bold text-slate-200">{selectedBook?.title}</div>
            <div className="text-slate-400 font-mono">ISBN: {selectedBook?.ISBN}</div>
          </div>

          <form onSubmit={handleAssignRfid} className="space-y-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">RFID Tag UID Code (HEX)</label>
              <input
                type="text"
                required
                value={rfidTagInput}
                onChange={(e) => setRfidTagInput(e.target.value)}
                placeholder="e.g. TAG_B8F3D122"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono uppercase focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <Cpu className="w-4 h-4" />
              <span>Bind RFID Tag to Book</span>
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Books;
