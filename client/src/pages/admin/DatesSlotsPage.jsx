// client/src/pages/admin/DatesSlotsPage.jsx
import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, Trash2, Ban, CheckCircle2, ShieldCheck, Clock, Settings } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';

export function DatesSlotsPage() {
  const [slots, setSlots] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const [slotFormData, setSlotFormData] = useState({
    slot_name: 'Morning Slot',
    date: '2025-04-20',
    start_time: '09:00',
    end_time: '11:00',
    is_blocked: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, rulesRes] = await Promise.all([
        api.slots.getAll(),
        api.slots.getRules()
      ]);
      setSlots(slotsRes.slots || []);
      setRules(rulesRes.rules || []);
    } catch (err) {
      setToast({ message: 'Failed to load scheduling rules: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await api.slots.create(slotFormData);
      setToast({ message: 'Time slot created successfully', type: 'success' });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to create slot', type: 'error' });
    }
  };

  const handleToggleBlock = async (slot) => {
    try {
      await api.slots.update(slot.id, { is_blocked: slot.is_blocked ? 0 : 1 });
      setToast({ 
        message: slot.is_blocked ? `Slot unblocked` : `Slot marked as institutional blackout period`, 
        type: 'info' 
      });
      fetchData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to toggle slot', type: 'error' });
    }
  };

  const handleDeleteSlot = async (slot) => {
    if (!window.confirm(`Delete time slot on ${slot.date} (${slot.start_time}-${slot.end_time})?`)) return;
    try {
      await api.slots.delete(slot.id);
      setToast({ message: 'Time slot deleted', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete slot', type: 'error' });
    }
  };

  const handleRuleToggle = async (rule) => {
    try {
      await api.slots.updateRule(rule.id, { is_active: rule.is_active ? 0 : 1 });
      setToast({ message: `Rule '${rule.rule_name}' updated`, type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to update rule', type: 'error' });
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dates, Slots & Institutional Rules</h1>
          <p className="text-xs text-slate-500 mt-1">Configure available examination windows, blackout intervals, and mandatory institutional policies.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Time Slot</span>
        </button>
      </div>

      {/* Institutional Rules Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Institutional Scheduling Constraints (Active Policies)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{rule.rule_name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {rule.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{rule.description}</p>
                <div className="mt-2 text-xs font-mono font-bold text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded">
                  Setting Value: {rule.rule_value}
                </div>
              </div>

              <button
                onClick={() => handleRuleToggle(rule)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                  rule.is_active 
                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50' 
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {rule.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Time Slots Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Examination Time Windows ({slots.length})</h2>
          </div>
          <span className="text-xs text-slate-400">Total Valid Slots: {slots.filter(s => !s.is_blocked).length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Slot Name</th>
                <th className="px-6 py-3.5">Time Interval</th>
                <th className="px-6 py-3.5">Duration Window</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.map((slot) => (
                <tr key={slot.id} className={`hover:bg-slate-50 transition-colors ${slot.is_blocked ? 'bg-rose-50/20' : ''}`}>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{slot.date}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{slot.slot_name}</td>
                  <td className="px-6 py-4 font-mono text-blue-600">{slot.start_time} — {slot.end_time}</td>
                  <td className="px-6 py-4 text-slate-500">120 min capacity</td>
                  <td className="px-6 py-4">
                    {slot.is_blocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        <Ban className="w-3 h-3" />
                        <span>Institutional Blackout</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Available for Allocation</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleToggleBlock(slot)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          slot.is_blocked
                            ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        {slot.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Examination Time Slot"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Slot Name</label>
            <input
              type="text"
              required
              value={slotFormData.slot_name}
              onChange={(e) => setSlotFormData({ ...slotFormData, slot_name: e.target.value })}
              placeholder="e.g. Morning Slot (09:00 - 11:00)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={slotFormData.date}
              onChange={(e) => setSlotFormData({ ...slotFormData, date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={slotFormData.start_time}
                onChange={(e) => setSlotFormData({ ...slotFormData, start_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={slotFormData.end_time}
                onChange={(e) => setSlotFormData({ ...slotFormData, end_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
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
              Create Slot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
