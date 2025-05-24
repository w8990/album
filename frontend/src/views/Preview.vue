<template>
  <div class="preview-container">
    <div class="preview-card">
      <!-- 返回按钮 -->
      <div class="preview-header">
        <el-button
          @click="router.back()"
          class="back-button"
          :icon="ArrowLeft"
        >
          返回
        </el-button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="error-state">
        <el-result
          icon="error"
          :title="error"
          :sub-title="'请检查文件是否存在或网络连接是否正常'"
        >
          <template #extra>
            <el-button type="primary" @click="loadFileInfo">
              重试
            </el-button>
          </template>
        </el-result>
      </div>

      <!-- 文件预览 -->
      <div v-else-if="fileInfo" class="preview-content">
        <!-- 预览区域 -->
        <div class="media-preview">
          <div class="media-container">
            <img
              v-if="isImage"
              :src="fileUrl"
              class="preview-image"
              :alt="fileInfo.originalname"
              @error="handleImageError"
              @load="handleImageLoad"
            >
            <video
              v-else
              :src="fileUrl"
              class="preview-video"
              controls
              @error="handleVideoError"
              @loadeddata="handleVideoLoad"
            ></video>
          </div>
        </div>

        <!-- 文件信息 -->
        <div class="file-info">
          <el-descriptions
            title="文件信息"
            :column="2"
            border
          >
            <el-descriptions-item label="文件名">
              {{ fileInfo.originalname }}
            </el-descriptions-item>
            <el-descriptions-item label="文件类型">
              {{ fileInfo.mimetype }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(fileInfo.size) }}
            </el-descriptions-item>
            <el-descriptions-item label="上传时间">
              {{ formatDate(fileInfo.created_at) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button
              type="primary"
              :icon="Download"
              @click="downloadFile"
            >
              下载文件
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              @click="confirmDelete"
            >
              删除文件
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
    >
      <span>确定要删除这个文件吗？此操作不可恢复。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteFile">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Download, Delete } from '@element-plus/icons-vue'
import { API_ENDPOINTS, API_BASE_URL } from '../config'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const fileInfo = ref<any>(null)
const deleteDialogVisible = ref(false)

// 计算文件URL
const fileUrl = computed(() => {
  if (!fileInfo.value) return ''
  return `${API_BASE_URL}${fileInfo.value.url}`
})

// 判断是否为图片
const isImage = computed(() => {
  if (!fileInfo.value) return false
  return fileInfo.value.mimetype.startsWith('image/')
})

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
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

// 加载文件信息
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
  } catch (err) {
    console.error('加载文件信息失败:', err)
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

// 下载文件
const downloadFile = () => {
  if (!fileInfo.value) return
  
  const link = document.createElement('a')
  link.href = fileUrl.value
  link.download = fileInfo.value.originalname
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 确认删除
const confirmDelete = () => {
  deleteDialogVisible.value = true
}

// 删除文件
const deleteFile = async () => {
  if (!fileInfo.value) return
  
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
    deleteDialogVisible.value = false
  }
}

// 处理图片加载
const handleImageLoad = () => {
  console.log('图片加载成功')
  error.value = ''
}

const handleVideoLoad = () => {
  console.log('视频加载成功')
  error.value = ''
}

const handleImageError = (e: Event) => {
  console.error('图片加载失败')
  error.value = '图片加载失败，请检查文件是否存在'
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const handleVideoError = (e: Event) => {
  console.error('视频加载失败')
  error.value = '视频加载失败，请检查文件是否存在'
  const video = e.target as HTMLVideoElement
  video.style.display = 'none'
}

// 页面加载时获取文件信息
onMounted(() => {
  if (!route.params.id) {
    error.value = '缺少文件ID'
    loading.value = false
    return
  }
  loadFileInfo()
})
</script>

<style scoped>
.preview-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.preview-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.preview-header {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.back-button {
  font-size: 16px;
}

.loading-state,
.error-state {
  padding: 40px;
}

.preview-content {
  padding: 20px;
}

.media-preview {
  margin-bottom: 30px;
}

.media-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  min-height: 400px;
}

.preview-image,
.preview-video {
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
}

.file-info {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .preview-container {
    padding: 10px;
  }
  
  .media-container {
    min-height: 300px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style> 