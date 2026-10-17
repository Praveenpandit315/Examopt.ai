// client/src/pages/admin/UniversityDataHubPage.jsx
// University Data Hub: Ingest, Validate, and Preview University Master Data (CSV, XLSX, ZIP)

import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileSpreadsheet, 
  Archive, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  ChevronRight,
  Database,
  Building,
  GraduationCap,
  BookOpen,
  Users,
  DoorOpen,
  UserCheck,
  CalendarDays,
  FileCheck2,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Toast } from '../../components/Toast';

const TEMPLATE_CARDS = [
  { id: 'departments', name: 'Departments', icon: Building, desc: 'Academic departments, buildings, and HODs', ext: 'CSV' },
  { id: 'programs', name: 'Programs & Degrees', icon: GraduationCap, desc: 'BCA, B.Tech, M.Tech degrees and total semesters', ext: 'CSV' },
  { id: 'subjects', name: 'Subject Catalogue', icon: BookOpen, desc: 'Courses, credits, departments, and lab requirements', ext: 'CSV' },
  { id: 'students', name: 'Student Records', icon: Users, desc: 'Roll numbers, names, email, program, and sections', ext: 'CSV' },
  { id: 'enrollments', name: 'Course Enrollments', icon: FileCheck2, desc: 'Which specific student takes which paper per term', ext: 'CSV' },
  { id: 'rooms', name: 'Venues & Rooms', icon: DoorOpen, desc: 'Lecture halls, computer labs, and seating capacities', ext: 'CSV' },
  { id: 'faculty', name: 'Faculty Members', icon: UserCheck, desc: 'Professors, emails, designations, and departments', ext: 'CSV' },
  { id: 'faculty_availability', name: 'Faculty Availability', icon: CalendarDays, desc: 'Duty availability windows and unavailable slots', ext: 'CSV' }
];

