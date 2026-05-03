import api from './api'
import { useAuthStore } from '../store/authStore'

export const authService = {
  async login(email: string, password: string) {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    // Store token in auth store instead of localStorage
    useAuthStore.getState().setToken(response.data.access_token)
    
    return response.data
  },

  async register(userData: any) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async logout() {
    useAuthStore.getState().logout()
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },
}
