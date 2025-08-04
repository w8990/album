import axios from 'axios'
import type { LoginForm, RegisterForm, AuthResponse } from '../types/user'
import { API_CONFIG, getApiUrl } from '../config/api'

// 创建axios实例
const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理token过期
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      // 可以在这里跳转到登录页面
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  // 用户登录
  async login(loginForm: LoginForm): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', loginForm)
    return data
  },

  // 用户注册
  async register(registerForm: RegisterForm): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', registerForm)
    return data
  },

  // 用户登出
  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<any> {
    const { data } = await api.get('/auth/me')
    return data
  },

  // 更新用户信息
  async updateProfile(profileData: any): Promise<any> {
    const { data } = await api.put('/auth/me', profileData)
    return data
  },

  // 修改密码
  async changePassword(passwordData: {
    currentPassword: string
    newPassword: string
  }): Promise<any> {
    const { data } = await api.put('/auth/password', passwordData)
    return data
  },

  // 忘记密码
  async forgotPassword(email: string): Promise<any> {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  // 重置密码
  async resetPassword(token: string, newPassword: string): Promise<any> {
    const { data } = await api.post('/auth/reset-password', { token, newPassword })
    return data
  },

  // 上传头像
  async uploadAvatar(formData: FormData): Promise<any> {
    const { data } = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  },
}

// 导出单独的函数供组件使用
export const login = authApi.login
export const register = authApi.register
export const logout = authApi.logout
export const getCurrentUser = authApi.getCurrentUser
export const updateUserProfile = authApi.updateProfile
export const changePassword = authApi.changePassword
export const forgotPassword = authApi.forgotPassword
export const resetPassword = authApi.resetPassword
export const uploadUserAvatar = authApi.uploadAvatar

export default api 