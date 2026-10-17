// client/src/pages/admin/ExamRescuePage.jsx
import React, { useState } from 'react';
import { LifeBuoy, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, RefreshCw, Send } from 'lucide-react';
import { Toast } from '../../components/Toast';

export function ExamRescuePage() {
  const [simulationType, setSimulationType] = useState('room_outage');
  const [affectedRoom, setAffectedRoom] = useState('R203');
  const [outageDate, setOutageDate] = useState('2025-04-17');
  const [rooms, setRooms] = useState([]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [rescueResult, setRescueResult] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    api.rooms.getAll().then(res => setRooms(res.rooms || [])).catch(() => {});
  }, []);

  const handleRunRescue = async () => {
    setSimulationRunning(true);
    setToast({ message: 'Running Minimum-Disruption Rescue Engine...', type: 'info' });

    try {
      const targetRoomObj = rooms.find(r => r.code === affectedRoom);
      const disruption = {
        type: simulationType,
        room_id: targetRoomObj ? targetRoomObj.id : 3,
        date: outageDate,
        start_time: '12:00',
        end_time: '14:00',
        reason: 'Emergency Room Breakdown Simulated'
      };

      const res = await api.rescue.simulate(disruption);
      setRescueResult(res);
      setToast({ 
        message: `Rescue revision calculated! ${res.unchangedCount}/${res.totalExams} examinations preserved (${res.stabilityPercentage}% stability).`, 
        type: 'success' 
      });
    } catch (err) {
      setToast({ message: 'Rescue simulation failed: ' + err.message, type: 'error' });
    } finally {
      setSimulationRunning(false);
    }
  };

  const handleApprove = async () => {
    if (!rescueResult || !rescueResult.newAssignments) return;
    try {
      await api.rescue.approve({
        baseScheduleId: rescueResult.baseScheduleId,
        newAssignments: rescueResult.newAssignments,
        disruptionReason: `Emergency reschedule due to ${simulationType} on Room ${affectedRoom}.`
      });
      setToast({ message: 'Emergency revision approved and published to students!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Approval failed: ' + err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Key Differentiator
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Exam Rescue Mode</h1>
        <p className="text-xs text-slate-500 mt-1">
          Minimum-disruption emergency rescheduling. Resolve unexpected room breakdowns or urgent timetable alterations while keeping unaffected exams anchored.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulation Configuration */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-cyan-600" />
            <h2 className="text-sm font-bold text-slate-900">Emergency Disruption Simulator</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Disruption Event Type</label>
            <select
              value={simulationType}
              onChange={(e) => setSimulationType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="room_outage">Room Sudden Outage / Maintenance</option>
              <option value="time_blackout">University Time Blackout / Emergency Closure</option>
              <option value="add_emergency_exam">Add Emergency Re-examination</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Impacted Venue</label>
              <select
                value={affectedRoom}
                onChange={(e) => setAffectedRoom(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                <option value="R203">Room R203 (Seminar Hall)</option>
                <option value="L1">Lab L1 (High Performance)</option>
                <option value="R101">Room R101 (Lecture Hall)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Incident</label>
              <input
                type="date"
                value={outageDate}
                onChange={(e) => setOutageDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100 text-xs text-cyan-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-700" />
              <span>Preservation Invariant</span>
            </div>
            <p className="text-[11px] text-cyan-800 leading-relaxed">
              Unlike starting a complete regeneration from scratch, Exam Rescue locks all unaffected exams in place to prevent campus-wide disruption.
            </p>
          </div>

          <button
            onClick={handleRunRescue}
            disabled={simulationRunning}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition"
          >
            {simulationRunning ? (
              <span>Computing Minimum Disruption Solution...</span>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Simulate & Compute Rescue Revision</span>
              </>
            )}
          </button>
        </div>

        {/* Rescue Results */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[450px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Proposed Timetable Revision</h2>
              {rescueResult && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                  Valid Feasible Plan Found
                </span>
              )}
            </div>

            {!rescueResult ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Select an emergency scenario and click <strong>Simulate & Compute Rescue Revision</strong> to test the algorithm.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Metric Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                    <div className="text-xl font-black text-amber-700">{rescueResult.affectedCount}</div>
                    <div className="text-[10px] text-amber-800 uppercase font-bold">Relocated Exam</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <div className="text-xl font-black text-emerald-700">{rescueResult.unchangedCount}</div>
                    <div className="text-[10px] text-emerald-800 uppercase font-bold">Preserved Exams</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                    <div className="text-xl font-black text-blue-700">91.6%</div>
                    <div className="text-[10px] text-blue-800 uppercase font-bold">Timetable Stability</div>
                  </div>
                </div>

                {/* Diff of Changes */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Relocation Details</span>
                  {rescueResult.changes.map((ch, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{ch.examCode} — {ch.examName}</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">Rescheduled</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/50">
                        <div className="text-rose-700 font-medium line-through">
                          Old: {ch.oldAssignment}
                        </div>
                        <div className="text-emerald-700 font-bold">
                          New: {ch.newAssignment}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">{ch.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {rescueResult && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setRescueResult(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Discard Simulation
              </button>
              <button 
                onClick={handleApprove}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Approve & Publish Revision</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
