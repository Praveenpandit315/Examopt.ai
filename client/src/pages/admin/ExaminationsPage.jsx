// client/src/pages/admin/ExaminationsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Building,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';

export function ExaminationsPage() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('All Programs');
  const [semesterFilter, setSemesterFilter] = useState('All Semesters');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    subject_id: '',
    program: 'B.Tech',
    semester: 3,
    duration_minutes: 120,
    required_room_type: 'classroom',
    group_ids: [],
    is_fixed: false,
    fixed_date: '',
    fixed_start_time: '',
    fixed_room_id: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, subjectsRes, groupsRes, roomsRes] = await Promise.all([
        api.exams.getAll({
          search,
          program: programFilter !== 'All Programs' ? programFilter : undefined,
          semester: semesterFilter !== 'All Semesters' ? semesterFilter : undefined
        }),
        api.exams.getSubjects(),
        api.groups.getAll(),
        api.rooms.getAll()
      ]);

      setExams(examsRes.exams || []);
      setSubjects(subjectsRes.subjects || []);
      setGroups(groupsRes.groups || []);
      setRooms(roomsRes.rooms || []);
    } catch (err) {
      setToast({ message: 'Failed to load examination records: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [programFilter, semesterFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenCreateModal = () => {
    setEditingExam(null);
    setFormData({
      code: `EX${String(exams.length + 1).padStart(3, '0')}`,
      subject_id: subjects[0]?.id || '',
      program: 'B.Tech',
      semester: 3,
      duration_minutes: 120,
      required_room_type: 'classroom',
      group_ids: groups.slice(0, 2).map(g => g.id),
      is_fixed: false,
      fixed_date: '',
      fixed_start_time: '',
      fixed_room_id: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exam) => {
    setEditingExam(exam);
    setFormData({
      code: exam.code,
      subject_id: exam.subject_id,
      program: exam.program,
      semester: exam.semester,
      duration_minutes: exam.duration_minutes,
      required_room_type: exam.required_room_type,
      group_ids: exam.group_ids || [],
      is_fixed: !!exam.fixed_date,
      fixed_date: exam.fixed_date || '',
      fixed_start_time: exam.fixed_start_time || '',
      fixed_room_id: exam.fixed_room_id || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        fixed_date: formData.is_fixed ? formData.fixed_date : null,
        fixed_start_time: formData.is_fixed ? formData.fixed_start_time : null,
        fixed_room_id: formData.is_fixed ? formData.fixed_room_id : null
      };

      if (editingExam) {
        await api.exams.update(editingExam.id, payload);
        setToast({ message: `Examination ${payload.code} updated successfully`, type: 'success' });
      } else {
        await api.exams.create(payload);
        setToast({ message: `Examination ${payload.code} created successfully`, type: 'success' });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({ message: err.message || 'Operation failed', type: 'error' });
    }
  };

  const handleDeleteExam = async (exam) => {
    if (!window.confirm(`Are you sure you want to delete examination ${exam.code} (${exam.subject_name})?`)) {
      return;
    }

    try {
      await api.exams.delete(exam.id);
      setToast({ message: `Examination ${exam.code} deleted successfully`, type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete examination', type: 'error' });
    }
  };

  const handleGroupToggle = (groupId) => {
    setFormData(prev => {
      const exists = prev.group_ids.includes(groupId);
      return {
        ...prev,
        group_ids: exists 
          ? prev.group_ids.filter(id => id !== groupId)
          : [...prev.group_ids, groupId]
      };
    });
  };

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      {/* Top Header Matching Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examination Management</h1>
          <p className="text-xs text-slate-500 mt-1">Create, view and manage all examination records.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Examination</span>
        </button>
      </div>

      {/* Search and Filters Bar Matching Mockup */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject code or name..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </form>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option>All Programs</option>
            <option>B.Tech</option>
            <option>M.Tech</option>
            <option>BCA</option>
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option>All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="3">Semester 3</option>
            <option value="5">Semester 5</option>
            <option value="7">Semester 7</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            title="Apply Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Examinations Data Table Matching Mockup */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">ID</th>
                <th className="px-6 py-3.5">Subject Code</th>
                <th className="px-6 py-3.5">Subject Name</th>
                <th className="px-6 py-3.5">Program</th>
                <th className="px-6 py-3.5">Semester</th>
                <th className="px-6 py-3.5">Groups</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Room Type</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-slate-400">
                    No examination records found matching current filters.
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{exam.code}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">{exam.subject_code}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div>{exam.subject_name}</div>
                      {exam.fixed_date && (
                        <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                          Fixed: {exam.fixed_date} @ {exam.fixed_start_time} ({exam.fixed_room_code})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{exam.program}</td>
                    <td className="px-6 py-4">{exam.semester}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {exam.group_names || 'A, B'}
                    </td>
                    <td className="px-6 py-4">{exam.duration_minutes} min</td>
                    <td className="px-6 py-4">
                      {exam.required_room_type === 'computer_lab' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                          Computer Lab
                        </span>
                      ) : exam.required_room_type === 'specialized' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          Specialized
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          Classroom
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(exam)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Examination"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Examination"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching mockup */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>Showing 1 to {exams.length} of {exams.length} examinations</div>
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">1</button>
            <button className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium flex items-center justify-center">2</button>
            <button className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium flex items-center justify-center">3</button>
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Examination Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExam ? `Edit Examination (${formData.code})` : 'Add New Examination'}
      >
        <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Exam Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="EX001"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject</label>
              <select
                required
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} — {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Program</label>
              <select
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option>B.Tech</option>
                <option>M.Tech</option>
                <option>BCA</option>
                <option>MCA</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
                <option value={3}>Semester 3</option>
                <option value={4}>Semester 4</option>
                <option value={5}>Semester 5</option>
                <option value={6}>Semester 6</option>
                <option value={7}>Semester 7</option>
                <option value={8}>Semester 8</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
                <option value={120}>120 Minutes (2 hrs)</option>
                <option value={180}>180 Minutes (3 hrs)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Required Room Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'classroom', label: 'Classroom', desc: 'Standard lecture room' },
                { type: 'computer_lab', label: 'Computer Lab', desc: 'High-spec workstation lab' },
                { type: 'specialized', label: 'Specialized', desc: 'Auditorium / special facility' }
              ].map(opt => (
                <label 
                  key={opt.type} 
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    formData.required_room_type === opt.type 
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="required_room_type"
                      checked={formData.required_room_type === opt.type}
                      onChange={() => setFormData({ ...formData, required_room_type: opt.type })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold">{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Enrolled Student Groups</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {groups.map((grp) => {
                const selected = formData.group_ids.includes(grp.id);
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => handleGroupToggle(grp.id)}
                    className={`px-3 py-2 rounded-xl text-left border transition ${
                      selected
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>{grp.code}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{grp.student_count} students</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fixed Examination Configuration Section */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.is_fixed}
                onChange={(e) => setFormData({ ...formData, is_fixed: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span className="font-bold text-slate-800">Lock as Fixed Examination (Hard Constraint)</span>
            </label>

            {formData.is_fixed && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">Fixed Date</label>
                  <input
                    type="date"
                    required={formData.is_fixed}
                    value={formData.fixed_date}
                    onChange={(e) => setFormData({ ...formData, fixed_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">Fixed Start Time</label>
                  <input
                    type="time"
                    required={formData.is_fixed}
                    value={formData.fixed_start_time}
                    onChange={(e) => setFormData({ ...formData, fixed_start_time: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">Fixed Room</label>
                  <select
                    value={formData.fixed_room_id}
                    onChange={(e) => setFormData({ ...formData, fixed_room_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white"
                  >
                    <option value="">Any Compatible Room</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.code} ({r.room_name} • Cap: {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30"
            >
              {editingExam ? 'Save Changes' : 'Create Examination'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
