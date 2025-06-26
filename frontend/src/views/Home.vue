<template>
  <div class="home-container">
    <!-- 头部Hero区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="gradient-text">智能文件管理系统</span>
          </h1>
          <p class="hero-subtitle">
            安全、高效、智能的文件上传与管理解决方案
          </p>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">{{ files.length }}</span>
              <span class="stat-label">已上传文件</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ formatFileSize(totalSize) }}</span>
              <span class="stat-label">总存储空间</span>
            </div>
          </div>
        </div>
        <div class="hero-actions">
          <el-button 
            type="primary" 
            size="large" 
            @click="showUploadDialog = true" 
            class="action-button upload-btn"
          >
            <el-icon><Upload /></el-icon>
            快速上传
          </el-button>
          <el-button 
            size="large" 
            @click="scrollToFiles" 
            class="action-button browse-btn"
          >
            <el-icon><FolderOpened /></el-icon>
            浏览文件
          </el-button>
        </div>
      </div>
      <div class="hero-illustration">
        <div class="floating-cards">
          <div class="card card-1">
            <el-icon><Picture /></el-icon>
          </div>
          <div class="card card-2">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div class="card card-3">
            <el-icon><Document /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件管理区域 -->
    <div class="files-section" ref="filesSection" v-if="files.length > 0">
      <div class="section-header">
        <div class="header-left">
          <h2 class="section-title">文件管理</h2>
          <el-tag type="info" size="small">{{ filteredFiles.length }} 个文件</el-tag>
        </div>
        
        <!-- 搜索和筛选 -->
        <div class="header-center">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文件名..."
            class="search-input"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="filterType" placeholder="文件类型" class="filter-select" clearable>
            <el-option label="全部" value="" />
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
          </el-select>
        </div>

        <!-- 操作按钮 -->
        <div class="header-right">
          <el-button-group class="view-toggle">
            <el-button 
              :type="viewMode === 'grid' ? 'primary' : ''" 
              @click="viewMode = 'grid'"
              size="small"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button 
              :type="viewMode === 'list' ? 'primary' : ''" 
              @click="viewMode = 'list'"
              size="small"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
          
          <el-button 
            @click="toggleBatchMode"
            :type="isBatchMode ? 'danger' : 'primary'"
            class="batch-button"
            size="small"
          >
            <el-icon><Operation /></el-icon>
            {{ isBatchMode ? '退出批量' : '批量操作' }}
          </el-button>
          
          <template v-if="isBatchMode && selectedFiles.length > 0">
            <el-button type="primary" @click="toggleSelectAll" size="small">
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
            <el-button 
              type="danger" 
              @click="confirmBatchDelete"
              size="small"
            >
              删除 ({{ selectedFiles.length }})
            </el-button>
          </template>
        </div>
      </div>

      <!-- 文件列表 - 网格视图 -->
      <transition name="fade">
        <div v-if="viewMode === 'grid'" class="files-grid">
          <transition-group name="file-card" tag="div" class="grid-container">
            <div 
              v-for="file in filteredFiles" 
              :key="file.id" 
              class="file-card"
              :class="{ 
                'selected': selectedFiles.includes(file.id),
                'hover-enabled': !isBatchMode 
              }"
              @click="handleFileCardClick(file)"
            >
              <!-- 选择覆盖层 -->
              <div v-if="isBatchMode" class="select-overlay" @click.stop>
                <el-checkbox
                  v-model="selectedFiles"
                  :label="file.id"
                  size="large"
                />
              </div>

              <!-- 文件预览 -->
              <div class="file-preview">
                <div class="preview-container">
                  <img
                    v-if="file.mimetype.startsWith('image/')"
                    :src="`${API_BASE_URL}${file.url}`"
                    :alt="file.originalname"
                    class="preview-image"
                    loading="lazy"
                    @error="handleImageError"
                  >
                  <div v-else class="video-placeholder">
                    <el-icon class="video-icon"><VideoPlay /></el-icon>
                    <span class="file-type">{{ getFileExtension(file.originalname) }}</span>
                  </div>
                </div>
                
                <!-- 悬停操作 -->
                <div class="file-actions" v-if="!isBatchMode">
                  <el-button-group>
                    <el-button type="primary" @click.stop="previewFile(file)" size="small">
                      <el-icon><View /></el-icon>
                    </el-button>
                    <el-button @click.stop="downloadFile(file)" size="small">
                      <el-icon><Download /></el-icon>
                    </el-button>
                    <el-button type="danger" @click.stop="deleteFile(file)" size="small">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-button-group>
                </div>
              </div>

              <!-- 文件信息 -->
              <div class="file-info">
                <h4 class="file-name" :title="file.originalname">
                  {{ truncateFileName(file.originalname) }}
                </h4>
                <div class="file-meta">
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <span class="file-date">{{ formatDate(file.created_at) }}</span>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </transition>

      <!-- 文件列表 - 列表视图 -->
      <transition name="fade">
        <div v-if="viewMode === 'list'" class="files-table">
          <el-table 
            :data="filteredFiles" 
            class="modern-table"
            @selection-change="handleSelectionChange"
            :row-class-name="getRowClassName"
          >
            <el-table-column 
              v-if="isBatchMode" 
              type="selection" 
              width="55" 
              align="center"
            />
            <el-table-column label="预览" width="80" align="center">
              <template #default="{ row }">
                <div class="table-preview">
                  <img
                    v-if="row.mimetype.startsWith('image/')"
                    :src="`${API_BASE_URL}${row.url}`"
                    class="table-preview-img"
                    loading="lazy"
                  >
                  <el-icon v-else class="table-preview-icon"><VideoPlay /></el-icon>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="originalname" label="文件名" min-width="200">
              <template #default="{ row }">
                <div class="file-name-cell">
                  <span class="name">{{ row.originalname }}</span>
                  <span class="type">{{ row.mimetype }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="120" align="right">
              <template #default="{ row }">
                {{ formatFileSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="上传时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template #default="{ row }">
                <el-button-group>
                  <el-button type="primary" @click="previewFile(row)" size="small">
                    <el-icon><View /></el-icon>
                    预览
                  </el-button>
                  <el-button @click="downloadFile(row)" size="small">
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button type="danger" @click="deleteFile(row)" size="small">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </transition>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-illustration">
        <el-icon class="empty-icon"><FolderOpened /></el-icon>
      </div>
      <h3 class="empty-title">还没有上传任何文件</h3>
      <p class="empty-description">点击上面的"快速上传"按钮开始上传您的第一个文件</p>
      <el-button type="primary" @click="showUploadDialog = true" class="empty-action">
        <el-icon><Upload /></el-icon>
        立即上传
      </el-button>
    </div>

    <!-- 增强的上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="文件上传"
      width="800px"
      :close-on-click-modal="false"
      class="upload-dialog"
      @closed="handleDialogClosed"
    >
      <div class="upload-dialog-content">
        <!-- 上传区域 -->
        <div
          class="upload-zone"
          :class="{ 
            'is-dragging': isDragging, 
            'is-uploading': uploading,
            'has-files': uploadQueue.length > 0
          }"
          @dragenter.prevent="handleDragEnter"
          @dragleave.prevent="handleDragLeave"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <div class="upload-content" v-if="!uploading && uploadQueue.length === 0">
            <div class="upload-icon">
              <el-icon><CloudUpload /></el-icon>
            </div>
            <div class="upload-text">
              <h3>拖放文件到此处</h3>
              <p>或者点击下方按钮选择文件</p>
            </div>
            <el-button type="primary" @click="triggerFileInput" size="large" class="select-button">
              <el-icon><FolderOpened /></el-icon>
              选择文件
            </el-button>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/*,video/*"
              multiple
              @change="handleFileSelect"
            >
            <div class="upload-tips">
              <p>支持 PNG, JPG, GIF, MP4, WebM 等格式</p>
              <p>单个文件最大 100MB，支持批量上传</p>
            </div>
          </div>

          <!-- 上传队列 -->
          <div v-if="uploadQueue.length > 0 && !uploading" class="upload-queue">
            <div class="queue-header">
              <h3>准备上传 {{ uploadQueue.length }} 个文件</h3>
              <div class="queue-actions">
                <el-button @click="clearQueue" size="small">清空</el-button>
                <el-button type="primary" @click="startUpload" size="small">
                  开始上传
                </el-button>
              </div>
            </div>
            <div class="queue-list">
              <div v-for="(file, index) in uploadQueue" :key="index" class="queue-item">
                <div class="file-preview">
                  <img v-if="file.preview" :src="file.preview" class="preview-thumb">
                  <el-icon v-else class="file-icon"><Document /></el-icon>
                </div>
                <div class="file-details">
                  <p class="file-name">{{ file.name }}</p>
                  <p class="file-size">{{ formatFileSize(file.size) }}</p>
                </div>
                <el-button 
                  @click="removeFromQueue(index)" 
                  type="danger" 
                  size="small" 
                  text
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
          </div>

          <!-- 上传进度 -->
          <div v-if="uploading" class="upload-progress">
            <div class="progress-info">
              <h3>正在上传...</h3>
              <p>{{ currentUploadIndex + 1 }} / {{ uploadQueue.length }}</p>
            </div>
            <el-progress
              :percentage="uploadProgress"
              :status="uploadProgress === 100 ? 'success' : ''"
              :stroke-width="8"
              class="progress-bar"
            />
            <p class="progress-text">
              {{ uploadProgress === 100 ? '上传完成！' : `正在上传: ${currentFileName}` }}
            </p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL, API_ENDPOINTS } from '../config'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload, Picture, VideoPlay, Delete, FolderOpened, Search, Grid, List,
  Operation, View, Download, Document, Upload as CloudUpload, Close
} from '@element-plus/icons-vue'

const router = useRouter()
const files = ref<any[]>([])
const showUploadDialog = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const previewUrl = ref('')
const isImage = ref(true)
const selectedFiles = ref<number[]>([])
const isBatchMode = ref(false)
const viewMode = ref('grid')
const searchQuery = ref('')
const filterType = ref('')
const uploadQueue = ref<any[]>([])
const currentUploadIndex = ref(0)
const currentFileName = ref('')
const filesSection = ref<HTMLElement | null>(null)

// 计算属性
const totalSize = computed(() => {
  return files.value.reduce((total, file) => total + file.size, 0)
})

const filteredFiles = computed(() => {
  let result = files.value

  // 按搜索查询过滤
  if (searchQuery.value) {
    result = result.filter(file => 
      file.originalname.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 按文件类型过滤
  if (filterType.value) {
    result = result.filter(file => 
      file.mimetype.startsWith(filterType.value)
    )
  }

  return result
})

const isAllSelected = computed(() => {
  return filteredFiles.value.length > 0 && 
         selectedFiles.value.length === filteredFiles.value.length
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
    minute: '2-digit'
  })
}

const truncateFileName = (fileName: string, maxLength = 20) => {
  if (fileName.length <= maxLength) return fileName
  const ext = fileName.split('.').pop()
  const name = fileName.substring(0, fileName.lastIndexOf('.'))
  return `${name.substring(0, maxLength - 3 - (ext?.length || 0))}...${ext ? '.' + ext : ''}`
}

const getFileExtension = (fileName: string) => {
  return fileName.split('.').pop()?.toUpperCase() || 'FILE'
}

// 事件处理函数
const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const getRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

const handleSelectionChange = (selected: any[]) => {
  selectedFiles.value = selected.map(item => item.id)
}

const scrollToFiles = () => {
  if (files.value.length > 0 && filesSection.value) {
    filesSection.value.scrollIntoView({ behavior: 'smooth' })
  } else {
    showUploadDialog.value = true
  }
}

const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value
  if (!isBatchMode.value) {
    selectedFiles.value = []
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedFiles.value = []
  } else {
    selectedFiles.value = filteredFiles.value.map(file => file.id)
  }
}

const handleFileCardClick = (file: any) => {
  if (isBatchMode.value) {
    const index = selectedFiles.value.indexOf(file.id)
    if (index > -1) {
      selectedFiles.value.splice(index, 1)
    } else {
      selectedFiles.value.push(file.id)
    }
  } else {
    previewFile(file)
  }
}

const previewFile = (file: any) => {
  router.push(`/preview/${file.id}`)
}

const downloadFile = (file: any) => {
  const link = document.createElement('a')
  link.href = `${API_BASE_URL}${file.url}`
  link.download = file.originalname
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const deleteFile = async (file: any) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个文件吗？此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const response = await fetch(API_ENDPOINTS.FILE(file.id), {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('删除文件失败')
    }
    
    ElMessage.success('文件已删除')
    files.value = files.value.filter(f => f.id !== file.id)
    selectedFiles.value = selectedFiles.value.filter(id => id !== file.id)
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除文件失败:', err)
      ElMessage.error('删除文件失败，请重试')
    }
  }
}

const confirmBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await batchDelete()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('批量删除失败:', err)
      ElMessage.error('批量删除失败，请重试')
    }
  }
}

const batchDelete = async () => {
  let successCount = 0
  let failCount = 0
  
  for (const fileId of selectedFiles.value) {
    try {
      const response = await fetch(API_ENDPOINTS.FILE(fileId), {
        method: 'DELETE'
      })
      
      if (response.ok) {
        successCount++
      } else {
        failCount++
      }
    } catch (error) {
      failCount++
      console.error(`删除文件 ${fileId} 失败:`, error)
    }
  }
  
  if (successCount > 0) {
    ElMessage.success(`成功删除 ${successCount} 个文件`)
    files.value = files.value.filter(f => !selectedFiles.value.includes(f.id))
    selectedFiles.value = []
    isBatchMode.value = false
  }
  
  if (failCount > 0) {
    ElMessage.error(`${failCount} 个文件删除失败`)
  }
}

// 上传相关函数
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleDragEnter = (e: DragEvent) => {
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  isDragging.value = false
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    addFilesToQueue(Array.from(input.files))
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    addFilesToQueue(Array.from(event.dataTransfer.files))
  }
}

const addFilesToQueue = (files: File[]) => {
  const validFiles = files.filter(file => {
    const isImageOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/')
    const isValidSize = file.size <= 100 * 1024 * 1024 // 100MB
    
    if (!isImageOrVideo) {
      ElMessage.error(`文件 ${file.name} 不是图片或视频格式`)
      return false
    }
    
    if (!isValidSize) {
      ElMessage.error(`文件 ${file.name} 大小超过 100MB 限制`)
      return false
    }
    
    return true
  })

  if (validFiles.length === 0) return

  // 为图片文件生成预览
  validFiles.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = e.target?.result as string
        const fileWithPreview = Object.assign(file, { preview })
        uploadQueue.value.push(fileWithPreview)
      }
      reader.readAsDataURL(file)
    } else {
      uploadQueue.value.push(file)
    }
  })
}

const startUpload = async () => {
  if (uploadQueue.value.length === 0) return

  uploading.value = true
  uploadProgress.value = 0
  currentUploadIndex.value = 0
  
  let successCount = 0
  let failCount = 0
  
  for (let i = 0; i < uploadQueue.value.length; i++) {
    const file = uploadQueue.value[i]
    currentFileName.value = file.name
    currentUploadIndex.value = i
    
    const formData = new FormData()
    formData.append('files', file)
    
    try {
      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.success.length > 0) {
          successCount++
          files.value.unshift(result.success[0])
        } else {
          failCount++
          console.error(`上传文件 ${file.name} 失败:`, result.errors)
        }
      } else {
        failCount++
        const errorData = await response.json()
        console.error(`上传文件 ${file.name} 失败:`, errorData.error)
      }
    } catch (error) {
      failCount++
      console.error(`上传文件 ${file.name} 时发生错误:`, error)
    }
    
    // 更新进度
    uploadProgress.value = Math.round(((i + 1) * 100) / uploadQueue.value.length)
  }
  
  // 完成后的处理
  setTimeout(() => {
    uploading.value = false
    uploadProgress.value = 0
    uploadQueue.value = []
    showUploadDialog.value = false
    
    if (successCount > 0) {
      ElMessage.success(`成功上传 ${successCount} 个文件`)
      if (failCount > 0) {
        ElMessage.warning(`${failCount} 个文件上传失败`)
      }
    } else {
      ElMessage.error('所有文件上传失败')
    }
  }, 1500)
}

const clearQueue = () => {
  uploadQueue.value = []
}

const removeFromQueue = (index: number) => {
  uploadQueue.value.splice(index, 1)
}

const handleDialogClosed = () => {
  uploadQueue.value = []
  uploading.value = false
  uploadProgress.value = 0
  isDragging.value = false
  currentUploadIndex.value = 0
  currentFileName.value = ''
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 加载文件列表
const loadFiles = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.FILES)
    const data = await response.json()
    // 处理分页数据结构
    if (data.data && Array.isArray(data.data)) {
      files.value = data.data
    } else if (Array.isArray(data)) {
      files.value = data
    } else {
      files.value = []
    }
  } catch (error) {
    console.error('加载文件列表失败:', error)
    ElMessage.error('加载文件列表失败')
  }
}

// 页面加载时获取文件列表
onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
/* 全局样式重置和基础设置 */
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

/* Hero区域样式 */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80vh;
  padding: 4rem 2rem;
  color: white;
  position: relative;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  z-index: -1;
}

.hero-content {
  flex: 1;
  max-width: 600px;
  z-index: 2;
}

.hero-text {
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(45deg, #fff, #e0e7ff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.hero-subtitle {
  font-size: 1.3rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-stats {
  display: flex;
  gap: 3rem;
  margin-bottom: 3rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #fff;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.8;
  color: #e0e7ff;
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.upload-btn {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  border: none;
  color: white;
}

.upload-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
}

.browse-btn {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.browse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
}

/* Hero插图区域 */
.hero-illustration {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.floating-cards {
  position: relative;
  width: 300px;
  height: 300px;
}

.card {
  position: absolute;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  animation: float 6s ease-in-out infinite;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-1 {
  top: 20px;
  left: 50px;
  animation-delay: 0s;
}

.card-2 {
  top: 120px;
  right: 30px;
  animation-delay: 2s;
}

.card-3 {
  bottom: 40px;
  left: 20px;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

/* 文件管理区域 */
.files-section {
  background: white;
  margin: -4rem 2rem 2rem;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 150px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.view-toggle {
  margin-right: 1rem;
}

.batch-button {
  border-radius: 8px;
  transition: all 0.3s ease;
}

/* 文件网格视图 */
.files-grid {
  margin-top: 2rem;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.file-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
}

.file-card.hover-enabled:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.file-card.selected {
  border-color: #409eff;
  box-shadow: 0 8px 30px rgba(64, 158, 255, 0.3);
}

.select-overlay {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 3;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 0.5rem;
  backdrop-filter: blur(10px);
}

.file-preview {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
  background: #f8f9fa;
}

.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.file-card:hover .preview-image {
  transform: scale(1.05);
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.video-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.file-type {
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.9;
}

.file-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  padding: 0.5rem;
  backdrop-filter: blur(10px);
}

.file-card:hover .file-actions {
  opacity: 1;
}

.file-info {
  padding: 1.5rem;
}

.file-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #718096;
}

.file-size,
.file-date {
  display: inline-block;
}

/* 列表视图样式 */
.files-table {
  margin-top: 2rem;
}

.modern-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.table-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-preview-img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
}

.table-preview-icon {
  font-size: 1.5rem;
  color: #667eea;
}

.file-name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name-cell .name {
  font-weight: 600;
  color: #2d3748;
}

.file-name-cell .type {
  font-size: 0.8rem;
  color: #718096;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  margin: -4rem 2rem 2rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.empty-illustration {
  margin-bottom: 2rem;
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e0;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
}

.empty-description {
  color: #718096;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.empty-action {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 12px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* 上传对话框样式 */
.upload-dialog {
  border-radius: 20px;
  overflow: hidden;
}

.upload-dialog-content {
  padding: 1rem;
}

.upload-zone {
  border: 3px dashed #cbd5e0;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  transition: all 0.3s ease;
  background: #f8f9fa;
  position: relative;
}

.upload-zone.is-dragging {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  transform: scale(1.02);
}

.upload-zone.is-uploading {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
}

.upload-zone.has-files {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 4rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.upload-text h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.upload-text p {
  color: #718096;
  margin-bottom: 1.5rem;
}

.select-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 12px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.select-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.upload-tips {
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.upload-tips p {
  margin: 0.25rem 0;
  color: #4a5568;
  font-size: 0.9rem;
}

/* 上传队列样式 */
.upload-queue {
  margin-top: 2rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.queue-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.2rem;
}

.queue-actions {
  display: flex;
  gap: 0.5rem;
}

.queue-list {
  max-height: 200px;
  overflow-y: auto;
}

.queue-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  transition: background-color 0.2s ease;
}

.queue-item:hover {
  background: #e2e8f0;
}

.queue-item .file-preview {
  width: 50px;
  height: 50px;
  margin-right: 1rem;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
}

.preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 1.5rem;
  color: #667eea;
}

.file-details {
  flex: 1;
}

.file-details .file-name {
  margin: 0;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
}

.file-details .file-size {
  margin: 0;
  color: #718096;
  font-size: 0.8rem;
}

/* 上传进度样式 */
.upload-progress {
  text-align: center;
  padding: 2rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-info h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.2rem;
}

.progress-info p {
  margin: 0;
  color: #718096;
  font-weight: 600;
}

.progress-bar {
  margin: 1.5rem 0;
}

.progress-text {
  margin: 1rem 0 0 0;
  color: #718096;
  font-weight: 600;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.file-card-enter-active {
  transition: all 0.3s ease;
}

.file-card-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}

.file-card-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.file-card-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.file-card-move {
  transition: transform 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding: 3rem 1rem;
  }

  .hero-illustration {
    margin-top: 2rem;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-center {
    margin: 1rem 0;
  }

  .header-right {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .action-button {
    width: 100%;
    max-width: 300px;
  }

  .files-section {
    margin: -2rem 1rem 1rem;
    padding: 1rem;
  }

  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .header-center {
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .upload-zone {
    padding: 2rem 1rem;
  }

  .upload-icon {
    font-size: 3rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .files-section {
    margin: -1rem 0.5rem 0.5rem;
    padding: 1rem;
  }

  .grid-container {
    grid-template-columns: 1fr;
  }

  .file-card {
    max-width: 100%;
  }
}

/* 隐藏元素 */
.hidden {
  display: none;
}

/* 表格行样式 */
.even-row {
  background-color: #f8f9fa;
}

.odd-row {
  background-color: white;
}

/* 自定义滚动条 */
.queue-list::-webkit-scrollbar {
  width: 6px;
}

.queue-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.queue-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.queue-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 