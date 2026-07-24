function normalizeBaseUrl(url) {
  if (!url) return '';
  return String(url).replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
);

function buildQuery(params) {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

const requestCache = new Map();
const CACHE_DURATION = 2000;

/**
 * Reusable fetch helper for API requests
 */
async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isFormData = options.body instanceof FormData;
  const cacheKey = `${method}:${endpoint}`;

  // 1. Check cache for GET requests
  if (method === 'GET' && !options.signal) { // Don't cache if there's a custom abort signal for safety
    const cached = requestCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.promise;
    }
  } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    // Automatically invalidate cache after mutations
    requestCache.clear();
  }

  const promise = (async () => {
    const token = localStorage.getItem('vktori_token');
    
    const headers = {
      ...options.headers,
    };
    if (!isFormData) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (token && !token.startsWith('demo_')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (!isFormData && config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (options.responseType === 'blob') {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Download failed');
      }
      const blob = await response.blob();
      const headers = {};
      response.headers.forEach((val, key) => { headers[key] = val; });
      return { data: blob, headers };
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        const error = new Error(
          response.ok
            ? 'Invalid response from server'
            : (text.slice(0, 120) || `Request failed (${response.status})`)
        );
        error.status = response.status;
        throw error;
      }
    }

    if (!response.ok) {
      const msg = (data && data.message) || `Request failed (${response.status})`;
      const error = new Error(msg);
      error.status = response.status;
      throw error;
    }

    if (data && data.success === false) {
      const error = new Error(data.message || 'Request failed');
      error.status = response.status;
      throw error;
    }

    return data;
  })();

  // Store the promise in the cache if GET
  if (method === 'GET' && !options.signal) {
    requestCache.set(cacheKey, { promise, timestamp: Date.now() });
  }

  try {
    return await promise;
  } catch (err) {
    if (method === 'GET' && !options.signal) {
      requestCache.delete(cacheKey);
    }
    if (err.name === 'AbortError') {
      throw err; // Allow abort errors to propagate normally
    }
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      const wrapped = new Error(`Cannot reach the server. Is the API running at ${API_BASE_URL}?`);
      wrapped.cause = err;
      console.error(`API Error [${endpoint}]:`, wrapped);
      throw wrapped;
    }
    if (!err.status || err.status >= 500) {
      console.error(`API Error [${endpoint}]:`, err);
    }
    throw err;
  }
}

async function requestBlob(endpoint, options = {}) {
  const token = localStorage.getItem('vktori_token');
  const headers = {
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const config = {
    ...options,
    headers,
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  if (!response.ok) {
    let msg = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      msg = errJson?.message || msg;
    } catch {
      // ignore JSON parse errors for binary responses
    }
    const error = new Error(msg);
    error.status = response.status;
    throw error;
  }
  const blob = await response.blob();
  return {
    blob,
    filename: response.headers.get('x-filename') || null,
    contentType: response.headers.get('content-type') || null,
  };
}

export const authAPI = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: credentials,
  }),
  getMe: () => request('/auth/me'),
  changePassword: (body) => request('/auth/change-password', {
    method: 'PATCH',
    body,
  }),
};

export const dashboardAPI = {
  admin: () => request('/dashboard/admin'),
  partner: () => request('/dashboard/partner'),
  lawyer: () => request('/dashboard/lawyer'),
  paralegal: () => request('/dashboard/paralegal'),
  client: () => request('/dashboard/client'),
};

