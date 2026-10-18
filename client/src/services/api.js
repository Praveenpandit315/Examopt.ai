// client/src/services/api.js
// Centralized API client with JWT bearer handling and clean error formatting

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('examopt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...getAuthHeader(),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    firebaseLogin: (payload) => request('/auth/firebase-login', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request('/auth/me'),
    getDemoAccounts: () => request('/auth/demo-accounts'),
  },

  // Admin Dashboard
  admin: {
    getStats: () => request('/admin/dashboard-stats'),
    getDbInspector: () => request('/admin/db-inspector'),
  },

  // University Data Hub (Master Data Ingestion)
  dataHub: {
    upload: (formData) => request('/data-hub/upload', { method: 'POST', body: formData }),
    commit: (batchId) => request('/data-hub/commit', { method: 'POST', body: JSON.stringify({ batchId }) }),
    getBatches: (limit = 20) => request(`/data-hub/batches?limit=${limit}`),
    getBatchDetails: (id) => request(`/data-hub/batches/${id}`),
    getColumnMappings: (entity) => request(`/data-hub/column-mappings/${entity}`),
    getTemplateDownloadUrl: (entity) => `/api/data-hub/templates/${entity}`,
  },

  // Exam Session Builder
  sessions: {
    previewScope: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/sessions/scope-preview${q ? `?${q}` : ''}`);
    },
    getAll: () => request('/sessions'),
    create: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    generate: (id, strategy = 'smart_backtracking') => request(`/sessions/${id}/generate`, { method: 'POST', body: JSON.stringify({ strategy }) }),
  },

  // Examinations
  exams: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/exams${q ? `?${q}` : ''}`);
    },
    getById: (id) => request(`/exams/${id}`),
    create: (examData) => request('/exams', { method: 'POST', body: JSON.stringify(examData) }),
    update: (id, examData) => request(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(examData) }),
    delete: (id) => request(`/exams/${id}`, { method: 'DELETE' }),
    getSubjects: () => request('/exams/subjects'),
  },

  // Rooms
  rooms: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/rooms${q ? `?${q}` : ''}`);
    },
    create: (roomData) => request('/rooms', { method: 'POST', body: JSON.stringify(roomData) }),
    update: (id, roomData) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(roomData) }),
    delete: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),
    addUnavailability: (data) => request('/rooms/unavailability', { method: 'POST', body: JSON.stringify(data) }),
    deleteUnavailability: (id) => request(`/rooms/unavailability/${id}`, { method: 'DELETE' }),
  },

  // Student Groups
  groups: {
    getAll: () => request('/groups'),
    create: (groupData) => request('/groups', { method: 'POST', body: JSON.stringify(groupData) }),
    update: (id, groupData) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(groupData) }),
    delete: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
    getOverlaps: () => request('/groups/overlaps'),
  },

  // Time Slots & Institutional Rules
  slots: {
    getAll: () => request('/slots'),
    create: (slotData) => request('/slots', { method: 'POST', body: JSON.stringify(slotData) }),
    update: (id, slotData) => request(`/slots/${id}`, { method: 'PUT', body: JSON.stringify(slotData) }),
    delete: (id) => request(`/slots/${id}`, { method: 'DELETE' }),
    getRules: () => request('/slots/rules'),
    updateRule: (id, ruleData) => request(`/slots/rules/${id}`, { method: 'PUT', body: JSON.stringify(ruleData) }),
  },

  // Schedules (Phase 2)
  schedules: {
    generate: (strategy) => request('/schedules/generate', { method: 'POST', body: JSON.stringify({ strategy }) }),
    getAll: () => request('/schedules'),
    getById: (id) => request(`/schedules/${id}`),
    publish: (id) => request(`/schedules/${id}/publish`, { method: 'POST' }),
    compare: () => request('/schedules/compare'),
  },

  // Exam Rescue Mode (Phase 3)
  rescue: {
    simulate: (disruption) => request('/rescue/simulate', { method: 'POST', body: JSON.stringify({ disruption }) }),
    approve: (payload) => request('/rescue/approve', { method: 'POST', body: JSON.stringify(payload) }),
  },

  // Student Portal
  student: {
    getTimetable: () => request('/student/timetable'),
    getDashboard: () => request('/student/dashboard'),
    getNotifications: () => request('/student/notifications'),
  },

  // AI Scheduling Copilot (Phase 5)
  ai: {
    ask: (query) => request('/ai/ask', { method: 'POST', body: JSON.stringify({ query }) }),
  },

  // Academic Data Management (Phase 2)
  academic: {
    getSummary: () => request('/academic/summary'),
    getDepartments: () => request('/academic/departments'),
    createDepartment: (data) => request('/academic/departments', { method: 'POST', body: JSON.stringify(data) }),
    updateDepartment: (id, data) => request(`/academic/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDepartment: (id) => request(`/academic/departments/${id}`, { method: 'DELETE' }),
    getPrograms: () => request('/academic/programs'),
    createProgram: (data) => request('/academic/programs', { method: 'POST', body: JSON.stringify(data) }),
    updateProgram: (id, data) => request(`/academic/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProgram: (id) => request(`/academic/programs/${id}`, { method: 'DELETE' }),
    getSubjects: () => request('/academic/subjects'),
    createSubject: (data) => request('/academic/subjects', { method: 'POST', body: JSON.stringify(data) }),
    updateSubject: (id, data) => request(`/academic/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSubject: (id) => request(`/academic/subjects/${id}`, { method: 'DELETE' }),
    getFaculty: () => request('/academic/faculty'),
    createFaculty: (data) => request('/academic/faculty', { method: 'POST', body: JSON.stringify(data) }),
    updateFaculty: (id, data) => request(`/academic/faculty/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteFaculty: (id) => request(`/academic/faculty/${id}`, { method: 'DELETE' }),
    getFacultyAvailability: (facultyId) => request(`/academic/faculty-availability${facultyId ? `?facultyId=${facultyId}` : ''}`),
    addFacultyAvailability: (data) => request('/academic/faculty-availability', { method: 'POST', body: JSON.stringify(data) }),
    deleteFacultyAvailability: (id) => request(`/academic/faculty-availability/${id}`, { method: 'DELETE' }),
    getBlocks: () => request('/academic/blocks'),
    createBlock: (data) => request('/academic/blocks', { method: 'POST', body: JSON.stringify(data) }),
    updateBlock: (id, data) => request(`/academic/blocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBlock: (id) => request(`/academic/blocks/${id}`, { method: 'DELETE' }),
  },

  // Exam Presets & Configs (Phase 3)
  presets: {
    getAll: () => request('/presets'),
    getById: (id) => request(`/presets/${id}`),
    create: (data) => request('/presets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/presets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/presets/${id}`, { method: 'DELETE' }),
  },

  // Seating Allocation (Phase 4)
  seating: {
    allocate: (scheduleId, options = {}) => request(`/seating/allocate/${scheduleId}`, { method: 'POST', body: JSON.stringify(options) }),
    getSummary: (scheduleId) => request(`/seating/schedule/${scheduleId}`),
    getAssignment: (assignmentId) => request(`/seating/assignment/${assignmentId}`),
    reassign: (data) => request('/seating/reassign', { method: 'PUT', body: JSON.stringify(data) }),
    getHallTicket: (studentProfileId) => request(`/seating/hall-ticket/${studentProfileId}`),
  },

  // Schedule History & Audit Logs (Phase 5)
  history: {
    getVersions: () => request('/history/versions'),
    getDiff: (v1, v2) => request(`/history/compare?v1=${v1}&v2=${v2}`),
    getAuditLogs: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/history/audit-logs${q ? `?${q}` : ''}`);
    },
  },
};
