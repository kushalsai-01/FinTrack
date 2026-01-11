import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, accessToken, refreshToken } = response.data.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          })
          
          // Set default auth header
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error?.message || 'Login failed',
          }
        }
      },

      register: async (userData) => {
        try {
          const response = await api.post('/auth/register', userData)
          const { user, accessToken, refreshToken } = response.data.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          })
          
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error?.message || 'Registration failed',
          }
        }
      },

      logout: async () => {
        try {
          if (useAuthStore.getState().refreshToken) {
            await api.post('/auth/logout', {
              refreshToken: useAuthStore.getState().refreshToken,
            })
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          })
          delete api.defaults.headers.common['Authorization']
        }
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = useAuthStore.getState()
          if (!refreshToken) throw new Error('No refresh token')
          
          const response = await api.post('/auth/refresh', { refreshToken })
          const { accessToken } = response.data.data
          
          set({ accessToken })
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          
          return { success: true }
        } catch (error) {
          useAuthStore.getState().logout()
          return { success: false }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
