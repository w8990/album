// 认证服务
import { API_BASE_URL, handleApiError } from './config.js'

class AuthService {
  constructor() {
    this.token = localStorage.getItem('auth_token') || null
    this.user = null
    this.initUser()
  }

  // 设置认证令牌
  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  // 获取认证头
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  // 初始化用户信息
  async initUser() {
    if (this.token) {
      try {
        const result = await this.getCurrentUser()
        if (result.success) {
          this.user = result.data.user
        } else {
          this.setToken(null)
        }
      } catch (error) {
        console.error('初始化用户信息失败:', error)
        this.setToken(null)
      }
    }
  }

  // 用户注册
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (data.success) {
        this.setToken(data.data.token)
        this.user = data.data.user
        return { success: true, data: data.data, message: data.message }
      } else {
        return { success: false, message: data.error || '注册失败' }
      }
    } catch (error) {
      return handleApiError(error, '注册')
    }
  }

  // 用户登录
  async login(loginData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (data.success) {
        this.setToken(data.data.token)
        this.user = data.data.user
        return { success: true, data: data.data, message: data.message }
      } else {
        return { success: false, message: data.error || '登录失败' }
      }
    } catch (error) {
      return handleApiError(error, '登录')
    }
  }

  // 用户登出
  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        })
      }
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      this.setToken(null)
      this.user = null
    }
  }

  // 获取当前用户信息
  async getCurrentUser() {
    try {
      if (!this.token) {
        return { success: false, message: '未登录' }
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()

      if (data.success) {
        this.user = data.data.user
        return { success: true, data: data.data }
      } else {
        return { success: false, message: data.error || '获取用户信息失败' }
      }
    } catch (error) {
      return handleApiError(error, '获取用户信息')
    }
  }

  // 更新用户信息
  async updateProfile(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (data.success) {
        this.user = data.data.user
        return { success: true, data: data.data, message: data.message }
      } else {
        return { success: false, message: data.error || '更新失败' }
      }
    } catch (error) {
      return handleApiError(error, '更新用户信息')
    }
  }

  // 上传用户头像
  async uploadAvatar(file) {
    try {
      if (!this.token) {
        return { success: false, message: '请先登录' }
      }

      // 创建FormData
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        // 更新本地用户信息
        this.user = data.data.user
        return { 
          success: true, 
          data: data.data, 
          message: data.message || '头像上传成功' 
        }
      } else {
        return { success: false, message: data.error || '头像上传失败' }
      }
    } catch (error) {
      return handleApiError(error, '上传头像')
    }
  }

  // 检查是否已登录
  isLoggedIn() {
    return !!this.token && !!this.user
  }

  // 获取当前用户
  getUser() {
    return this.user
  }

  // 获取当前用户月度统计数据
  async getMonthlyStats() {
    try {
      const result = await this.getCurrentUser()
      if (result.success && result.data.stats) {
        const stats = result.data.stats
        
        // 基于真实数据进行月度估算
        const monthlyEstimate = {
          views: stats.views || 0, // 使用真实的总浏览量
          likes: Math.floor(stats.likes * 0.3), // 假设30%的点赞是本月获得的
          followers: Math.floor(stats.followers * 0.1), // 假设10%的粉丝是本月新增的
          uploads: Math.min(stats.posts, 10) // 本月上传数量，最多显示10个
        }
        
        return {
          success: true,
          data: monthlyEstimate
        }
      } else {
        return { success: false, message: '获取统计数据失败' }
      }
    } catch (error) {
      return handleApiError(error, '获取月度统计')
    }
  }
}

export default new AuthService() 