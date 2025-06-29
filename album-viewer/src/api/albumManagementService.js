// 相册管理服务
import { API_BASE_URL, handleApiError } from './config.js'
import authService from './authService.js'

class AlbumManagementService {
  // 创建相册
  async createAlbum(albumData) {
    try {
      if (!authService.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      if (!albumData.name || !albumData.name.trim()) {
        return { success: false, message: '相册名称不能为空' }
      }

      const response = await fetch(`${API_BASE_URL}/albums`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
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
      return handleApiError(error, '创建相册')
    }
  }

  // 获取相册列表
  async getAlbums(params = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/albums`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
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
      return handleApiError(error, '获取相册列表')
    }
  }
  
  // 更新相册信息
  async updateAlbum(albumId, albumData) {
    try {
      if (!authService.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/albums/${albumId}`, {
        method: 'PUT',
        headers: authService.getAuthHeaders(),
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
      return handleApiError(error, '更新相册')
    }
  }

  // 删除相册
  async deleteAlbum(albumId) {
    try {
      if (!authService.isLoggedIn()) {
        return { success: false, message: '请先登录' }
      }

      const response = await fetch(`${API_BASE_URL}/albums/${albumId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
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
      return handleApiError(error, '删除相册')
    }
  }
  
  // 获取单个相册详情
  async getAlbumById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/albums/${id}`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
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
      return handleApiError(error, '获取相册详情')
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
        headers: authService.getAuthHeaders()
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data }
      } else {
        return { success: false, message: data.error || '获取相册文件失败' }
      }
    } catch (error) {
      return handleApiError(error, '获取相册文件')
    }
  }
}

export default new AlbumManagementService() 