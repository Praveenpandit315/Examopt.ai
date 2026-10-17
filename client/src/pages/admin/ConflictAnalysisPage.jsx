// client/src/pages/admin/ConflictAnalysisPage.jsx
import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Users, 
  DoorOpen, 
  CalendarOff, 
  Layers, 
  Search, 
  Filter, 
  Info, 
  CheckCircle2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Modal } from '../../components/Modal';

export function ConflictAnalysisPage() {
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [filterType, setFilterType] = useState('All Conflict Types');
  const [filterSeverity, setFilterSeverity] = useState('All Severities');
  const [search, setSearch] = useState('');

  // Structured conflicts demonstrated in Scenario C, D, E
  const conflicts = [
    {
      code: 'C01',
      type: 'Shared Student',
      affectedExams: 'CS101, CS102',
      roomGroup: 'Group A, B',
      reason: 'Same students in overlapping slots (2025-04-15 09:00 - 11:00)',
      severity: 'High',
      status: 'Resolved in Smart Engine',
      evidence: 'Rahul Kumar (Roll CS-2024-042) is enrolled in both CS101 and CS102. Assigning both to Slot 1 causes double-booking for 45 students.',
      possibleSteps: 'Smart Heuristic Scheduler shifts CS102 to Day 2 (2025-04-16 12:00) to ensure at least 24h separation between core exams.'
    },
    {
      code: 'C02',
      type: 'Room Capacity',
      affectedExams: 'MA101',
      roomGroup: 'R203',
      reason: 'Required capacity (90) exceeds room capacity (60)',
      severity: 'Medium',
      status: 'Open',
      evidence: 'MA101 includes Groups A and B (90 total students), but Room R203 has an effective examination seating limit of only 60 seats.',
      possibleSteps: 'Reallocate MA101 to Lecture Hall R101 (100 seats) or Main Auditorium AUD-1 (180 seats).'
    },
    {
      code: 'C03',
      type: 'Room Unavailable',
      affectedExams: 'PH101',
      roomGroup: 'R203',
      reason: 'Room R203 unavailable on 18 Apr 12:00 - 16:00',
      severity: 'Medium',
      status: 'Open',
      evidence: 'Facility maintenance block #MB-401 booked for HVAC air duct overhaul on 2025-04-18 between 12:00 and 16:00.',
      possibleSteps: 'Assign PH101 to Room R102 or move the time interval to the 09:00 morning slot.'
    },
    {
      code: 'C04',
      type: 'Lab Requirement',
      affectedExams: 'CS103',
      roomGroup: 'R101',
      reason: 'Lab practical exam allocated to standard classroom',
      severity: 'High',
      status: 'Resolved in Smart Engine',
      evidence: 'CS103 (Computer Networks Lab) specifies mandatory requirement: computer_lab with workstation hardware.',
      possibleSteps: 'Allocator strictly binds CS103 to Lab L1 or L2.'
    }
  ];

  const filtered = conflicts.filter(c => {
    if (filterType !== 'All Conflict Types' && c.type !== filterType) return false;
    if (filterSeverity !== 'All Severities' && c.severity !== filterSeverity) return false;
    if (search && !c.reason.toLowerCase().includes(search.toLowerCase()) && !c.affectedExams.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Matching Mockup */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Conflict Analysis</h1>
        <p className="text-xs text-slate-500 mt-1">
          View and resolve scheduling conflicts with transparent, explainable diagnostics.
        </p>
      </div>

      {/* 4 Summary Stat Cards Matching Mockup */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
          <div className="text-2xl font-black text-rose-600">3</div>
          <div className="text-xs font-bold text-slate-700 mt-1">Shared Student Conflicts</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Identified in baseline unoptimized search</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-l-4 border-l-amber-500">
          <div className="text-2xl font-black text-amber-600">1</div>
          <div className="text-xs font-bold text-slate-700 mt-1">Room Capacity Issues</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cohorts exceeding seating limit</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-l-4 border-l-orange-500">
          <div className="text-2xl font-black text-orange-600">1</div>
          <div className="text-xs font-bold text-slate-700 mt-1">Room Unavailable</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Overlaps with maintenance outage</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
          <div className="text-2xl font-black text-blue-600">0</div>
          <div className="text-xs font-bold text-slate-700 mt-1">Other Conflicts</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rules fully satisfied</div>
        </div>
      </div>

      {/* Filter and Search Bar Matching Mockup */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option>All Conflict Types</option>
            <option>Shared Student</option>
            <option>Room Capacity</option>
            <option>Room Unavailable</option>
            <option>Lab Requirement</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option>All Severities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conflicts..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Conflicts Table Matching Mockup */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Affected Exams</th>
                <th className="px-6 py-3.5">Room/Group</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{c.code}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{c.type}</td>
                  <td className="px-6 py-4 font-mono text-blue-600 font-bold">{c.affectedExams}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{c.roomGroup}</td>
                  <td className="px-6 py-4 text-slate-700 max-w-xs">{c.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.severity === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-semibold text-slate-500">{c.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedConflict(c)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conflict Explanation Modal */}
      <Modal
        isOpen={!!selectedConflict}
        onClose={() => setSelectedConflict(null)}
        title={`Conflict Diagnostic — ${selectedConflict?.code} (${selectedConflict?.type})`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Identified Conflict</span>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{selectedConflict?.reason}</div>
            <div className="text-xs text-blue-600 font-mono mt-1">Exams: {selectedConflict?.affectedExams} • Resource: {selectedConflict?.roomGroup}</div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Evidence from Input Data</span>
            </h4>
            <p className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-slate-700 leading-relaxed">
              {selectedConflict?.evidence}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recommended Resolution Strategy</span>
            </h4>
            <p className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-900 leading-relaxed font-medium">
              {selectedConflict?.possibleSteps}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setSelectedConflict(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl"
            >
              Close Diagnostic
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
