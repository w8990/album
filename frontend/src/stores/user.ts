import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginForm, RegisterForm } from '../types/user'
import { authApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 设置认证信息
  const setAuth = (userData: User, authToken: string) => {
    user.value = userData
    token.value = authToken
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 从本地存储恢复用户信息
  const restoreAuth = () => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    
    if (savedUser && savedToken) {
      user.value = JSON.parse(savedUser)
      token.value = savedToken
    }
  }

  // 登录
  const login = async (loginForm: LoginForm) => {
    try {
      isLoading.value = true
      const response = await authApi.login(loginForm)
      
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.token)
        return { success: true, message: response.message }
      } else {
        return { success: false, message: response.error || '登录失败' }
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error || '登录失败' 
      }
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  const register = async (registerForm: RegisterForm) => {
    try {
      isLoading.value = true
      const response = await authApi.register(registerForm)
      
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.token)
        return { success: true, message: response.message }
      } else {
        return { success: false, message: response.error || '注册失败' }
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error || '注册失败' 
      }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      clearAuth()
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      if (response.success) {
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return response.data.user
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      clearAuth()
    }
  }

  return {
    // 状态
    user,
    token,
    isLoading,
    
    // 计算属性
    isAuthenticated,
    
    // 方法
    setAuth,
    clearAuth,
    restoreAuth,
    login,
    register,
    logout,
    getCurrentUser
  }
}) 