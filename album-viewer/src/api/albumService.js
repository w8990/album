// 相册API服务
import { ElMessage } from 'element-plus'

// API配置
const API_BASE_URL = 'http://localhost:3000/api'

class AlbumService {
  constructor() {
    this.token = localStorage.getItem('auth_token') || null
    this.user = null
    this.initUser()
  }

  // ===================== 身份验证相关 =====================

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
      console.error('注册失败:', error)
      return { success: false, message: '网络错误，注册失败' }
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
      console.error('登录失败:', error)
      return { success: false, message: '网络错误，登录失败' }
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
      console.error('获取用户信息失败:', error)
      return { success: false, message: '网络错误' }
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
      console.error('更新用户信息失败:', error)
      return { success: false, message: '网络错误' }
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
      console.error('上传头像失败:', error)
      return { success: false, message: '网络错误，头像上传失败' }
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

  // ===================== 用户相关API =====================

  // 获取用户详情
  async getUserProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      console.error('获取用户详情失败:', error)
      return { success: false, message: '网络错误' }
    }
  }

  // 获取用户动态
  async getUserPosts(userId, params = {}) {
    try {
      const { page = 1, limit = 20 } = params
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })

      const response = await fetch(`${API_BASE_URL}/users/${userId}/posts?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      console.error('获取用户动态失败:', error)
      return { success: false, message: '网络错误' }
    }
  }

  // 获取用户收藏
  async getUserFavorites(userId, params = {}) {
    try {
      const { page = 1, limit = 20 } = params
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })

      const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      console.error('获取用户收藏失败:', error)
      return { success: false, message: '网络错误' }
    }
  }

  // 关注用户
  async followUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data, message: data.message } : { success: false, message: data.error }
    } catch (error) {
      console.error('关注用户失败:', error)
      return { success: false, message: '网络错误' }
    }
  }

  // 取消关注用户
  async unfollowUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data, message: data.message } : { success: false, message: data.error }
    } catch (error) {
      console.error('取消关注失败:', error)
      return { success: false, message: '网络错误' }
    }
  }

  // 获取关注列表
  async getFollowing(userId, params = {}) {
    try {
      const { page = 1, limit = 20 } = params
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })

      const response = await fetch(`${API_BASE_URL}/users/${userId}/following?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      console.error('获取关注列表失败:', error)
      return { success: false, message: '网络错误' }
    }
  }

  // 获取粉丝列表
  async getFollowers(userId, params = {}) {
    try {
      const { page = 1, limit = 20 } = params
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })

      const response = await fetch(`${API_BASE_URL}/users/${userId}/followers?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true, data: data.data } : { success: false, message: data.error }
    } catch (error) {
      console.error('获取粉丝列表失败:', error)
      return { success: false, message: '网络错误' }
    }
  }

  // ===================== 社交动态相关 =====================

  // 获取社交动态列表
  async getSocialPosts(params = {}) {
    const { page = 1, limit = 10, tab = 'recommend', search = '' } = params
    
    try {
      console.log('请求动态列表参数:', { page, limit, tab, search })
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (search) {
        queryParams.append('search', search)
      }

      const url = `${API_BASE_URL}/social/files?${queryParams}`
      console.log('请求URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('响应数据:', data)
      
      if (data && data.data && Array.isArray(data.data)) {
        // 将后端数据转换为前端格式
        const posts = data.data.map(file => ({
          id: file.id,
          authorId: file.user_id || 1,
          author: file.display_name || file.username || '用户',
          avatar: file.avatar_url || '',
          content: file.caption || '',
          images: [{
            id: file.id,
            url: `${API_BASE_URL.replace('/api', '')}${file.url}`,
            title: file.originalname,
            description: file.originalname
          }],
          tags: file.tags ? (Array.isArray(file.tags) ? file.tags : JSON.parse(file.tags || '[]')) : ['生活'],
          location: file.location || '',
          createdAt: new Date(file.created_at),
          likes: file.likes || 0,
          comments: file.comments || 0,
          shares: file.shares || 0,
          views: file.views || 0,
          isLiked: Boolean(file.isLiked),
          isFavorited: Boolean(file.isFavorited),
          latestComments: file.latestComments || []
        }))
        
        console.log('转换后的数据:', posts)
        
        return {
          success: true,
          data: {
            posts,
            total: data.pagination.total,
            page: data.pagination.page,
            limit: data.pagination.limit,
            hasMore: data.pagination.page < data.pagination.totalPages
          }
        }
      } else {
        throw new Error('API响应格式错误')
      }
    } catch (error) {
      console.error('获取动态列表失败:', error)
      return { success: false, message: '获取动态列表失败: ' + error.message }
    }
  }

  // 创建新动态
  async createPost(postData) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      if (!postData.images || postData.images.length === 0) {
        throw new Error('请选择要上传的图片')
      }
      
      const formData = new FormData()
      
      // 添加所有图片文件
      postData.images.forEach((image) => {
        if (image.raw) {
          formData.append('files', image.raw)
        }
      })

      // 添加其他数据
      if (postData.content) formData.append('caption', postData.content)
      if (postData.tags && postData.tags.length > 0) {
        postData.tags.forEach(tag => formData.append('tags', tag))
      }
      if (postData.location) formData.append('location', postData.location)
      if (postData.privacy_level) formData.append('privacy_level', postData.privacy_level)
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success && data.success.length > 0) {
        // 转换为社交动态格式
        const newPost = {
          id: data.success[0].id,
          authorId: this.user.id,
          author: this.user.display_name,
          avatar: this.user.avatar_url || '',
          content: postData.content || '',
          images: data.success.map(file => ({
            id: file.id,
            url: `${API_BASE_URL.replace('/api', '')}${file.url}`,
            title: file.originalname,
            description: file.originalname
          })),
          tags: postData.tags || [],
          location: postData.location || '',
          createdAt: new Date(),
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          isLiked: false,
          isFavorited: false,
          latestComments: []
        }
        
        return { success: true, data: newPost }
      } else {
        throw new Error(data.error || data.message || '上传失败')
      }
    } catch (error) {
      console.error('创建动态失败:', error)
      return { success: false, message: '创建动态失败: ' + error.message }
    }
  }

  // 点赞动态
  async togglePostLike(postId, isLiked) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/social/files/${postId}/like`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        throw new Error(data.error || '点赞失败')
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      return { success: false, message: '点赞操作失败: ' + error.message }
    }
  }

  // 收藏动态
  async togglePostFavorite(postId, isFavorited) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/social/files/${postId}/favorite`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        throw new Error(data.error || '收藏失败')
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      return { success: false, message: '收藏操作失败: ' + error.message }
    }
  }

  // 获取动态评论
  async getPostComments(postId) {
    try {
      const response = await fetch(`${API_BASE_URL}/social/files/${postId}/comments`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      
      // 转换评论格式以适配前端
      const comments = data.data.map(comment => ({
        id: comment.id,
        postId: postId,
        author: comment.display_name || comment.username || comment.user_name,
        authorId: comment.user_id,
        content: comment.content,
        createdAt: new Date(comment.created_at),
        likes: 0,
        isLiked: false
      }))

      return { success: true, data: comments }
    } catch (error) {
      console.error('获取评论失败:', error)
      return { success: false, message: '获取评论失败: ' + error.message }
    }
  }

  // 添加评论
  async addPostComment(postId, content) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/social/files/${postId}/comments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ content })
      })

      const data = await response.json()
      
      if (data.success) {
        // 转换评论格式
        const newComment = {
          id: data.data.id,
          postId: parseInt(postId),
          author: data.data.display_name || data.data.username,
          authorId: data.data.user_id,
          content: data.data.content,
          createdAt: new Date(data.data.created_at),
          likes: 0,
          isLiked: false
        }
        return { success: true, data: newComment }
      } else {
        throw new Error(data.error || '添加评论失败')
      }
    } catch (error) {
      console.error('添加评论失败:', error)
      return { success: false, message: '添加评论失败: ' + error.message }
    }
  }

  // 删除动态/文件
  async deletePost(postId) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/files/${postId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success || response.ok) {
        return { success: true, message: '删除成功' }
      } else {
        throw new Error(data.error || data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除文件失败:', error)
      return { success: false, message: '删除失败: ' + error.message }
    }
  }

  // ===================== 兼容旧接口 =====================
  async toggleLike(albumId, isLiked) { return this.togglePostLike(albumId, isLiked) }
  async toggleFavorite(albumId, isFavorited) { return this.togglePostFavorite(albumId, isFavorited) }
  async getComments(albumId) { return this.getPostComments(albumId) }
  async addComment(albumId, content) { return this.addPostComment(albumId, content) }

  // ===================== 相册管理API =====================
  
  // 创建相册
  async createAlbum(albumData) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      if (!albumData.name || !albumData.name.trim()) {
        return { success: false, message: '相册名称不能为空' }
      }

      const response = await fetch(`${API_BASE_URL}/albums`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          name: albumData.name.trim(),
          description: albumData.description?.trim() || '',
          privacy: albumData.privacy || 'public'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        return { 
          success: true, 
          data: data.data, 
          message: data.message || '相册创建成功' 
        }
      } else {
        return { success: false, message: data.error || '创建相册失败' }
      }
    } catch (error) {
      console.error('创建相册失败:', error)
      return { success: false, message: '网络错误，创建相册失败' }
    }
  }

  // 获取相册列表
  async getAlbums(params = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/albums`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        // 转换为前端需要的格式
        const albums = data.data.map(album => ({
          id: album.id,
          name: album.name,
          title: album.name, // 兼容字段
          description: album.description || '',
          cover: album.cover_url ? `${API_BASE_URL.replace('/api', '')}${album.cover_url}` : null,
          coverUrl: album.cover_url,
          fileCount: album.file_count || 0,
          photoCount: album.file_count || 0, // 兼容字段
          totalSize: album.total_size || 0,
          createdAt: album.created_at,
          updatedAt: album.updated_at,
          privacy: album.privacy || 'public' // 从后端获取或默认公开
        }))

        return { 
          success: true, 
          data: { 
            albums, 
            total: albums.length, 
            hasMore: false 
          } 
        }
      } else {
        return { success: false, message: data.error || '获取相册列表失败' }
      }
    } catch (error) {
      console.error('获取相册列表失败:', error)
      return { success: false, message: '网络错误，获取相册列表失败' }
    }
  }
  
  // 更新相册信息
  async updateAlbum(albumId, albumData) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/albums/${albumId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(albumData)
      })

      const data = await response.json()
      
      if (data.success) {
        return { 
          success: true, 
          message: data.message || '相册更新成功' 
        }
      } else {
        return { success: false, message: data.error || '更新相册失败' }
      }
    } catch (error) {
      console.error('更新相册失败:', error)
      return { success: false, message: '网络错误，更新相册失败' }
    }
  }

  // 删除相册
  async deleteAlbum(albumId) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/albums/${albumId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        return { 
          success: true, 
          message: data.message || '相册删除成功' 
        }
      } else {
        return { success: false, message: data.error || '删除相册失败' }
      }
    } catch (error) {
      console.error('删除相册失败:', error)
      return { success: false, message: '网络错误，删除相册失败' }
    }
  }
  
  // 获取单个相册详情
  async getAlbumById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/albums/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        const album = {
          id: data.data.id,
          name: data.data.name,
          title: data.data.name, // 兼容字段
          description: data.data.description || '',
          cover: data.data.cover_url ? `${API_BASE_URL.replace('/api', '')}${data.data.cover_url}` : null,
          fileCount: data.data.file_count || 0,
          photoCount: data.data.file_count || 0, // 兼容字段
          totalSize: data.data.total_size || 0,
          createdAt: data.data.created_at,
          updatedAt: data.data.updated_at,
          privacy: data.data.privacy || 'public'
        }

        return { success: true, data: album }
      } else {
        return { success: false, message: data.error || '相册不存在' }
      }
    } catch (error) {
      console.error('获取相册详情失败:', error)
      return { success: false, message: '获取相册详情失败' }
    }
  }

  // 获取相册中的文件
  async getAlbumFiles(albumId, params = {}) {
    try {
      const { page = 1, limit = 20 } = params
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        albumId: albumId === 'default' ? 'default' : albumId.toString()
      })

      const response = await fetch(`${API_BASE_URL}/files?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data }
      } else {
        return { success: false, message: data.error || '获取相册文件失败' }
      }
    } catch (error) {
      console.error('获取相册文件失败:', error)
      return { success: false, message: '网络错误，获取相册文件失败' }
    }
  }

  // 增加浏览量 - 模拟功能
  async incrementViews(albumId) {
    return { success: true }
  }
}

// 导出单例
export default new AlbumService() 