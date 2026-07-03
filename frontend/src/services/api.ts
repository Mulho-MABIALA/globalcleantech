import axios from 'axios'

const TOKEN_KEY = 'gct_token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(err)
  }
)

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)
