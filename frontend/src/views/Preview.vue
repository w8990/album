<template>
  <div class="preview-container">
    <!-- 导航栏 -->
    <div class="preview-header">
      <div class="header-left">
        <el-button
          @click="router.back()"
          class="back-button"
          size="large"
          circle
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div class="header-info" v-if="fileInfo">
          <h1 class="file-title">{{ fileInfo.originalname }}</h1>
          <p class="file-subtitle">{{ formatFileSize(fileInfo.size) }} • {{ formatDate(fileInfo.created_at) }}</p>
        </div>
      </div>
      
      <div class="header-actions" v-if="fileInfo">
        <el-button-group>
          <el-button @click="downloadFile" size="large">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button @click="shareFile" size="large">
            <el-icon><Share /></el-icon>
            分享
          </el-button>
          <el-button type="danger" @click="confirmDelete" size="large">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="preview-main">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-content">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <p>正在加载文件...</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <el-icon class="error-icon"><WarningFilled /></el-icon>
          <h3>加载失败</h3>
          <p>{{ error }}</p>
          <el-button type="primary" @click="loadFileInfo" size="large">
            <el-icon><Refresh /></el-icon>
            重试
          </el-button>
        </div>
      </div>

      <!-- 文件预览区域 -->
      <div v-else-if="fileInfo" class="preview-content">
        <div class="media-section">
          <div class="media-container" :class="{ 'fullscreen': isFullscreen }">
            <!-- 图片预览 -->
            <div v-if="isImage" class="image-preview">
              <img
                :src="fileUrl"
                class="preview-image"
                :alt="fileInfo.originalname"
                @error="handleImageError"
                @load="handleImageLoad"
                :style="{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }"
              >
              
              <!-- 图片控制栏 -->
              <div class="image-controls">
                <el-button-group>
                  <el-button @click="zoomOut" :disabled="zoomLevel <= 0.5">
                    <el-icon><ZoomOut /></el-icon>
                  </el-button>
                  <el-button @click="resetZoom">
                    {{ Math.round(zoomLevel * 100) }}%
                  </el-button>
                  <el-button @click="zoomIn" :disabled="zoomLevel >= 3">
                    <el-icon><ZoomIn /></el-icon>
                  </el-button>
                  <el-button @click="rotateLeft">
                    <el-icon><RefreshLeft /></el-icon>
                  </el-button>
                  <el-button @click="rotateRight">
                    <el-icon><RefreshRight /></el-icon>
                  </el-button>
                  <el-button @click="toggleFullscreen">
                    <el-icon><FullScreen v-if="!isFullscreen" /><Aim v-else /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </div>

            <!-- 视频预览 -->
            <div v-else class="video-preview">
              <video
                ref="videoPlayer"
                :src="fileUrl"
                class="preview-video"
                controls
                @error="handleVideoError"
                @loadeddata="handleVideoLoad"
                @timeupdate="handleTimeUpdate"
              ></video>
              
              <!-- 视频信息 -->
              <div class="video-info" v-if="videoMetadata">
                <div class="video-stats">
                  <span>{{ formatDuration(videoMetadata.currentTime) }} / {{ formatDuration(videoMetadata.duration) }}</span>
                  <span>{{ videoMetadata.width }}x{{ videoMetadata.height }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏信息 -->
        <div class="info-sidebar">
          <div class="file-details-card">
            <h3>文件详情</h3>
            <div class="detail-item">
              <span class="label">文件名</span>
              <span class="value">{{ fileInfo.originalname }}</span>
            </div>
            <div class="detail-item">
              <span class="label">文件类型</span>
              <span class="value">{{ fileInfo.mimetype }}</span>
            </div>
            <div class="detail-item">
              <span class="label">文件大小</span>
              <span class="value">{{ formatFileSize(fileInfo.size) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">上传时间</span>
              <span class="value">{{ formatDate(fileInfo.created_at) }}</span>
            </div>
            <div class="detail-item" v-if="imageMetadata">
              <span class="label">图片尺寸</span>
              <span class="value">{{ imageMetadata.width }}x{{ imageMetadata.height }}</span>
            </div>
          </div>

          <!-- 操作面板 -->
          <div class="actions-card">
            <h3>操作</h3>
            <div class="action-buttons">
              <el-button type="primary" @click="downloadFile" class="action-btn">
                <el-icon><Download /></el-icon>
                下载文件
              </el-button>
              <el-button @click="copyLink" class="action-btn">
                <el-icon><Link /></el-icon>
                复制链接
              </el-button>
              <el-button @click="openInNewTab" class="action-btn">
                <el-icon><View /></el-icon>
                新标签页打开
              </el-button>
              <el-button type="danger" @click="confirmDelete" class="action-btn">
                <el-icon><Delete /></el-icon>
                删除文件
              </el-button>
            </div>
          </div>

          <!-- 相似文件推荐 -->
          <div class="related-files-card" v-if="relatedFiles.length > 0">
            <h3>相关文件</h3>
            <div class="related-files">
              <div 
                v-for="file in relatedFiles" 
                :key="file.id" 
                class="related-file"
                @click="navigateToFile(file.id)"
              >
                <img
                  v-if="file.mimetype.startsWith('image/')"
                  :src="file.url.startsWith('http') ? file.url : `${API_BASE_URL}${file.url}`"
                  class="related-thumbnail"
                  loading="lazy"
                >
                <div v-else class="related-placeholder">
                  <el-icon><VideoPlay /></el-icon>
                </div>
                <div class="related-info">
                  <p class="related-name">{{ truncateFileName(file.originalname) }}</p>
                  <p class="related-size">{{ formatFileSize(file.size) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
      class="delete-dialog"
    >
      <div class="delete-content">
        <el-icon class="delete-warning-icon"><WarningFilled /></el-icon>
        <h3>确定要删除这个文件吗？</h3>
        <p>此操作不可恢复，文件将被永久删除。</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteDialogVisible = false" size="large">取消</el-button>
          <el-button type="danger" @click="deleteFile" size="large" :loading="deleting">
            确认删除
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分享对话框 -->
    <el-dialog
      v-model="shareDialogVisible"
      title="分享文件"
      width="500px"
      class="share-dialog"
    >
      <div class="share-content">
        <h4>文件链接</h4>
        <el-input
          v-model="shareUrl"
          readonly
          class="share-input"
        >
          <template #append>
            <el-button @click="copyShareUrl">复制</el-button>
          </template>
        </el-input>
        
        <div class="share-options">
          <h4>分享到</h4>
          <div class="share-buttons">
            <el-button @click="shareToWeChat" class="share-btn">
              <el-icon><ChatDotSquare /></el-icon>
              微信
            </el-button>
            <el-button @click="shareToQQ" class="share-btn">
              <el-icon><Promotion /></el-icon>
              QQ
            </el-button>
            <el-button @click="shareToWeibo" class="share-btn">
              <el-icon><Star /></el-icon>
              微博
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Download, Delete, Share, Loading, WarningFilled, Refresh,
  ZoomIn, ZoomOut, RefreshLeft, RefreshRight, FullScreen, Aim,
  View, Link, VideoPlay, ChatDotSquare, Promotion, Star
} from '@element-plus/icons-vue'
import { API_ENDPOINTS, API_BASE_URL } from '../config'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const error = ref('')
const fileInfo = ref<any>(null)
const deleteDialogVisible = ref(false)
const shareDialogVisible = ref(false)
const deleting = ref(false)
const isFullscreen = ref(false)
const zoomLevel = ref(1)
const rotation = ref(0)
const videoPlayer = ref<HTMLVideoElement | null>(null)
const imageMetadata = ref<any>(null)
const videoMetadata = ref<any>(null)
const relatedFiles = ref<any[]>([])

// 计算属性
const fileUrl = computed(() => {
  if (!fileInfo.value) return ''
  
  const url = fileInfo.value.url
  // 如果已经是绝对URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 如果是相对路径，拼接API_BASE_URL
  return `${API_BASE_URL}${url}`
})

const isImage = computed(() => {
  if (!fileInfo.value) return false
  return fileInfo.value.mimetype.startsWith('image/')
})

const shareUrl = computed(() => {
  return window.location.href
})

// 工具函数
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const truncateFileName = (fileName: string, maxLength = 15) => {
  if (fileName.length <= maxLength) return fileName
  const ext = fileName.split('.').pop()
  const name = fileName.substring(0, fileName.lastIndexOf('.'))
  return `${name.substring(0, maxLength - 3 - (ext?.length || 0))}...${ext ? '.' + ext : ''}`
}

// 文件操作
const loadFileInfo = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const id = parseInt(route.params.id as string)
    if (isNaN(id)) {
      throw new Error('无效的文件ID')
    }

    const response = await fetch(API_ENDPOINTS.FILE(id))
    if (!response.ok) {
      throw new Error('获取文件信息失败')
    }

    const data = await response.json()
    if (!data) {
      throw new Error('文件不存在')
    }

    fileInfo.value = data
    await loadRelatedFiles()
  } catch (err) {
    console.error('加载文件信息失败:', err)
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const loadRelatedFiles = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.FILES)
    const allFiles = await response.json()
    
    // 过滤出相同类型的文件（除当前文件外）
    relatedFiles.value = allFiles
      .filter((file: any) => 
        file.id !== fileInfo.value.id && 
        file.mimetype.split('/')[0] === fileInfo.value.mimetype.split('/')[0]
      )
      .slice(0, 5) // 只取前5个
  } catch (error) {
    console.error('加载相关文件失败:', error)
  }
}

const downloadFile = () => {
  if (!fileInfo.value) return
  
  const link = document.createElement('a')
  link.href = fileUrl.value
  link.download = fileInfo.value.originalname
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('开始下载')
}

const confirmDelete = () => {
  deleteDialogVisible.value = true
}

const deleteFile = async () => {
  if (!fileInfo.value) return
  
  deleting.value = true
  
  try {
    const response = await fetch(API_ENDPOINTS.FILE(fileInfo.value.id), {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('删除文件失败')
    }
    
    ElMessage.success('文件已删除')
    router.push('/')
  } catch (err) {
    console.error('删除文件失败:', err)
    ElMessage.error('删除文件失败，请重试')
  } finally {
    deleting.value = false
    deleteDialogVisible.value = false
  }
}

// 图片操作
const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value = Math.min(3, zoomLevel.value + 0.25)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  rotation.value = 0
}

const rotateLeft = () => {
  rotation.value -= 90
}

const rotateRight = () => {
  rotation.value += 90
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

// 媒体事件处理
const handleImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  imageMetadata.value = {
    width: img.naturalWidth,
    height: img.naturalHeight
  }
}

const handleImageError = () => {
  error.value = '图片加载失败，请检查文件是否存在'
}

const handleVideoLoad = () => {
  if (videoPlayer.value) {
    videoMetadata.value = {
      duration: videoPlayer.value.duration,
      width: videoPlayer.value.videoWidth,
      height: videoPlayer.value.videoHeight,
      currentTime: 0
    }
  }
}

const handleVideoError = () => {
  error.value = '视频加载失败，请检查文件是否存在'
}

const handleTimeUpdate = () => {
  if (videoPlayer.value && videoMetadata.value) {
    videoMetadata.value.currentTime = videoPlayer.value.currentTime
  }
}

// 分享功能
const shareFile = () => {
  shareDialogVisible.value = true
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(fileUrl.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    ElMessage.success('分享链接已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const openInNewTab = () => {
  window.open(fileUrl.value, '_blank')
}

const navigateToFile = (fileId: number) => {
  router.push(`/preview/${fileId}`)
}

// 社交分享
const shareToWeChat = () => {
  ElMessage.info('请使用微信扫码分享功能')
}

const shareToQQ = () => {
  const url = encodeURIComponent(shareUrl.value)
  const title = encodeURIComponent(`查看文件: ${fileInfo.value?.originalname}`)
  window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`)
}

const shareToWeibo = () => {
  const url = encodeURIComponent(shareUrl.value)
  const title = encodeURIComponent(`查看文件: ${fileInfo.value?.originalname}`)
  window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`)
}

// 键盘事件处理
const handleKeydown = (e: KeyboardEvent) => {
  if (!fileInfo.value) return
  
  switch (e.key) {
    case 'Escape':
      if (isFullscreen.value) {
        toggleFullscreen()
      }
      break
    case '+':
    case '=':
      if (isImage.value) zoomIn()
      break
    case '-':
      if (isImage.value) zoomOut()
      break
    case '0':
      if (isImage.value) resetZoom()
      break
    case 'r':
    case 'R':
      if (isImage.value) rotateRight()
      break
  }
}

// 生命周期
onMounted(() => {
  if (!route.params.id) {
    error.value = '缺少文件ID'
    loading.value = false
    return
  }
  
  loadFileInfo()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (isFullscreen.value) {
    document.exitFullscreen?.()
  }
})
</script>

<style scoped>
/* 容器样式 */
.preview-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
}

/* 头部导航栏 */
.preview-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.back-button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.header-info {
  flex: 1;
  max-width: 400px;
}

.file-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-subtitle {
  font-size: 0.9rem;
  color: #718096;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
}

/* 主要内容区域 */
.preview-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  gap: 2rem;
}

