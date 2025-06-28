import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import albumService from '../api/albumService.js'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const initialized = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 初始化认证状态
  const initializeAuth = async () => {
    if (initialized.value) return
    
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('userInfo')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
        
        // 验证token是否有效
        const result = await albumService.getCurrentUser()
        if (!result.success) {
          clearAuth()
        } else {
          user.value = result.data.user
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error)
        clearAuth()
      }
    }
    
    initialized.value = true
  }

  // 设置认证信息
  const setAuth = (userData, authToken) => {
    user.value = userData
    token.value = authToken
    localStorage.setItem('auth_token', authToken)
    localStorage.setItem('userInfo', JSON.stringify(userData))
    albumService.setToken(authToken)
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('userInfo')
    albumService.setToken(null)
  }

  // 登录
  const login = async (loginData) => {
    try {
      isLoading.value = true
      const result = await albumService.login(loginData)
      
      if (result.success) {
        setAuth(result.data.user, result.data.token)
        return { success: true, message: result.message || '登录成功' }
      } else {
        return { success: false, message: result.message || '登录失败' }
      }
    } catch (error) {
      return { 
        success: false, 
        message: '网络错误，登录失败' 
      }
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  const register = async (registerData) => {
    try {
      isLoading.value = true
      const result = await albumService.register(registerData)
      
      if (result.success) {
        setAuth(result.data.user, result.data.token)
        return { success: true, message: result.message || '注册成功' }
      } else {
        return { success: false, message: result.message || '注册失败' }
      }
    } catch (error) {
      return { 
        success: false, 
        message: '网络错误，注册失败' 
      }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      await albumService.logout()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      clearAuth()
    }
  }

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      const result = await albumService.updateProfile(profileData)
      if (result.success) {
        user.value = result.data.user
        localStorage.setItem('userInfo', JSON.stringify(result.data.user))
        return { success: true, message: result.message }
      } else {
        return { success: false, message: result.message }
      }
    } catch (error) {
      return { 
        success: false, 
        message: '更新失败' 
      }
    }
  }

  return {
    // 状态
    user,
    token,
    isLoading,
    initialized,
    
    // 计算属性
    isAuthenticated,
    
    // 方法
    initializeAuth,
    setAuth,
    clearAuth,
    login,
    register,
    logout,
    updateProfile
  }
}) 