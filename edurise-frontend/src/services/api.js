function normalizeApiBaseUrl(raw) {
  if (!raw) return 'http://localhost:5000/api';
  // Allow either "http://host:port" or "http://host:port/api"
  return raw.endsWith('/api') ? raw : `${raw.replace(/\/+$/, '')}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
console.log('[API] Using API_BASE_URL:', API_BASE_URL);

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Generic API call function
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('[API] Request:', url);
  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      ...options
    });

    if (!response.ok) {
      let error = { msg: `HTTP ${response.status}` };
      try {
        error = await response.json();
      } catch (e) {
        // Could not parse JSON error response
      }
      console.error('[API] Error response:', error);
      throw new Error(error.msg || 'Something went wrong');
    }

    const data = await response.json();
    console.log('[API] Success response:', data);
    return data;
  } catch (err) {
    console.error('[API] Request failed:', err);
    throw err;
  }
};

// Auth API calls
export const authAPI = {
  login: (email, password) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (name, email, password) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    }),

  getProfile: () => apiCall('/profile/me'),

  updateProfile: (profileData) => 
    apiCall('/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    }),

  getMatches: () => apiCall('/match'),

  getAllProfiles: () => apiCall('/profile/all')
};

// Session API calls
export const sessionAPI = {
  create: ({ skill, sessionType, scheduledDuration }) =>
    apiCall('/session/create', {
      method: 'POST',
      body: JSON.stringify({ skill, sessionType, scheduledDuration })
    }),

  book: ({ instructorId, skill, sessionType, scheduledDuration, scheduledAt, topic, tokenRate }) =>
    apiCall('/session/book', {
      method: 'POST',
      body: JSON.stringify({ instructorId, skill, sessionType, scheduledDuration, scheduledAt, topic, tokenRate })
    }),

  getActive: () => apiCall('/session/active'),

  getById: (id) => apiCall(`/session/${id}`),

  join: (id) => apiCall(`/session/${id}/join`, { method: 'PUT' }),

  end: (id, { feedback, notes } = {}) =>
    apiCall(`/session/${id}/end`, {
      method: 'PUT',
      body: JSON.stringify({ feedback, notes })
    }),

  getHistory: () => apiCall('/session/history')
};

// Connection API calls
export const connectionAPI = {
  request: (userId) =>
    apiCall(`/connection/request/${userId}`, { method: 'POST' }),

  accept: (requestId) =>
    apiCall(`/connection/accept/${requestId}`, { method: 'PUT' }),

  reject: (requestId) =>
    apiCall(`/connection/reject/${requestId}`, { method: 'PUT' }),

  getMine: () => apiCall('/connection/me')
};

// TDDS API calls (mock-friendly)
export const tddsAPI = {
  evaluate: ({ topic, transcript, sessionId }) =>
    apiCall('/tdds/evaluate', {
      method: 'POST',
      body: JSON.stringify({ topic, transcript, sessionId })
    }),
  me: () => apiCall('/tdds/me'),
  history: (limit = 20) => apiCall(`/tdds/history?limit=${encodeURIComponent(limit)}`),
  demo: ({ topic, transcript }) =>
    fetch(`${API_BASE_URL}/tdds/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, transcript })
    }).then(async (r) => {
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.msg || 'Something went wrong');
      }
      return r.json();
    })
};

export const notificationAPI = {
  listMine: (limit = 20) => apiCall(`/notification/me?limit=${encodeURIComponent(limit)}`),
  markRead: (id) => apiCall(`/notification/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiCall('/notification/read-all', { method: 'PUT' })
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Store user token and data
export const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Remove auth data
export const removeAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};