/* 加载和错误状态 */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.loading-content,
.error-content {
  text-align: center;
  padding: 2rem;
}

.loading-icon {
  font-size: 4rem;
  color: #667eea;
  margin-bottom: 1rem;
  animation: spin 2s linear infinite;
}

.error-icon {
  font-size: 4rem;
  color: #f56565;
  margin-bottom: 1rem;
}

.loading-content p,
.error-content h3 {
  font-size: 1.2rem;
  color: #2d3748;
  margin: 0.5rem 0;
}

.error-content p {
  color: #718096;
  margin-bottom: 2rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 预览内容区域 */
.preview-content {
  display: flex;
  gap: 2rem;
  min-height: 70vh;
}

.media-section {
  flex: 1;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
}

.media-container {
  width: 100%;
  height: 100%;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  position: relative;
}

.media-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  border-radius: 0;
}

/* 图片预览 */
.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
  cursor: grab;
}

.preview-image:active {
  cursor: grabbing;
}

.image-controls {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-preview:hover .image-controls {
  opacity: 1;
}

.image-controls .el-button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  min-width: 40px;
  height: 40px;
  border-radius: 50%;
}

.image-controls .el-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 视频预览 */
.video-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
}

.video-info {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  backdrop-filter: blur(10px);
}

.video-stats {
  display: flex;
  gap: 1rem;
}

