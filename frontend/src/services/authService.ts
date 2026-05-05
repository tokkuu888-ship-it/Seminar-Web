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
    
    const token = response.data.access_token
    useAuthStore.getState().setToken(token)
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', response.data.refresh_token)
    
    return response.data
  },

  async register(userData: any) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async logout() {
    useAuthStore.getState().logout()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },
}
