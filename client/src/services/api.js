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
};
