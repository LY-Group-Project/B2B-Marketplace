import { create } from 'zustand';
import { persist } from 'zustand/middleware';


const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),

      login: (userData, token) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      // Check if user has specific role
      hasRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },

      // Check if user is vendor and approved
      isVendorApproved: () => {
        const user = get().user;
        return user?.role === 'vendor' && user?.vendorProfile?.isApproved;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;