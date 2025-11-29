import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mentor APIs
export const mentorApi = {
  getAll: () => apiClient.get('/api/mentors'),
  getById: (id) => apiClient.get(`/api/mentors/${id}`),
  create: (data) => apiClient.post('/api/mentors', data),
  update: (id, data) => apiClient.put(`/api/mentors/${id}`, data),
  delete: (id) => apiClient.delete(`/api/mentors/${id}`),
  getStats: (id) => apiClient.get(`/api/mentors/${id}/stats`),
};

// Session APIs
export const sessionApi = {
  getAll: (params) => apiClient.get('/api/sessions', { params }),
  getById: (id) => apiClient.get(`/api/sessions/${id}`),
  create: (formData) => {
    return apiClient.post('/api/sessions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => apiClient.put(`/api/sessions/${id}`, data),
  delete: (id) => apiClient.delete(`/api/sessions/${id}`),
};

// Evaluation APIs
export const evaluationApi = {
  startEvaluation: (sessionId) => 
    apiClient.post(`/api/evaluations/sessions/${sessionId}/evaluate`),
  getBySessionId: (sessionId) => 
    apiClient.get(`/api/evaluations/sessions/${sessionId}`),
  getById: (id) => apiClient.get(`/api/evaluations/${id}`),
  getSummary: (id) => apiClient.get(`/api/evaluations/${id}/summary`),
  getAll: (params) => apiClient.get('/api/evaluations', { params }),
};

export default apiClient;