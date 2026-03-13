import axios from "axios";
import { BASE_API_URL } from "../constants/labels";

const api = axios.create({
  baseURL: `${BASE_API_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
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
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrftoken" || name === "_csrf_token") {
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
      config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error),
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
      !originalRequest.url?.includes("/auth/refresh/")
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
        await api.post("/auth/refresh/");
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
  },
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
    municipality: "municipalities",
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
    [`get${capitalize(resource)}`]: (id) =>
      api.get(`/${resourcePlural}/${id}/`),
    [`create${capitalize(resource)}`]: (data) =>
      api.post(`/${resourcePlural}/`, data),
    [`update${capitalize(resource)}`]: (id, data) =>
      api.patch(`/${resourcePlural}/${id}/`, data),
    [`delete${capitalize(resource)}`]: (id) =>
      api.delete(`/${resourcePlural}/${id}/`),
  };
};

// ================== APIs ==================

export const initCSRF = () => api.get("/csrf/");

export const authAPI = {
  login: (email, password) => api.post("/auth/login/", { email, password }),
  logout: () => api.post("/auth/logout/"),
  refreshToken: () => api.post("/auth/refresh/"),
  requestInitialSetupOTP: (email) =>
    api.post("/auth/initial-setup/request-otp/", { email }),
  confirmInitialSetup: (email, otp, password, confirmPassword) =>
    api.post("/auth/initial-setup/confirm/", {
      email,
      otp,
      password,
      confirm_password: confirmPassword, // Backend expects snake_case
    }),
  requestPasswordReset: (email) =>
    api.post("/auth/password/reset/request/", { email }),
  confirmPasswordReset: (email, otp, newPassword) =>
    api.post("/auth/password/reset/confirm/", {
      email,
      otp,
      new_password: newPassword, // Backend expects snake_case
    }),
};

export const profileAPI = {
  getProfile: () => api.get("/profile/"),
  updateProfile: (data) => {
    if (data instanceof FormData) {
      return api.put("/profile/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put("/profile/", data);
  },
  changePassword: (oldPassword, newPassword, confirmNewPassword) =>
    api.post("/profile/password/", {
      old_password: oldPassword, // Backend expects snake_case
      new_password: newPassword, // Backend expects snake_case
      confirm_new_password: confirmNewPassword, // Backend expects snake_case
    }),
};

/**
 * Use createCRUDEndpoints result directly + add only resource-specific extras.
 * Never re-spread the already-spread keys — it creates a maintenance trap.
 *
 * Export pattern:
 *   export const fooAPI = {
 *     ...createCRUDEndpoints("foo"),
 *     specialAction: (id) => api.post(`/foos/${id}/action/`),
 *   };
 */

export const usersAPI = {
  ...createCRUDEndpoints("user"),
  archiveUser: (id) => api.patch(`/users/${id}/archive/`),
  restoreUser: (id) => api.patch(`/users/${id}/restore/`),
};

export const binsAPI = {
  ...createCRUDEndpoints("bin"),
};

export const vehiclesAPI = {
  ...createCRUDEndpoints("vehicle"),
};

export const municipalitiesAPI = {
  ...createCRUDEndpoints("municipality"),
};

export const landfillsAPI = {
  ...createCRUDEndpoints("landfill"),
};

/**
 * mapAPI is intentionally removed — it duplicated getBins / getVehicles /
 * getLandfills / getMunicipalities already present on the domain APIs above.
 * Import from the specific domain API instead:
 *   import { binsAPI } from "../services/api";
 *   binsAPI.getBins(params);
 */

export const activityLogAPI = {
  getActivityLog: () => api.get("/admin/activity-log/"),
};

export const adminStatsAPI = {
  getStats: () => api.get("/admin/stats/"),
};

export const plannerAPI = {
  getMunicipalities: (params) => api.get("/municipalities/", { params }),
  getLandfills: (params) => api.get("/landfills/", { params }),
  getVehicles: (params) => api.get("/vehicles/", { params }),
  getAvailableBins: (params) => api.get("/bins/available/", { params }),
  getScenarios: (params) => api.get("/scenarios/", { params }),
  getScenario: (id) => api.get(`/scenarios/${id}/`),
  createScenario: (data) => api.post("/scenarios/", data),
  updateScenario: (id, data) => api.patch(`/scenarios/${id}/`, data),
  deleteScenario: (id) => api.delete(`/scenarios/${id}/`),
  solveScenario: (id) => api.post(`/scenarios/${id}/solve/`),
  getSolutions: (params) => api.get("/solutions/", { params }),
  getSolution: (id) => api.get(`/solutions/${id}/`),
  getScenarioTemplates: (params) => api.get("/scenario-templates/", { params }),
  createScenarioTemplate: (data) => api.post("/scenario-templates/", data),
  updateScenarioTemplate: (id, data) =>
    api.patch(`/scenario-templates/${id}/`, data),
  deleteScenarioTemplate: (id) => api.delete(`/scenario-templates/${id}/`),
};

export const reportsAPI = {
  getReports: (params) => api.get("/reports/planner/", { params }),
  getReport: (id) => api.get(`/reports/planner/${id}/`),
  createPlan: (id) => api.post(`/reports/planner/${id}/plan/`),
  requestBin: (id, data) =>
    api.post(`/reports/planner/${id}/request-bin/`, data),
  submitCitizenReport: (data) =>
    api.post("/reports/submit/submit/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteReport: (id) => api.delete(`/reports/planner/${id}/`),
};

export const binRequestsAPI = {
  getRequests: (params) => api.get("/reports/bin-requests/", { params }),
  getRequest: (id) => api.get(`/reports/bin-requests/${id}/`),
  approveRequest: (id, data) =>
    api.post(`/reports/bin-requests/${id}/approve/`, data),
  rejectRequest: (id, data) =>
    api.post(`/reports/bin-requests/${id}/reject/`, data),
  deleteRequest: (id) => api.delete(`/reports/bin-requests/${id}/`),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get("/notifications/", { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllAsRead: () => api.post("/notifications/read-all/"),
  clearAll: () => api.delete("/notifications/clear-all/"),
};

export default api;
