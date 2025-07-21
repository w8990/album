import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginForm, RegisterForm } from '../types/user'
import { authApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 获取存储的token（优先从localStorage，其次从sessionStorage）
  const getStoredToken = (): string | null => {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  }

  // 获取存储的用户信息
  const getStoredUser = (): User | null => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  }

  // 初始化token
  token.value = getStoredToken()

  // 设置认证信息
  const setAuth = (userData: User, authToken: string, remember: boolean = false) => {
    user.value = userData
    token.value = authToken
    
    // 根据"记住我"选项选择存储方式
    const storage = remember ? localStorage : sessionStorage
    
    // 清除其他存储方式的数据
    if (remember) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    
    // 存储到指定位置
    storage.setItem('token', authToken)
    storage.setItem('user', JSON.stringify(userData))
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }

  // 从本地存储恢复用户信息
  const restoreAuth = () => {
    const savedUser = getStoredUser()
    const savedToken = getStoredToken()
    
    if (savedUser && savedToken) {
      user.value = savedUser
      token.value = savedToken
    }
  }

  // 登录
  const login = async (loginForm: LoginForm) => {
    try {
      isLoading.value = true
      const response = await authApi.login(loginForm)
      
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.token, loginForm.remember)
        
        // 登录成功后自动获取最新的用户信息
        try {
          await getCurrentUser()
        } catch (error) {
          console.warn('获取最新用户信息失败，使用登录返回的信息:', error)
        }
        
        return { success: true, message: response.message }
      } else {
        return { 
          success: false, 
          message: response.error || '登录失败',
          code: (response as any).code
        }
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error || '登录失败',
        code: error.response?.data?.code
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
        // 注册时默认记住用户
        setAuth(response.data.user, response.data.token, true)
        
        // 注册成功后自动获取最新的用户信息
        try {
          await getCurrentUser()
        } catch (error) {
          console.warn('获取最新用户信息失败，使用注册返回的信息:', error)
        }
        
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
        
        // 更新存储的用户信息（保持原有的存储方式）
        const currentToken = getStoredToken()
        if (localStorage.getItem('token') === currentToken) {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        } else if (sessionStorage.getItem('token') === currentToken) {
          sessionStorage.setItem('user', JSON.stringify(response.data.user))
        }
        
        return response.data.user
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      clearAuth()
    }
  }

  // 更新用户信息
  const updateUser = (userData: User) => {
    console.log('更新用户信息:', userData)
    user.value = userData
    
    // 更新存储的用户信息（保持原有的存储方式）
    const currentToken = getStoredToken()
    if (localStorage.getItem('token') === currentToken) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else if (sessionStorage.getItem('token') === currentToken) {
      sessionStorage.setItem('user', JSON.stringify(userData))
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
    getCurrentUser,
    updateUser
  }
}) 