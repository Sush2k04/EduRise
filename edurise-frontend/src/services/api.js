const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    ...options
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Something went wrong');
  }

  return response.json();
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

  getMatches: () => apiCall('/match')
};

// Session API calls
export const sessionAPI = {
  create: ({ skill, sessionType, scheduledDuration }) =>
    apiCall('/session/create', {
      method: 'POST',
      body: JSON.stringify({ skill, sessionType, scheduledDuration })
    }),

  getActive: () => apiCall('/session/active'),

  join: (id) => apiCall(`/session/${id}/join`, { method: 'PUT' }),

  end: (id, { feedback, notes } = {}) =>
    apiCall(`/session/${id}/end`, {
      method: 'PUT',
      body: JSON.stringify({ feedback, notes })
    }),

  getHistory: () => apiCall('/session/history')
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