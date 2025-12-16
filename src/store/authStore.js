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
          localStorage.removeItem('userRole');
          localStorage.removeItem('userActive');
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
          
          // Update localStorage
          localStorage.setItem('userRole', profileData.role);
          localStorage.setItem('userActive', profileData.is_active.toString());
          
          return { success: true, user: profileData };
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: error.response?.data?.detail || 'فشل جلب بيانات المستخدم',
          });
          return { success: false, error: error.response?.data?.detail };
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
        localStorage.setItem('userRole', profile.role);
        localStorage.setItem('userActive', profile.is_active.toString());
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
          
          // Update localStorage
          localStorage.setItem('userRole', profileData.role);
          localStorage.setItem('userActive', profileData.is_active.toString());
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

