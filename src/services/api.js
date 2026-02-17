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

// Token refresh state management (Wait Queue pattern)
let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh completes.
 * Note: We use cookie-based auth, so we don't need to pass tokens.
 * The retry logic relies on cookies being set by the refresh endpoint.
 */
const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Resolve with null since we rely on cookie-based retry
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

/**
 * Extract CSRF token from cookies for Django/Rails style CSRF protection.
 * Django sets csrftoken cookie, Rails uses _csrf_token.
 */
const getCsrfToken = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken' || name === '_csrf_token') {
      return value;
    }
  }
  return null;
};

// Request interceptor - Add CSRF token to headers if available
api.interceptors.request.use(
  (config) => {
    // Add CSRF token to headers for Django/Rails CSRF protection
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
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
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject: () => reject(error),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh/');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ================== Helper Functions ==================

/**
 * Capitalizes the first letter of a string
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Helper function to get plural form of a resource.
 * 
 * Note: This is a simple implementation. For production apps with many
 * irregular plurals, consider using a library like 'pluralize':
 *   npm install pluralize
 *   import pluralize from 'pluralize';
 *   return pluralize(resource);
 */
const getPlural = (resource) => {
  const pluralMap = {
    municipality: 'municipalities',
    // Add other irregular plurals here as needed
  };
  return pluralMap[resource] || `${resource}s`;
};

/**
 * Factory function to create standard CRUD endpoints
 */
const createCRUDEndpoints = (resource) => {
  const resourcePlural = getPlural(resource);
  return {
    [`get${capitalize(resourcePlural)}`]: (params) =>
      api.get(`/${resourcePlural}/`, { params }),
    [`get${capitalize(resource)}`]: (id) => api.get(`/${resourcePlural}/${id}/`),
    [`create${capitalize(resource)}`]: (data) => api.post(`/${resourcePlural}/`, data),
    [`update${capitalize(resource)}`]: (id, data) =>
      api.patch(`/${resourcePlural}/${id}/`, data),
    [`delete${capitalize(resource)}`]: (id) => api.delete(`/${resourcePlural}/${id}/`),
  };
};

// ================== APIs ==================

export const initCSRF = () => api.get('/csrf/');

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
      confirm_password: confirmPassword, // Backend expects snake_case
    }),
  requestPasswordReset: (email) =>
    api.post('/auth/password/reset/request/', { email }),
  confirmPasswordReset: (email, otp, newPassword) =>
    api.post('/auth/password/reset/confirm/', {
      email,
      otp,
      new_password: newPassword, // Backend expects snake_case
    }),
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
  changePassword: (oldPassword, newPassword, confirmNewPassword) =>
    api.post('/profile/password/', {
      old_password: oldPassword, // Backend expects snake_case
      new_password: newPassword, // Backend expects snake_case
      confirm_new_password: confirmNewPassword, // Backend expects snake_case
    }),
};

// Create CRUD endpoints using factory function
const baseUsersAPI = createCRUDEndpoints('user');
export const usersAPI = {
  ...baseUsersAPI,
  // Rename methods to match existing API naming convention
  getUsers: baseUsersAPI.getUsers,
  getUser: baseUsersAPI.getUser,
  createUser: baseUsersAPI.createUser,
  updateUser: baseUsersAPI.updateUser,
  deleteUser: baseUsersAPI.deleteUser,
  // Additional methods specific to users
  archiveUser: (id) => api.patch(`/users/${id}/archive/`),
  restoreUser: (id) => api.patch(`/users/${id}/restore/`),
};

const baseBinsAPI = createCRUDEndpoints('bin');
export const binsAPI = {
  getBins: baseBinsAPI.getBins,
  getBin: baseBinsAPI.getBin,
  createBin: baseBinsAPI.createBin,
  updateBin: baseBinsAPI.updateBin,
  deleteBin: baseBinsAPI.deleteBin,
};

const baseVehiclesAPI = createCRUDEndpoints('vehicle');
export const vehiclesAPI = {
  getVehicles: baseVehiclesAPI.getVehicles,
  getVehicle: baseVehiclesAPI.getVehicle,
  createVehicle: baseVehiclesAPI.createVehicle,
  updateVehicle: baseVehiclesAPI.updateVehicle,
  deleteVehicle: baseVehiclesAPI.deleteVehicle,
};

const baseMunicipalitiesAPI = createCRUDEndpoints('municipality');
export const municipalitiesAPI = {
  getMunicipalities: baseMunicipalitiesAPI.getMunicipalities,
  getMunicipality: baseMunicipalitiesAPI.getMunicipality,
  createMunicipality: baseMunicipalitiesAPI.createMunicipality,
  updateMunicipality: baseMunicipalitiesAPI.updateMunicipality,
  deleteMunicipality: baseMunicipalitiesAPI.deleteMunicipality,
};

const baseLandfillsAPI = createCRUDEndpoints('landfill');
export const landfillsAPI = {
  getLandfills: baseLandfillsAPI.getLandfills,
  getLandfill: baseLandfillsAPI.getLandfill,
  createLandfill: baseLandfillsAPI.createLandfill,
  updateLandfill: baseLandfillsAPI.updateLandfill,
  deleteLandfill: baseLandfillsAPI.deleteLandfill,
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
  getScenarioTemplates: (params) =>
    api.get('/scenario-templates/', { params }),
  createScenarioTemplate: (data) =>
    api.post('/scenario-templates/', data),
  updateScenarioTemplate: (id, data) =>
    api.patch(`/scenario-templates/${id}/`, data),
  deleteScenarioTemplate: (id) =>
    api.delete(`/scenario-templates/${id}/`),
};

export default api;
