// client/src/pages/student/StudentExamDetailsPage.jsx
import React, { useState } from 'react';
import { FileText, MapPin, Clock, AlertCircle, CheckCircle2, ChevronRight, User } from 'lucide-react';

export function StudentExamDetailsPage() {
  const [selectedExam, setSelectedExam] = useState('CS101');

  const exams = [
    {
      code: 'CS101',
      name: 'Data Structures & Algorithms I',
      date: '15 April 2025',
      time: '09:00 AM - 11:00 AM',
      duration: '120 Minutes',
      venue: 'Room R101 (Block A - Lecture Hall 101)',
      seatingCapacity: '100 Seats',
      instructions: [
        'Mandatory student identification card required at entry.',
        'Non-programmable scientific calculators are permitted.',
        'Entry strictly closed 15 minutes after examination commencement.'
      ],
      changes: 'No modifications since initial schedule release.'
    },
    {
      code: 'CS102',
      name: 'Operating Systems & Concurrency',
      date: '16 April 2025',
      time: '12:00 PM - 02:00 PM',
      duration: '120 Minutes',
      venue: 'Room R102 (Block A - Lecture Hall 102)',
      seatingCapacity: '80 Seats',
      instructions: [
        'Carry physical blue or black ballpoint pens.',
        'Electronic devices, smartwatches, and phones must be deposited outside.'
      ],
      changes: 'No modifications.'
    },
    {
      code: 'EC101',
      name: 'Electronics & Circuit Theory',
      date: '17 April 2025',
      time: '12:00 PM - 01:30 PM',
      duration: '90 Minutes',
      venue: 'Room R203 (Block B - Seminar Hall)',
      seatingCapacity: '60 Seats',
      instructions: [
        'Graph sheets and formula handbooks will be provided by invigilator.'
      ],
      changes: 'Relocated from Room R101 to avoid overlap.'
    }
  ];

  const current = exams.find(e => e.code === selectedExam) || exams[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examination Paper Details</h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed venue rules, syllabus codes, and approved administrator guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Papers List */}
        <div className="md:col-span-4 space-y-2">
          {exams.map((ex) => (
            <div
              key={ex.code}
              onClick={() => setSelectedExam(ex.code)}
              className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                selectedExam === ex.code
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-blue-600">{ex.code}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                    {ex.date}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800 mt-1">{ex.name}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>

        {/* Paper Detail Card */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {current.code}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{current.name}</h2>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              Published & Confirmed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Date & Time</span>
              </span>
              <div className="font-bold text-slate-800">{current.date}</div>
              <div className="text-blue-600 font-mono text-[11px]">{current.time} ({current.duration})</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Venue Allocation</span>
              </span>
              <div className="font-bold text-slate-800">{current.venue}</div>
              <div className="text-slate-500 text-[11px]">Seating Capacity: {current.seatingCapacity}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Official Examination Instructions
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {current.instructions.map((ins, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
            <strong>Change History:</strong> {current.changes}
          </div>
        </div>
      </div>
    </div>
  );
}
