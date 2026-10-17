// client/src/pages/admin/StudentGroupsPage.jsx
import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit3, Trash2, GitCompare, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';

export function StudentGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [overlaps, setOverlaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    program: 'B.Tech CSE',
    semester: 3,
    section: 'A',
    student_count: 45
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, overlapsRes] = await Promise.all([
        api.groups.getAll(),
        api.groups.getOverlaps()
      ]);
      setGroups(groupsRes.groups || []);
      setOverlaps(overlapsRes.overlaps || []);
    } catch (err) {
      setToast({ message: 'Failed to load student groups: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setFormData({
      code: `GRP-CS${Math.floor(1 + Math.random() * 8)}X`,
      name: 'Computer Science Section',
      program: 'B.Tech CSE',
      semester: 3,
      section: 'A',
      student_count: 45
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      code: group.code,
      name: group.name,
      program: group.program,
      semester: group.semester,
      section: group.section,
      student_count: group.student_count
    });
    setIsModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await api.groups.update(editingGroup.id, formData);
        setToast({ message: `Group ${formData.code} updated`, type: 'success' });
      } else {
        await api.groups.create(formData);
        setToast({ message: `Group ${formData.code} created`, type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({ message: err.message || 'Operation failed', type: 'error' });
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Delete group ${group.code}?`)) return;
    try {
      await api.groups.delete(group.id);
      setToast({ message: `Group ${group.code} deleted`, type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete group', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Groups & Cohorts</h1>
          <p className="text-xs text-slate-500 mt-1">Manage academic batches, student headcounts, and analyze student cross-enrollment overlaps.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Student Group</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {group.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{group.name}</h3>
                  <p className="text-xs text-slate-400">{group.program} • Sem {group.semester} Sec {group.section}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Student Count:</span>
                <span className="font-extrabold text-slate-900">{group.student_count}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-500">Linked Exams:</span>
                <span className="font-bold text-blue-600">{group.linked_exams_count || 0}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(group)}
                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteGroup(group)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Student Enrollment Overlap Intelligence Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <GitCompare className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Shared Student Overlap Intelligence</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          The constraint optimization engine automatically queries cross-group enrollment to guarantee that no student is booked in two exams at once.
        </p>

        {overlaps.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
            No cross-group conflicts detected. All student groups operate as independent disjoint cohorts in current seed state.
          </div>
        ) : (
          <div className="space-y-2">
            {overlaps.map((ov, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>
                    <strong>{ov.group_1_code}</strong> and <strong>{ov.group_2_code}</strong> share <strong>{ov.shared_students} enrolled students</strong>.
                  </span>
                </div>
                <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full font-bold">Hard Constraint Enforced</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? `Edit Group ${formData.code}` : 'Add Student Group'}
      >
        <form onSubmit={handleSaveGroup} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Group Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Group Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Program</label>
              <input
                type="text"
                required
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                required
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Student Headcount</label>
            <input
              type="number"
              min="1"
              max="300"
              required
              value={formData.student_count}
              onChange={(e) => setFormData({ ...formData, student_count: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
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
              Save Group
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
