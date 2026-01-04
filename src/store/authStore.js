import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, profileAPI } from '../services/api';

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
          await authAPI.login(email, password);
          
          // Always fetch profile after successful login
          const profileResult = await get().fetchProfile();
          
          if (profileResult.success) {
            set({ isAuthenticated: true });
            return { success: true, user: profileResult.user };
          } else {
            set({
              isAuthenticated: false,
              user: null,
              loading: false,
              error: profileResult.error || 'فشل جلب بيانات المستخدم',
            });
            return { success: false, error: profileResult.error };
          }
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
          
          set({
            isAuthenticated: true,
            user: {
              id: profileData.id,
              email: profileData.email,
              username: profileData.username,
              role: profileData.role,
              image_profile: profileData.image_profile,
              phone: profileData.phone,
              is_active: profileData.is_active,
            },
            loading: false,
            error: null,
          });
          
          return { success: true, user: profileData };
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
        set({
          user: {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            role: profile.role,
            image_profile: profile.image_profile,
            phone: profile.phone,
            is_active: profile.is_active,
          },
        });
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      initialize: async () => {
        set({ loading: true });
        try {
          const response = await profileAPI.getProfile();
          const profileData = response.data;
          
          set({
            user: {
              id: profileData.id,
              email: profileData.email,
              username: profileData.username,
              role: profileData.role,
              image_profile: profileData.image_profile,
              phone: profileData.phone,
              is_active: profileData.is_active,
            },
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
        // Only persist non-sensitive data
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          username: state.user.username,
          role: state.user.role,
          image_profile: state.user.image_profile,
          phone: state.user.phone,
          is_active: state.user.is_active,
        } : null,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;

