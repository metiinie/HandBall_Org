import axios from 'axios'
import router from '../router'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
export const BASE_SERVER_URL = API_URL.replace(/\/api$/, '')

// Create an Axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending and receiving HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for handling 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error is an authentication error and we are not already on the login page
    // ONLY redirect if the current route actually REQUIRES authentication
    if (error.response?.status === 401 && 
        router.currentRoute.value.name !== 'login' && 
        router.currentRoute.value.meta?.requiresAuth) {
      // The HttpOnly cookie is either missing or expired
      // Redirect to login page
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  }
)

export default api