/* 侧边栏 */
.info-sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.file-details-card,
.actions-card,
.related-files-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.file-details-card h3,
.actions-card h3,
.related-files-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f7fafc;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-weight: 500;
  color: #4a5568;
  font-size: 0.9rem;
  min-width: 80px;
}

.detail-item .value {
  color: #2d3748;
  font-size: 0.9rem;
  text-align: right;
  word-break: break-word;
  max-width: 180px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-btn {
  width: 100%;
  justify-content: flex-start;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.action-btn.el-button--primary {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
}

.action-btn.el-button--primary:hover {
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.action-btn.el-button--danger {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  border: none;
  color: white;
}

.action-btn.el-button--danger:hover {
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
}

/* 相关文件 */
.related-files {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.related-file {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.related-file:hover {
  background: #e2e8f0;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.related-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.related-placeholder {
  width: 50px;
  height: 50px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.related-info {
  flex: 1;
  min-width: 0;
}

.related-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2d3748;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-size {
  font-size: 0.8rem;
  color: #718096;
  margin: 0;
}

/* 对话框样式 */
.delete-dialog,
.share-dialog {
  border-radius: 20px;
  overflow: hidden;
}

.delete-content {
  text-align: center;
  padding: 1rem 0;
}

.delete-warning-icon {
  font-size: 4rem;
  color: #f56565;
  margin-bottom: 1rem;
}

.delete-content h3 {
  font-size: 1.2rem;
  color: #2d3748;
  margin: 0 0 1rem 0;
}

.delete-content p {
  color: #718096;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* 分享对话框 */
.share-content {
  padding: 1rem 0;
}

.share-content h4 {
  font-size: 1rem;
  color: #2d3748;
  margin: 0 0 1rem 0;
}

.share-input {
  margin-bottom: 2rem;
}

.share-options {
  margin-top: 2rem;
}

.share-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.share-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  min-width: 80px;
  border: 1px solid #e2e8f0;
  background: white;
  transition: all 0.3s ease;
}

.share-btn:hover {
  background: #f8f9fa;
  border-color: #cbd5e0;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .preview-content {
    flex-direction: column;
  }

  .info-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    gap: 1rem;
  }

  .file-details-card,
  .actions-card,
  .related-files-card {
    min-width: 300px;
    flex-shrink: 0;
  }
}

@media (max-width: 768px) {
  .preview-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-left {
    justify-content: flex-start;
  }

  .header-actions {
    justify-content: center;
  }

  .file-title {
    font-size: 1.2rem;
  }

  .preview-main {
    padding: 1rem;
  }

  .info-sidebar {
    flex-direction: column;
  }

  .file-details-card,
  .actions-card,
  .related-files-card {
    min-width: auto;
  }

  .share-buttons {
    flex-direction: column;
    align-items: center;
  }

  .share-btn {
    width: 100%;
    max-width: 200px;
    flex-direction: row;
    justify-content: center;
  }

  .media-container {
    min-height: 40vh;
  }
}

@media (max-width: 480px) {
  .preview-header {
    padding: 0.75rem;
  }

  .file-title {
    font-size: 1.1rem;
  }

  .header-actions .el-button-group {
    flex-direction: column;
    width: 100%;
  }

  .header-actions .el-button {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .image-controls {
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.25rem;
  }

  .image-controls .el-button {
    min-width: 35px;
    height: 35px;
    font-size: 0.8rem;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .detail-item .value {
    text-align: left;
    max-width: 100%;
  }
}

/* 全屏模式样式 */
.media-container.fullscreen .image-controls {
  opacity: 1;
}

.media-container.fullscreen .preview-image {
  max-width: 90vw;
  max-height: 90vh;
}

/* 自定义滚动条 */
.info-sidebar::-webkit-scrollbar {
  height: 6px;
}

.info-sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.info-sidebar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.info-sidebar::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 焦点状态 */
.el-button:focus {
  outline: 2px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
}

/* 过渡动画 */
.preview-content {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 加载状态动画 */
.loading-content {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* 图片缩放拖拽效果 */
.preview-image[style*="scale"] {
  cursor: move;
}

/* 工具提示样式 */
.image-controls .el-button[title] {
  position: relative;
}

/* 视频播放器自定义样式 */
.preview-video::-webkit-media-controls {
  border-radius: 12px;
}

/* 错误状态特殊样式 */
.error-state {
  background: linear-gradient(135deg, #fff5f5, #fed7d7);
  border: 1px solid #feb2b2;
}

.error-content {
  background: white;
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 30px rgba(245, 101, 101, 0.1);
}
</style> 