import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, profileAPI } from '../services/api';

/**
 * Helper function to standardize user object shape and sanitize data.
 * Prevents DRY violations and ensures consistent user object structure.
 */
const sanitizeUser = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    username: data.username,
    role: data.role,
    image_profile: data.image_profile,
    phone: data.phone,
    is_active: data.is_active,
  };
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,

      // Actions
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const loginResponse = await authAPI.login(email, password);
          
          // Check if login response contains user data, otherwise fetch profile
          let userData = null;
          if (loginResponse?.data?.user || loginResponse?.data) {
            // If login endpoint returns user data, use it directly
            userData = loginResponse.data.user || loginResponse.data;
          } else {
            // Only fetch profile if login doesn't return user data
            const profileResult = await get().fetchProfile();
            if (profileResult.success) {
              userData = profileResult.user;
            } else {
              set({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: profileResult.error || 'فشل جلب بيانات المستخدم',
              });
              return { success: false, error: profileResult.error };
            }
          }

          const sanitizedUser = sanitizeUser(userData);
          set({
            isAuthenticated: true,
            user: sanitizedUser,
            loading: false,
            error: null,
          });
          
          return { success: true, user: sanitizedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.detail || 'فشل تسجيل الدخول';
          set({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout error:', error);
        } finally {
          set({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
          });
        }
      },

      fetchProfile: async () => {
        set({ loading: true });
        try {
          const response = await profileAPI.getProfile();
          const profileData = response.data;
          const sanitizedUser = sanitizeUser(profileData);
          
          set({
            isAuthenticated: true,
            user: sanitizedUser,
            loading: false,
            error: null,
          });
          
          return { success: true, user: sanitizedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.detail || 'فشل جلب بيانات المستخدم';
          set({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      setProfile: (profile) => {
        const sanitizedUser = sanitizeUser(profile);
        set({ user: sanitizedUser });
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      initialize: async () => {
        set({ loading: true });
        try {
          const response = await profileAPI.getProfile();
          const profileData = response.data;
          const sanitizedUser = sanitizeUser(profileData);
          
          set({
            user: sanitizedUser,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Security: Only persist minimal non-sensitive data
        // Do NOT persist PII like email, phone, username, image_profile
        isAuthenticated: state.isAuthenticated,
        // Only persist id and role for routing/permission checks if absolutely necessary
        user: state.user ? {
          id: state.user.id,
          role: state.user.role,
          // Note: is_active is not persisted as it should be checked on each session
        } : null,
      }),
    }
  )
);

export default useAuthStore;
