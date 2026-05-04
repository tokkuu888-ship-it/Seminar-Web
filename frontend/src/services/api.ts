import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  const persistedToken = token || localStorage.getItem('access_token')

  if (persistedToken) {
    config.headers.Authorization = `Bearer ${persistedToken}`
  }
  return config
})

export default api
