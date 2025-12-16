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
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and auto-refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Auto-refresh tokens on 401 errors (لكن لا تحاول عندما يكون الطلب نفسه هو /auth/refresh/)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh/')
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await api.post('/auth/refresh/');
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        const useAuthStore = (await import('../store/authStore')).default;
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // لو كان 401 قادم من /auth/refresh/ نفسه أو بعد فشل الـ refresh، لا تحاول مرة أخرى
    if (error.response?.status === 401 && originalRequest.url?.includes('/auth/refresh/')) {
      try {
        const useAuthStore = (await import('../store/authStore')).default;
        useAuthStore.getState().logout();
      } catch {
        // تجاهل أي خطأ في الـ logout
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Will be handled by components
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  logout: () => api.post('/auth/logout/'),
  refreshToken: () => api.post('/auth/refresh/'),
  requestInitialSetupOTP: (email) => api.post('/auth/initial-setup/request-otp/', { email }),
  confirmInitialSetup: (email, otp, password, confirmPassword) =>
    api.post('/auth/initial-setup/confirm/', { email, otp, password, confirm_password: confirmPassword }),
  requestPasswordReset: (email) => api.post('/auth/password/reset/request/', { email }),
  confirmPasswordReset: (email, otp, new_password) =>
    api.post('/auth/password/reset/confirm/', { email, otp, new_password }),
};

// Profile API functions
export const profileAPI = {
  getProfile: () => api.get('/profile/'),
  updateProfile: (data) => {
    // If data is FormData, let browser set Content-Type with boundary
    if (data instanceof FormData) {
      return api.put('/profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put('/profile/', data);
  },
  changePassword: (old_password, new_password, confirm_new_password) =>
    api.post('/profile/password/', { old_password, new_password, confirm_new_password }),
};

// Users API functions (Admin only)
export const usersAPI = {
  getUsers: (params) => api.get('/users/', { params }),
  getUser: (id) => api.get(`/users/${id}/`),
  createUser: (data) => api.post('/users/', data),
  updateUser: (id, data) => api.patch(`/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/users/${id}/`),
  archiveUser: (id) => api.patch(`/users/${id}/archive/`),
  restoreUser: (id) => api.patch(`/users/${id}/restore/`),
};

// Bins API functions (Admin only)
export const binsAPI = {
  getBins: (params) => api.get('/bins/', { params }),
  getBin: (id) => api.get(`/bins/${id}/`),
  createBin: (data) => api.post('/bins/', data),
  updateBin: (id, data) => api.patch(`/bins/${id}/`, data),
  deleteBin: (id) => api.delete(`/bins/${id}/`),
};

// Vehicles API functions (Admin only)
export const vehiclesAPI = {
  getVehicles: (params) => api.get('/vehicles/', { params }),
  getVehicle: (id) => api.get(`/vehicles/${id}/`),
  createVehicle: (data) => api.post('/vehicles/', data),
  updateVehicle: (id, data) => api.patch(`/vehicles/${id}/`, data),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}/`),
};

// Municipalities API functions (Admin only)
export const municipalitiesAPI = {
  getMunicipalities: (params) => api.get('/municipalities/', { params }),
  getMunicipality: (id) => api.get(`/municipalities/${id}/`),
  createMunicipality: (data) => api.post('/municipalities/', data),
  updateMunicipality: (id, data) => api.patch(`/municipalities/${id}/`, data),
  deleteMunicipality: (id) => api.delete(`/municipalities/${id}/`),
};

// Landfills API functions (Admin only)
export const landfillsAPI = {
  getLandfills: (params) => api.get('/landfills/', { params }),
  getLandfill: (id) => api.get(`/landfills/${id}/`),
  createLandfill: (data) => api.post('/landfills/', data),
  updateLandfill: (id, data) => api.patch(`/landfills/${id}/`, data),
  deleteLandfill: (id) => api.delete(`/landfills/${id}/`),
};

// Map data helpers
export const mapAPI = {
  getBins: (params) => api.get('/bins/', { params }),
  getVehicles: (params) => api.get('/vehicles/', { params }),
  getLandfills: (params) => api.get('/landfills/', { params }),
  getMunicipalities: (params) => api.get('/municipalities/', { params }),
};

// Activity Log API functions (Admin only)
export const activityLogAPI = {
  getActivityLog: () => api.get('/admin/activity-log/'),
};

// Admin Statistics API functions (Admin only)
export const adminStatsAPI = {
  getStats: () => api.get('/admin/stats/'),
};

// Planner APIs
export const plannerAPI = {
  getMunicipalities: (params) => api.get('/municipalities/', { params }),
  getLandfills: (params) => api.get('/landfills/', { params }),
  getVehicles: (params) => api.get('/vehicles/', { params }),
  getAvailableBins: (params) => api.get('/bins/available/', { params }),
  getScenarios: (params) => api.get('/scenarios/', { params }),
  getScenario: (id) => api.get(`/scenarios/${id}/`),
  createScenario: (data) => api.post('/scenarios/', data),
  updateScenario: (id, data) => api.patch(`/scenarios/${id}/`, data),
  deleteScenario: (id) => api.delete(`/scenarios/${id}/`),
  solveScenario: (id) => api.post(`/scenarios/${id}/solve/`),
  getSolutions: (params) => api.get('/solutions/', { params }),
  getSolution: (id) => api.get(`/solutions/${id}/`),
};

export default api;

