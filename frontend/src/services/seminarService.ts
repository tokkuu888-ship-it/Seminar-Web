import api from './api'
import { Seminar } from '../types/seminar'

export const seminarService = {
  async list() {
    const response = await api.get<Seminar[]>('/seminars')
    return response.data
  },

  async create(payload: Partial<Seminar>) {
    const response = await api.post<Seminar>('/seminars', payload)
    return response.data
  },
}
