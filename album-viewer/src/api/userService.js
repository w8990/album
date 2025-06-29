// 用户服务
import { API_BASE_URL, handleApiError } from './config.js'
import authService from './authService.js'

class UserService {
  // 获取用户详情
  async getUserProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      return handleApiError(error, '获取用户详情')
    }
  }

  // 获取用户动态
  async getUserPosts(userId, params = {}) {
    try {
      const { page = 1, limit = 20 } = params
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })

      const response = await fetch(`${API_BASE_URL}/users/${userId}/posts?${queryParams}`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      return handleApiError(error, '获取用户动态')
    }
  }

  // 获取用户收藏
  async getUserFavorites(userId, params = {}) {
    try {
      const { page = 1, limit = 20 } = params
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })

      const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites?${queryParams}`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      return handleApiError(error, '获取用户收藏')
    }
  }

  // 关注用户
  async followUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
        method: 'POST',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data, message: data.message } : { success: false, message: data.error }
    } catch (error) {
      return handleApiError(error, '关注用户')
    }
  }

  // 取消关注用户
  async unfollowUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data, message: data.message } : { success: false, message: data.error }
    } catch (error) {
      return handleApiError(error, '取消关注')
    }
  }

  // 获取关注列表
  async getFollowing(userId, params = {}) {
    try {
      const { page = 1, limit = 20 } = params
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })

      const response = await fetch(`${API_BASE_URL}/users/${userId}/following?${queryParams}`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      return handleApiError(error, '获取关注列表')
    }
  }

  // 获取粉丝列表
  async getFollowers(userId, params = {}) {
    try {
      const { page = 1, limit = 20 } = params
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })

      const response = await fetch(`${API_BASE_URL}/users/${userId}/followers?${queryParams}`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      return handleApiError(error, '获取粉丝列表')
    }
  }

  // 获取用户统计数据
  async getUserStats(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/stats`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        return { success: false, message: data.error || '获取用户统计失败' }
      }
    } catch (error) {
      return handleApiError(error, '获取用户统计')
    }
  }
}

export default new UserService() 