export const leadsAPI = {
  list: (params) => request(`/leads${buildQuery(params)}`),
  get: (id) => request(`/leads/${id}`),
  /** Public (no auth). Website Book Consultation form. */
  publicConsultation: (body) => request('/leads/public/consultation', { method: 'POST', body }),
  /** Public (no auth). Website Transmittal of Inquiry form. */
  publicInquiry: (body) => request('/leads/public/inquiry', { method: 'POST', body }),
  create: (body) => request('/leads', { method: 'POST', body }),
  update: (id, body) => request(`/leads/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
  convert: (id) => request(`/leads/${id}/convert`, { method: 'POST', body: {} }),
};

export const clientsAPI = {
  list: (params) => request(`/clients${buildQuery(params)}`),
  get: (id) => request(`/clients/${id}`),
  create: (body) => request('/clients', { method: 'POST', body }),
  update: (id, body) => request(`/clients/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
};

export const mattersAPI = {
  list: (params) => request(`/matters${buildQuery(params)}`),
  get: (id) => request(`/matters/${id}`),
  create: (body) => request('/matters', { method: 'POST', body }),
  update: (id, body) => request(`/matters/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/matters/${id}`, { method: 'DELETE' }),
};

export const activitiesAPI = {
  list: (params) => request(`/activities${buildQuery(params)}`),
  get: (id) => request(`/activities/${id}`),
  create: (body) => request('/activities', { method: 'POST', body }),
  update: (id, body) => request(`/activities/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/activities/${id}`, { method: 'DELETE' }),
};

export const documentsAPI = {
  list: (params) => request(`/documents${buildQuery(params)}`),
  get: (id) => request(`/documents/${id}`),
  download: (id) => requestBlob(`/documents/${id}/download`),
  create: (body) => request('/documents', { method: 'POST', body }),
  createBulk: (body) => request('/documents/bulk', { method: 'POST', body }),
  update: (id, body) => request(`/documents/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
};

export const communicationsAPI = {
  list: (params) => request(`/communications${buildQuery(params)}`),
  get: (id) => request(`/communications/${id}`),
  getThread: (id) => request(`/communications/thread/${id}`),
  create: (body) => request('/communications', { method: 'POST', body }),
  reply: (body) => request('/communications/reply', { method: 'POST', body }),
  markRead: (id) => request(`/communications/${id}/read`, { method: 'PATCH' }),
  markMatterRead: (matterId) => request(`/communications/matter/${matterId}/read`, { method: 'PATCH' }),
  update: (id, body) => request(`/communications/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/communications/${id}`, { method: 'DELETE' }),
};

export const billingAPI = {
  listInvoices: (params) => request(`/billing${buildQuery(params)}`),
  getInvoice: (id) => request(`/billing/${id}`),
  /** Authenticated PDF (use blob; do not open API URL directly). */
  downloadInvoicePdf: (id) => requestBlob(`/billing/${id}/pdf`),
  /** Authenticated Word (.docx) Draft (use blob for Word compatibility). */
  downloadInvoiceDocx: (id) => requestBlob(`/billing/${id}/docx`),
  createInvoice: (body) => request('/billing', { method: 'POST', body }),
  payInvoice: (id, body) => request(`/billing/${id}/pay`, { method: 'POST', body }),
  sendInvoice: (id) => request(`/billing/${id}/send`, { method: 'POST' }),
  updateInvoice: (id, body) => request(`/billing/${id}`, { method: 'PUT', body }),
  removeInvoice: (id) => request(`/billing/${id}`, { method: 'DELETE' }),
  
  // Trust Accounts
  listTrustAccounts: () => request('/billing/trust-accounts'),
  getTrustTransactions: (id) => request(`/billing/trust-accounts/${id}/transactions`),
  depositTrust: (body) => request('/billing/trust-accounts/deposit', { method: 'POST', body }),
  applyTrustToInvoice: (body) => request('/billing/trust-accounts/apply', { method: 'POST', body }),
};

export const draftsAPI = {
  list: (params) => request(`/drafts${buildQuery(params)}`),
  get: (id) => request(`/drafts/${id}`),
  create: (body) => request('/drafts', { method: 'POST', body }),
  update: (id, body) => request(`/drafts/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/drafts/${id}`, { method: 'DELETE' }),
  sign: (id, body) => request(`/drafts/${id}/sign`, { method: 'POST', body }),
  downloadPdf: (id) => requestBlob(`/drafts/${id}/pdf`),
  sendForSignature: (id, body) => request(`/drafts/${id}/send-signature`, { method: 'POST', body }),
  getSignatureRequest: (token) => request(`/drafts/signature-request/${token}`),
  completeSignature: (token, body) => request(`/drafts/signature-request/${token}/sign`, { method: 'POST', body }),
};

export const tasksAPI = {
  list: (params) => request(`/tasks${buildQuery(params)}`),
  get: (id) => request(`/tasks/${id}`),
  create: (body) => request('/tasks', { method: 'POST', body }),
  update: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body }),
  complete: (id) => request(`/tasks/${id}/complete`, { method: 'PATCH' }),
  reopen: (id) => request(`/tasks/${id}/reopen`, { method: 'PATCH' }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};

export const templatesAPI = {
  list: (params) => request(`/templates${buildQuery(params)}`),
  get: (id) => request(`/templates/${id}`),
  create: (body) => request('/templates', { method: 'POST', body }),
  update: (id, body) => request(`/templates/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/templates/${id}`, { method: 'DELETE' }),
  cloneToMatter: (body) => request('/templates/clone', { method: 'POST', body }),
  duplicate: (id) => request(`/templates/${id}/duplicate`, { method: 'POST', body: {} }),
};

export const documentCategoriesAPI = {
  list: (params) => request(`/settings/document-categories${buildQuery(params)}`),
  create: (body) => request('/settings/document-categories', { method: 'POST', body }),
  update: (id, body) => request(`/settings/document-categories/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/settings/document-categories/${id}`, { method: 'DELETE' }),
};

export const marketingAPI = {
  overview: () => request('/marketing/overview'),
  sources: () => request('/marketing/sources'),
  getSocialLinks: () => request('/public/social-links'),
  updateSocialLinks: (links) => request('/admin/social-links', { method: 'PUT', body: links }),
};

export const usersAPI = {
  list: () => request('/users'),
  get: (id) => request(`/users/${id}`),
  create: (body) => request('/users', { method: 'POST', body }),
  update: (id, body) => request(`/users/${id}`, { method: 'PUT', body }),
  resetPassword: (id, body) => request(`/users/${id}/reset-password`, { method: 'PATCH', body }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export const conflictsAPI = {
  check: (body) => request('/conflicts/check', { method: 'POST', body }),
  list: () => request('/conflicts'),
};

export const timersAPI = {
  start: (matter_id) => request('/timers/start', { method: 'POST', body: { matter_id } }),
  stop: (id) => request(`/timers/${id}/stop`, { method: 'POST' }),
  active: () => request('/timers/active'),
  list: (params) => request(`/timers${buildQuery(params)}`),
};

export const reportsAPI = {
  generate: (body) => request('/reports/generate', { method: 'POST', body }),
  list: () => request('/reports'),
  get: (id) => request(`/reports/${id}`),
  download: (id) => request(`/reports/${id}/download`, { method: 'GET', responseType: 'blob' }),
  marketing: () => request('/reports/marketing'),
};

export const calendarAPI = {
  list: (params) => request('/calendar', { params }),
  create: (data) => request('/calendar', { method: 'POST', body: data }),
  update: (id, data) => request(`/calendar/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/calendar/${id}`, { method: 'DELETE' }),
  acknowledge: (id) => request(`/calendar/${id}/acknowledge`, { method: 'PUT' }),
  getOutlookStatus: () => request('/calendar/outlook/status'),
  disconnectOutlook: () => request('/calendar/outlook/disconnect', { method: 'POST', body: {} }),
  listCategories: (params) => request(`/calendar/categories${buildQuery(params)}`),
  createCategory: (data) => request('/calendar/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/calendar/categories/${id}`, { method: 'PUT', body: data }),
  removeCategory: (id) => request(`/calendar/categories/${id}`, { method: 'DELETE' }),
};

export const notificationsAPI = {
  list: async () => {
    try {
      return await request('/notifications');
    } catch (e) {
      if (e?.status === 401 || e?.status === 403 || String(e?.message).toLowerCase().includes('authorized')) {
        return { success: true, data: [] };
      }
      throw e;
    }
  },
  markRead: async (id) => {
    try {
      return await request(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {
      if (e?.status === 401 || e?.status === 403 || String(e?.message).toLowerCase().includes('authorized')) {
        return { success: true, data: {} };
      }
      throw e;
    }
  },
  markAllRead: async () => {
    try {
      return await request('/notifications/read-all', { method: 'PATCH' });
    } catch (e) {
      if (e?.status === 401 || e?.status === 403 || String(e?.message).toLowerCase().includes('authorized')) {
        return { success: true, data: {} };
      }
      throw e;
    }
  },
  unreadCount: async () => {
    try {
      return await request('/notifications/unread-count');
    } catch (e) {
      if (e?.status === 401 || e?.status === 403 || String(e?.message).toLowerCase().includes('authorized')) {
        return { success: true, data: { unread_count: 0 } };
      }
      throw e;
    }
  },
  clearAll: async () => {
    try {
      return await request('/notifications', { method: 'DELETE' });
    } catch (e) {
      if (e?.status === 401 || e?.status === 403 || String(e?.message).toLowerCase().includes('authorized')) {
        return { success: true, data: {} };
      }
      throw e;
    }
  },
  remove: async (id) => {
    try {
      return await request(`/notifications/${id}`, { method: 'DELETE' });
    } catch (e) {
      if (e?.status === 401 || e?.status === 403 || String(e?.message).toLowerCase().includes('authorized')) {
        return { success: true, data: {} };
      }
      throw e;
    }
  },
};

export const searchAPI = {
  global: (q) => request(`/search?q=${encodeURIComponent(q)}`),
};

export const fortnoxAPI = {
  getConfig: () => request('/fortnox/config'),
  updateConfig: (body) => request('/fortnox/config', { method: 'POST', body }),
  testConnection: (body) => request('/fortnox/test', { method: 'POST', body }),
  postInvoice: (id) => request(`/fortnox/invoices/${id}/post`, { method: 'POST' }),
  syncInvoice: (id) => request(`/fortnox/invoices/${id}/sync`, { method: 'POST' }),
};

export default {
  request,
  auth: authAPI,
  search: searchAPI,
  fortnox: fortnoxAPI,
  dashboard: dashboardAPI,
  leads: leadsAPI,
  clients: clientsAPI,
  matters: mattersAPI,
  activities: activitiesAPI,
  documents: documentsAPI,
  documentCategories: documentCategoriesAPI,
  communications: communicationsAPI,
  billing: billingAPI,
  drafts: draftsAPI,
  templates: templatesAPI,
  tasks: tasksAPI,
  marketing: marketingAPI,
  users: usersAPI,
  conflicts: conflictsAPI,
  timers: timersAPI,
  reports: reportsAPI,
  calendar: calendarAPI,
  notifications: notificationsAPI,
  titanEmail: {
    getAccounts: () => request('/titan-email/accounts'),
    addAccount: (data) => request('/titan-email/accounts', { method: 'POST', body: data }),
    deleteAccount: (id) => request(`/titan-email/accounts/${id}`, { method: 'DELETE' }),
  },
  folders: {
    list: (params) => request('/folders', { params }),
    create: (data) => request('/folders', { method: 'POST', body: data }),
  },
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'PUT', body: data }),
    getCompanyProfile: () => request('/settings/company-profile'),
    updateCompanyProfile: (data) => request('/settings/company-profile', { method: 'PUT', body: data }),
    uploadLogo: (formData) => {
      const token = localStorage.getItem('vktori_token');
      return fetch(`${API_BASE_URL}/settings/company-profile/logo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }).then(r => r.json());
    },
    uploadLetterhead: (formData) => {
      const token = localStorage.getItem('vktori_token');
      return fetch(`${API_BASE_URL}/settings/company-profile/letterhead`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }).then(r => r.json());
    },
    removeLogo: () => {
      const token = localStorage.getItem('vktori_token');
      return fetch(`${API_BASE_URL}/settings/company-profile/logo`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
    },
    removeLetterhead: () => {
      const token = localStorage.getItem('vktori_token');
      return fetch(`${API_BASE_URL}/settings/company-profile/letterhead`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
    }
  },
  practiceAreas: {
    list: (params) => request(`/settings/practice-areas${buildQuery(params)}`),
    create: (data) => request('/settings/practice-areas', { method: 'POST', body: data }),
    update: (id, data) => request(`/settings/practice-areas/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/settings/practice-areas/${id}`, { method: 'DELETE' }),
  },
  customFields: {
    list: (params) => request(`/settings/custom-fields${buildQuery(params)}`),
    create: (data) => request('/settings/custom-fields', { method: 'POST', body: data }),
    update: (id, data) => request(`/settings/custom-fields/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/settings/custom-fields/${id}`, { method: 'DELETE' }),
  },
  courtForms: {
    // Templates
    listTemplates: (params) => request(`/court-forms/templates${buildQuery(params)}`),
    getTemplate: (id) => request(`/court-forms/templates/${id}`),
    uploadTemplate: (formData) => {
      const token = localStorage.getItem('vktori_token');
      return fetch(`${API_BASE_URL}/court-forms/templates/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }).then(r => r.json());
    },
    saveMappings: (id, mappings) => request(`/court-forms/templates/${id}/mappings`, { method: 'POST', body: { mappings } }),
    deleteTemplate: (id) => request(`/court-forms/templates/${id}`, { method: 'DELETE' }),
    // Prefill
    prefill: (matter_id) => request(`/court-forms/prefill?matter_id=${matter_id}`),
    // Drafts
    listDrafts: (params) => request(`/court-forms/drafts${buildQuery(params)}`),
    createDraft: (data) => request('/court-forms/drafts', { method: 'POST', body: data }),
    updateDraft: (id, data) => request(`/court-forms/drafts/${id}`, { method: 'PUT', body: data }),
    deleteDraft: (id) => request(`/court-forms/drafts/${id}`, { method: 'DELETE' }),
    // PDF Generation (returns a Blob)
    generatePdf: (draftId, data) => request(`/court-forms/generate/${draftId}`, { method: 'POST', body: data, responseType: 'blob' }),
  },
  superAdmin: {
    getDashboard: () => request('/super-admin/dashboard'),
    // Agencies CRUD
    listAgencies: (params) => request(`/super-admin/agencies${buildQuery(params)}`),
    createAgency: (data) => request('/super-admin/agencies', { method: 'POST', body: data }),
    updateAgency: (id, data) => request(`/super-admin/agencies/${id}`, { method: 'PUT', body: data }),
    deleteAgency: (id) => request(`/super-admin/agencies/${id}`, { method: 'DELETE' }),
    // Offices CRUD
    listOffices: (params) => request(`/super-admin/offices${buildQuery(params)}`),
    createOffice: (data) => request('/super-admin/offices', { method: 'POST', body: data }),
    updateOffice: (id, data) => request(`/super-admin/offices/${id}`, { method: 'PUT', body: data }),
    deleteOffice: (id) => request(`/super-admin/offices/${id}`, { method: 'DELETE' }),
    // Users CRUD
    listUsers: (params) => request(`/super-admin/users${buildQuery(params)}`),
    createUser: (data) => request('/super-admin/users', { method: 'POST', body: data }),
    updateUser: (id, data) => request(`/super-admin/users/${id}`, { method: 'PUT', body: data }),
    deleteUser: (id) => request(`/super-admin/users/${id}`, { method: 'DELETE' }),
    resetPassword: (id, newPassword) => request(`/super-admin/users/${id}/reset-password`, { method: 'PATCH', body: { newPassword } }),
    // Activity Logs
    listActivityLogs: (params) => request(`/super-admin/activity-logs${buildQuery(params)}`),
    // Settings
    getSettings: () => request('/super-admin/settings'),
    updateSettings: (data) => request('/super-admin/settings', { method: 'PUT', body: data }),
  },
  backOffice: {
    get: () => request('/dashboards/back-office'),
    addVendor: (data) => request('/dashboards/back-office/vendors', { method: 'POST', body: data }),
  },
  chat: {
    getContacts: () => request('/chat/contacts'),
    listConversations: () => request('/chat/conversations'),
    startPrivate: (targetUserId) => request('/chat/conversations/private', { method: 'POST', body: { targetUserId } }),
    getMessages: (conversationId, params) => request(`/chat/conversations/${conversationId}/messages${buildQuery(params)}`),
    sendMessage: (conversationId, text, attachments = []) => request(`/chat/conversations/${conversationId}/messages`, { method: 'POST', body: { text, attachments } }),
    markAsRead: (conversationId) => request(`/chat/conversations/${conversationId}/read`, { method: 'POST' }),
    uploadAttachment: (file) => {
      const formData = new FormData();
      formData.append('attachment', file);
      const token = localStorage.getItem('vktori_token');
      return fetch(`${API_BASE_URL}/chat/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }).then(r => r.json());
    }
  },
};

