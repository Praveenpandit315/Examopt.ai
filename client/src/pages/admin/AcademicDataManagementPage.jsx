// client/src/pages/admin/AcademicDataManagementPage.jsx
// Academic Data Management Module for University Master Entities

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  UserCheck, 
  Layers, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../../services/api';

export function AcademicDataManagementPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Entity data states
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [blocks, setBlocks] = useState([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Load summary & initial data
  useEffect(() => {
    loadSummary();
    loadActiveTabData();
  }, [activeTab]);

  const loadSummary = async () => {
    try {
      const res = await api.academic.getSummary();
      if (res.summary) setSummary(res.summary);
    } catch (err) {
      console.error('Failed to load academic summary:', err);
    }
  };

  const loadActiveTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'departments') {
        const res = await api.academic.getDepartments();
        setDepartments(res.departments || []);
      } else if (activeTab === 'programs') {
        const res = await api.academic.getPrograms();
        setPrograms(res.programs || []);
      } else if (activeTab === 'subjects') {
        const res = await api.academic.getSubjects();
        setSubjects(res.subjects || []);
      } else if (activeTab === 'faculty') {
        const res = await api.academic.getFaculty();
        setFaculty(res.faculty || []);
      } else if (activeTab === 'blocks') {
        const res = await api.academic.getBlocks();
        setBlocks(res.blocks || []);
      }
    } catch (err) {
      console.error(`Failed to load ${activeTab}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({});
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalError('');
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError('');

    try {
      if (activeTab === 'departments') {
        if (editingItem) {
          await api.academic.updateDepartment(editingItem.id, formData);
        } else {
          await api.academic.createDepartment(formData);
        }
      } else if (activeTab === 'programs') {
        if (editingItem) {
          await api.academic.updateProgram(editingItem.id, formData);
        } else {
          await api.academic.createProgram(formData);
        }
      } else if (activeTab === 'subjects') {
        if (editingItem) {
          await api.academic.updateSubject(editingItem.id, formData);
        } else {
          await api.academic.createSubject(formData);
        }
      } else if (activeTab === 'faculty') {
        if (editingItem) {
          await api.academic.updateFaculty(editingItem.id, formData);
        } else {
          await api.academic.createFaculty(formData);
        }
      } else if (activeTab === 'blocks') {
        if (editingItem) {
          await api.academic.updateBlock(editingItem.id, formData);
        } else {
          await api.academic.createBlock(formData);
        }
      }

      setModalOpen(false);
      loadActiveTabData();
      loadSummary();
    } catch (err) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      if (activeTab === 'departments') await api.academic.deleteDepartment(id);
      else if (activeTab === 'programs') await api.academic.deleteProgram(id);
      else if (activeTab === 'subjects') await api.academic.deleteSubject(id);
      else if (activeTab === 'faculty') await api.academic.deleteFaculty(id);
      else if (activeTab === 'blocks') await api.academic.deleteBlock(id);

      loadActiveTabData();
      loadSummary();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Building2, count: summary?.departments ?? 0 },
    { id: 'programs', label: 'Programs & Degrees', icon: GraduationCap, count: summary?.programs ?? 0 },
    { id: 'subjects', label: 'Subjects Catalogue', icon: BookOpen, count: summary?.subjects ?? 0 },
    { id: 'faculty', label: 'Faculty & Roster', icon: UserCheck, count: summary?.faculty ?? 0 },
    { id: 'blocks', label: 'University Blocks', icon: Layers, count: summary?.blocks ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Data Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain university academic structures, departments, curricula, faculty rosters, and campus facilities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadSummary(); loadActiveTabData(); }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab.slice(0, -1)}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSearchQuery(''); }}
              className={`p-4 rounded-2xl text-left border transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                  : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-100' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {t.count}
                </span>
              </div>
              <div className="mt-3">
                <div className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{t.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing all persistent SQL records for {activeTab}
          </div>
        </div>

        {/* Dynamic Table Body */}
        <div className="overflow-x-auto">
          {activeTab === 'departments' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Building</th>
                  <th className="py-3 px-4">Department Head</th>
                  <th className="py-3 px-4 text-center">Programs</th>
                  <th className="py-3 px-4 text-center">Faculty</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {departments
                  .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(dept => (
                    <tr key={dept.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-blue-600">{dept.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{dept.name}</td>
                      <td className="py-3 px-4 text-slate-600">{dept.building || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{dept.head_name || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {dept.programs_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {dept.faculty_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button onClick={() => openEditModal(dept)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(dept.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'programs' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Program Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Degree Level</th>
                  <th className="py-3 px-4 text-center">Total Semesters</th>
                  <th className="py-3 px-4 text-center">Enrolled Students</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {programs
                  .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(prog => (
                    <tr key={prog.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-blue-600">{prog.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{prog.name}</td>
                      <td className="py-3 px-4 text-slate-600">{prog.department_name || prog.department_code || '—'}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">{prog.degree_level}</span></td>
                      <td className="py-3 px-4 text-center font-medium">{prog.total_semesters} Semesters</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600">{prog.enrolled_students}</td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button onClick={() => openEditModal(prog)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(prog.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'subjects' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4">Room Requirement</th>
                  <th className="py-3 px-4 text-center">Active Exams</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subjects
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-blue-600">{sub.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{sub.name}</td>
                      <td className="py-3 px-4 text-slate-600">{sub.department_name || sub.department}</td>
                      <td className="py-3 px-4 text-center font-bold">{sub.credits}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.required_room_type === 'computer_lab' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {sub.required_room_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-800">{sub.examinations_count}</td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button onClick={() => openEditModal(sub)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'faculty' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Faculty ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4 text-center">Blackouts</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {faculty
                  .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.email.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(fac => (
                    <tr key={fac.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-blue-600">{fac.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{fac.name}</td>
                      <td className="py-3 px-4 text-slate-600">{fac.email}</td>
                      <td className="py-3 px-4 text-slate-600">{fac.department_name || fac.department_code || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{fac.designation}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          fac.blackout_windows > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {fac.blackout_windows} windows
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button onClick={() => openEditModal(fac)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(fac.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'blocks' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Block Code</th>
                  <th className="py-3 px-4">Building Name</th>
                  <th className="py-3 px-4">Campus Zone</th>
                  <th className="py-3 px-4 text-center">Floors</th>
                  <th className="py-3 px-4 text-center">Rooms</th>
                  <th className="py-3 px-4 text-center">Total Capacity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {blocks
                  .filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(blk => (
                    <tr key={blk.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-blue-600">{blk.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{blk.name}</td>
                      <td className="py-3 px-4 text-slate-600">{blk.campus_zone}</td>
                      <td className="py-3 px-4 text-center font-medium">{blk.total_floors} Floors</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600">{blk.room_count}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{blk.total_capacity} seats</td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button onClick={() => openEditModal(blk)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(blk.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Dynamic Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `New ${activeTab.slice(0, -1)}`}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="mt-4 space-y-4 text-xs">
              {/* Code */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code / Identifier</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingItem)}
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CS, BCA, CS101, F101"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Name / Title</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Department of Computer Science"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {activeTab === 'departments' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Building</label>
                    <input
                      type="text"
                      value={formData.building || ''}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      placeholder="e.g. Ramanujan Block"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department Head</label>
                    <input
                      type="text"
                      value={formData.head_name || ''}
                      onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                      placeholder="e.g. Dr. John Doe"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              {activeTab === 'faculty' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. john.doe@university.edu"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formData.designation || ''}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Professor & Dean"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              {activeTab === 'subjects' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Credits</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={formData.credits || 3}
                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Room Type</label>
                      <select
                        value={formData.required_room_type || 'classroom'}
                        onChange={(e) => setFormData({ ...formData, required_room_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="classroom">Classroom</option>
                        <option value="computer_lab">Computer Lab</option>
                        <option value="specialized">Specialized</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
