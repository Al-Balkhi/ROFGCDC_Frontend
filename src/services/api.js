import axios from 'axios';

// Create axios instance with base URL from environment variable
const baseURL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Auto-refresh tokens on 401 (except refresh endpoint itself)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh/')
    ) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh/');
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ================== APIs ==================

export const authAPI = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  logout: () => api.post('/auth/logout/'),
  refreshToken: () => api.post('/auth/refresh/'),
  requestInitialSetupOTP: (email) =>
    api.post('/auth/initial-setup/request-otp/', { email }),
  confirmInitialSetup: (email, otp, password, confirmPassword) =>
    api.post('/auth/initial-setup/confirm/', {
      email,
      otp,
      password,
      confirm_password: confirmPassword,
    }),
  requestPasswordReset: (email) =>
    api.post('/auth/password/reset/request/', { email }),
  confirmPasswordReset: (email, otp, new_password) =>
    api.post('/auth/password/reset/confirm/', { email, otp, new_password }),
};

export const profileAPI = {
  getProfile: () => api.get('/profile/'),
  updateProfile: (data) => {
    if (data instanceof FormData) {
      return api.put('/profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put('/profile/', data);
  },
  changePassword: (old_password, new_password, confirm_new_password) =>
    api.post('/profile/password/', {
      old_password,
      new_password,
      confirm_new_password,
    }),
};

export const usersAPI = {
  getUsers: (params) => api.get('/users/', { params }),
  getUser: (id) => api.get(`/users/${id}/`),
  createUser: (data) => api.post('/users/', data),
  updateUser: (id, data) => api.patch(`/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/users/${id}/`),
  archiveUser: (id) => api.patch(`/users/${id}/archive/`),
  restoreUser: (id) => api.patch(`/users/${id}/restore/`),
};

export const binsAPI = {
  getBins: (params) => api.get('/bins/', { params }),
  getBin: (id) => api.get(`/bins/${id}/`),
  createBin: (data) => api.post('/bins/', data),
  updateBin: (id, data) => api.patch(`/bins/${id}/`, data),
  deleteBin: (id) => api.delete(`/bins/${id}/`),
};

export const vehiclesAPI = {
  getVehicles: (params) => api.get('/vehicles/', { params }),
  getVehicle: (id) => api.get(`/vehicles/${id}/`),
  createVehicle: (data) => api.post('/vehicles/', data),
  updateVehicle: (id, data) => api.patch(`/vehicles/${id}/`, data),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}/`),
};

export const municipalitiesAPI = {
  getMunicipalities: (params) => api.get('/municipalities/', { params }),
  getMunicipality: (id) => api.get(`/municipalities/${id}/`),
  createMunicipality: (data) => api.post('/municipalities/', data),
  updateMunicipality: (id, data) =>
    api.patch(`/municipalities/${id}/`, data),
  deleteMunicipality: (id) =>
    api.delete(`/municipalities/${id}/`),
};

export const landfillsAPI = {
  getLandfills: (params) => api.get('/landfills/', { params }),
  getLandfill: (id) => api.get(`/landfills/${id}/`),
  createLandfill: (data) => api.post('/landfills/', data),
  updateLandfill: (id, data) =>
    api.patch(`/landfills/${id}/`, data),
  deleteLandfill: (id) =>
    api.delete(`/landfills/${id}/`),
};

export const mapAPI = {
  getBins: (params) => api.get('/bins/', { params }),
  getVehicles: (params) => api.get('/vehicles/', { params }),
  getLandfills: (params) => api.get('/landfills/', { params }),
  getMunicipalities: (params) =>
    api.get('/municipalities/', { params }),
};

export const activityLogAPI = {
  getActivityLog: () => api.get('/admin/activity-log/'),
};

export const adminStatsAPI = {
  getStats: () => api.get('/admin/stats/'),
};

export const plannerAPI = {
  getMunicipalities: (params) =>
    api.get('/municipalities/', { params }),
  getLandfills: (params) =>
    api.get('/landfills/', { params }),
  getVehicles: (params) =>
    api.get('/vehicles/', { params }),
  getAvailableBins: (params) =>
    api.get('/bins/available/', { params }),
  getScenarios: (params) =>
    api.get('/scenarios/', { params }),
  getScenario: (id) =>
    api.get(`/scenarios/${id}/`),
  createScenario: (data) =>
    api.post('/scenarios/', data),
  updateScenario: (id, data) =>
    api.patch(`/scenarios/${id}/`, data),
  deleteScenario: (id) =>
    api.delete(`/scenarios/${id}/`),
  solveScenario: (id) =>
    api.post(`/scenarios/${id}/solve/`),
  getSolutions: (params) =>
    api.get('/solutions/', { params }),
  getSolution: (id) =>
    api.get(`/solutions/${id}/`),
};

export default api;