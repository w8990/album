// 社交服务
import { API_BASE_URL, handleApiError } from './config.js'
import authService from './authService.js'

class SocialService {
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
        headers: authService.getAuthHeaders()
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
            url: file.url.startsWith('http') ? file.url : `${API_BASE_URL.replace('/api', '')}${file.url}`,
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
      if (!authService.isLoggedIn()) {
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
          'Authorization': `Bearer ${authService.token}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success && data.success.length > 0) {
        // 转换为社交动态格式
        const newPost = {
          id: data.success[0].id,
          authorId: authService.user.id,
          author: authService.user.display_name,
          avatar: authService.user.avatar_url || '',
          content: postData.content || '',
          images: data.success.map(file => ({
            id: file.id,
            url: file.url.startsWith('http') ? file.url : `${API_BASE_URL.replace('/api', '')}${file.url}`,
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
      return handleApiError(error, '创建动态')
    }
  }

  // 点赞动态
  async togglePostLike(postId, isLiked) {
    try {
      if (!authService.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/social/files/${postId}/like`, {
        method: 'POST',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        throw new Error(data.error || '点赞失败')
      }
    } catch (error) {
      return handleApiError(error, '点赞操作')
    }
  }

  // 收藏动态
  async togglePostFavorite(postId, isFavorited) {
    try {
      if (!authService.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/social/files/${postId}/favorite`, {
        method: 'POST',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        throw new Error(data.error || '收藏失败')
      }
    } catch (error) {
      return handleApiError(error, '收藏操作')
    }
  }

  // 获取动态评论
  async getPostComments(postId) {
    try {
      const response = await fetch(`${API_BASE_URL}/social/files/${postId}/comments`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
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
      return handleApiError(error, '获取评论')
    }
  }

  // 添加评论
  async addPostComment(postId, content) {
    try {
      if (!authService.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/social/files/${postId}/comments`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
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
      return handleApiError(error, '添加评论')
    }
  }

  // 删除动态/文件
  async deletePost(postId) {
    try {
      if (!authService.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/files/${postId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success || response.ok) {
        return { success: true, message: '删除成功' }
      } else {
        throw new Error(data.error || data.message || '删除失败')
      }
    } catch (error) {
      return handleApiError(error, '删除文件')
    }
  }

  // 增加浏览量 - 调用真实API
  async incrementViews(fileId) {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}/view`, {
        method: 'POST',
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      return data.success ? { success: true } : { success: false, message: data.error }
    } catch (error) {
      return handleApiError(error, '记录浏览量')
    }
  }
}

export default new SocialService() 