export function UniversityDataHubPage() {
  const [selectedEntity, setSelectedEntity] = useState('auto');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stagedBatch, setStagedBatch] = useState(null);
  const [previewFilter, setPreviewFilter] = useState('all'); // 'all' | 'valid' | 'errors'
  const [committing, setCommitting] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await api.dataHub.getBatches(15);
      setBatches(res.batches || []);
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'zip'].includes(ext)) {
      setToast({ message: 'Invalid file format. Please upload .csv, .xlsx, or .zip archive', type: 'error' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'File exceeds 10MB maximum upload limit', type: 'error' });
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    if (selectedEntity !== 'auto') {
      formData.append('entityType', selectedEntity);
    }

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 150);

    try {
      const result = await api.dataHub.upload(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setStagedBatch(result);
      setToast({
        message: `Staged ${result.totalRecords} records (${result.validRecords} valid, ${result.errorRecords} errors)`,
        type: result.errorRecords === 0 ? 'success' : 'info'
      });
      loadBatches();
    } catch (err) {
      clearInterval(progressInterval);
      setToast({ message: err.message || 'File upload and staging failed', type: 'error' });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 400);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCommit = async () => {
    if (!stagedBatch || !stagedBatch.batchId) return;

    setCommitting(true);
    try {
      const res = await api.dataHub.commit(stagedBatch.batchId);
      const totalCommitted = Object.values(res.committedRecords || {}).reduce((a, b) => a + b, 0);
      setToast({
        message: `Successfully committed ${totalCommitted} university master records into database!`,
        type: 'success'
      });
      setStagedBatch(null);
      loadBatches();
    } catch (err) {
      setToast({ message: err.message || 'Commit failed', type: 'error' });
    } finally {
      setCommitting(false);
    }
  };

  const handleDownloadTemplate = (entityId) => {
    const url = api.dataHub.getTemplateDownloadUrl(entityId);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">University Data Hub</h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Master Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Import university master catalogues, enrollments, venues, and faculty once and reuse across examination sessions.
          </p>
        </div>

        {/* Master Bundle Download Button */}
        <button
          onClick={() => handleDownloadTemplate('bundle')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition shrink-0"
        >
          <Archive className="w-4 h-4" />
          <span>Download All Templates (.ZIP)</span>
        </button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Master Entities</span>
            <div className="text-lg font-bold text-slate-900">8 Supported</div>
            <span className="text-[10px] text-blue-600 font-medium">Depts, Progs, Courses...</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Clash Tracking</span>
            <div className="text-lg font-bold text-slate-900">Cross-Cohort</div>
            <span className="text-[10px] text-emerald-600 font-medium">Student IDs Preserved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">File Formats</span>
            <div className="text-lg font-bold text-slate-900">CSV, XLSX, ZIP</div>
            <span className="text-[10px] text-indigo-600 font-medium">Multi-Sheet & Zip Safe</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Security Mode</span>
            <div className="text-lg font-bold text-slate-900">Sanitized</div>
            <span className="text-[10px] text-amber-600 font-medium">No Formula Injection</span>
          </div>
        </div>
      </div>

      {/* Upload Dropzone Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Upload University Dataset</h2>
            <p className="text-xs text-slate-500">Staged and validated before writing to persistent database.</p>
          </div>

          {/* Entity Target Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Dataset Target:</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700 font-medium"
            >
              <option value="auto">Auto-Detect by Filename / Sheet</option>
              <option value="departments">Departments</option>
              <option value="programs">Programs & Degrees</option>
              <option value="subjects">Subjects & Courses</option>
              <option value="students">Student Master Records</option>
              <option value="enrollments">Course Enrollments</option>
              <option value="rooms">Rooms & Venues</option>
              <option value="faculty">Faculty Members</option>
              <option value="faculty_availability">Faculty Availability</option>
            </select>
          </div>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-600 bg-blue-50/50'
              : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.zip"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
              <UploadCloud className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Click to browse or drag and drop your university dataset here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports <span className="font-semibold text-slate-600">.CSV</span>, <span className="font-semibold text-slate-600">.XLSX</span> (multi-sheet), or <span className="font-semibold text-slate-600">.ZIP</span> archive containing datasets (Max 10MB)
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Auto-Validation
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Staging Preview
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Non-Destructive Upsert
              </span>
            </div>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Validating & Staging Records...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Staged Batch Preview Modal / Panel */}
      {stagedBatch && (
        <div className="bg-white rounded-3xl p-6 border-2 border-blue-500 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Import Preview: {stagedBatch.filename}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Batch Code: {stagedBatch.batchCode}
                </span>
              </div>
            </div>

            <button
              onClick={() => setStagedBatch(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Validation Metrics Pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Records</span>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{stagedBatch.totalRecords}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Valid Records</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">{stagedBatch.validRecords}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-600">Invalid Records</span>
              <p className="text-lg font-bold text-rose-700 mt-0.5">{stagedBatch.errorRecords}</p>
            </div>
          </div>

          {/* Validation Details Breakdown */}
          {stagedBatch.validationSets && stagedBatch.validationSets.map((vSet) => (
            <div key={vSet.filename} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  {vSet.filename} ({vSet.entityType})
                </span>
                <span className="text-slate-500 font-medium">
                  {vSet.validCount} Valid • {vSet.errorCount} Errors
                </span>
              </div>

              {/* Error Callouts if any */}
              {vSet.errors.length > 0 && (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {vSet.errors.map((err, i) => (
                    <div key={i} className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Row {err.rowIndex}: </span>
                        <span>{err.errors.join('; ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Valid Sample Preview */}
              {vSet.sampleValid.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        {Object.keys(vSet.sampleValid[0]).map((col) => (
                          <th key={col} className="px-3 py-2">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vSet.sampleValid.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx} className="px-3 py-1.5 text-slate-700 font-mono text-[11px] truncate max-w-[150px]">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Only valid records will be committed into persistent relational storage.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStagedBatch(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Discard Staging
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={committing || stagedBatch.validRecords === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {committing ? (
                  <span>Writing to Database...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Commit {stagedBatch.validRecords} Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8 Downloadable Template Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Standard University CSV Templates</h2>
          <span className="text-xs text-slate-400">Match schema foreign keys and column definitions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATE_CARDS.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <div
                key={tpl.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-600 flex items-center justify-center transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {tpl.ext}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {tpl.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadTemplate(tpl.id)}
                  className="w-full py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-xl border border-slate-100 group-hover:border-blue-200 transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Import History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Recent Master Data Imports</h2>
          </div>
          <button
            onClick={loadBatches}
            disabled={loadingBatches}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingBatches ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Batch Code</th>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Scope / Entity</th>
                <th className="px-4 py-3">Records (Valid/Err)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-xl">Committed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.length > 0 ? (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{b.batch_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{b.filename}</td>
                    <td className="px-4 py-3 font-mono text-[10px] uppercase text-slate-500">{b.file_type}</td>
                    <td className="px-4 py-3 text-slate-700 capitalize">{b.entity_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800">{b.total_records}</span>{' '}
                      <span className="text-[10px] text-slate-400">
                        (<span className="text-emerald-600">{b.valid_records}</span> /{' '}
                        <span className="text-rose-600">{b.error_records}</span>)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'committed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'staged'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {b.committed_at ? new Date(b.committed_at).toLocaleString() : 'Pending'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No import batches found. Upload your first dataset above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
