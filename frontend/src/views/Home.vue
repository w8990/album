<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <nav class="top-nav">
      <div class="nav-content">
        <h1 class="logo">文件管理</h1>
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          上传文件
        </el-button>
      </div>
    </nav>

    <!-- 主要内容区 -->
    <main class="main-content">
      <!-- 文件列表区域 -->
      <section class="files-section" v-if="files.length > 0">
        <div class="section-header">
          <div class="header-left">
            <h3 class="section-title">文件列表</h3>
            <el-tag type="info" class="file-count">{{ totalFiles }} 个文件</el-tag>
          </div>
          <div class="header-right">
            <el-button-group>
              <el-button 
                :type="isBatchMode ? 'success' : 'default'"
                @click="toggleBatchMode"
              >
                {{ isBatchMode ? '退出批量操作' : '批量操作' }}
              </el-button>
              <el-button 
                v-if="isBatchMode"
                type="primary"
                @click="toggleSelectCurrentPage"
              >
                {{ isCurrentPageSelected ? '取消全选' : '全选当前页' }}
              </el-button>
              <el-button 
                v-if="isBatchMode"
                type="danger"
                :disabled="selectedFiles.length === 0"
                @click="confirmBatchDelete"
              >
                删除选中 ({{ selectedFiles.length }})
              </el-button>
            </el-button-group>
          </div>
        </div>

        <div class="files-grid">
          <div 
            v-for="file in currentPageFiles" 
            :key="file.id" 
            class="file-card"
            :class="{ 'is-selected': selectedFiles.includes(file.id) }"
            @click="handleFileCardClick(file)"
          >
            <div class="file-preview">
              <div class="select-overlay" v-show="isBatchMode" @click.stop>
                <el-checkbox
                  v-model="selectedFiles"
                  :label="file.id"
                  @change="handleSelectChange"
                />
              </div>
              <div class="preview-content">
                <img
                  v-if="file.mimetype.startsWith('image/')"
                  :src="`${API_BASE_URL}${file.url}`"
                  :alt="file.originalname"
                  class="preview-image"
                >
                <div v-else class="video-preview">
                  <el-icon><VideoPlay /></el-icon>
                </div>
              </div>
              <div class="file-actions">
                <el-button 
                  type="danger" 
                  size="small"
                  @click.stop="deleteFile(file)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="file-info">
              <h4 class="file-name" :title="file.originalname">{{ file.originalname }}</h4>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页组件 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 36, 48]"
            :total="totalFiles"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </section>

      <!-- 空状态 -->
      <section v-else class="empty-state">
        <el-empty description="暂无文件">
          <el-button type="primary" @click="showUploadDialog = true">
            开始上传
          </el-button>
        </el-empty>
      </section>
    </main>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传文件"
      width="50%"
      :close-on-click-modal="false"
      @closed="handleDialogClosed"
    >
      <div class="upload-dialog-content">
        <div
          class="upload-area"
          :class="{ 'is-dragging': isDragging, 'is-uploading': uploading }"
          @dragenter.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <div class="upload-content" v-if="!uploading">
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">
              <p class="primary-text">拖放文件到此处</p>
              <p class="secondary-text">或</p>
              <el-button type="primary" @click="triggerFileInput">
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
            </div>
            <p class="upload-tip">
              支持 PNG, JPG, GIF, MP4, WebM 格式，单个文件最大 100MB
            </p>
          </div>

          <div class="upload-progress" v-else>
            <el-progress
              :percentage="uploadProgress"
              :status="uploadProgress === 100 ? 'success' : ''"
              :stroke-width="8"
            />
            <p class="progress-text">
              {{ uploadProgress === 100 ? '上传完成' : '正在上传...' }}
            </p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL, API_ENDPOINTS } from '../config'
import { ElMessage, ElMessageBox } from 'element-plus'

interface FileItem {
  id: number
  originalname: string
  mimetype: string
  size: number
  url: string
}

const router = useRouter()
const files = ref<FileItem[]>([])
const showUploadDialog = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const previewUrl = ref('')
const isImage = ref(true)
const selectedFiles = ref<number[]>([])
const isBatchMode = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(12)
const totalFiles = ref(0)

// 计算当前页的文件
const currentPageFiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return files.value.slice(start, end)
})

// 计算当前页是否全选
const isCurrentPageSelected = computed(() => {
  if (currentPageFiles.value.length === 0) return false
  return currentPageFiles.value.every(file => selectedFiles.value.includes(file.id))
})

// 切换当前页全选状态
const toggleSelectCurrentPage = () => {
  const currentPageIds = currentPageFiles.value.map(file => file.id)
  
  if (isCurrentPageSelected.value) {
    // 取消当前页全选
    selectedFiles.value = selectedFiles.value.filter(id => !currentPageIds.includes(id))
  } else {
    // 全选当前页
    const newSelected = new Set([...selectedFiles.value, ...currentPageIds])
    selectedFiles.value = Array.from(newSelected)
  }
}

// 处理文件选择变化
const handleSelectChange = () => {
  // 如果当前页全选，则自动选中新加载的文件
  if (isCurrentPageSelected.value) {
    const currentPageIds = currentPageFiles.value.map(file => file.id)
    selectedFiles.value = Array.from(new Set([...selectedFiles.value, ...currentPageIds]))
  }
}

// 切换批量操作模式
const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value
  if (!isBatchMode.value) {
    selectedFiles.value = []
  }
}

// 处理页码改变
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  // 如果退出批量模式，清空选择
  if (!isBatchMode.value) {
    selectedFiles.value = []
  }
}

// 处理每页条数改变
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  // 如果退出批量模式，清空选择
  if (!isBatchMode.value) {
    selectedFiles.value = []
  }
}

const imageCount = computed(() => {
  return files.value.filter(file => file.mimetype.startsWith('image/')).length
})

const videoCount = computed(() => {
  return files.value.filter(file => file.mimetype.startsWith('video/')).length
})

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const previewFile = (file: any) => {
  router.push(`/preview/${file.id}`)
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
    // 重新加载文件列表
    await loadFiles()
    // 如果当前页没有文件了，且不是第一页，则跳转到上一页
    if (currentPageFiles.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除文件失败:', err)
      ElMessage.error('删除文件失败，请重试')
    }
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    handleFiles(Array.from(input.files))
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    handleFiles(Array.from(event.dataTransfer.files))
  }
}

const handleFiles = async (files: File[]) => {
  // 检查文件大小和类型
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

  uploading.value = true
  uploadProgress.value = 0
  
  let successCount = 0
  let failCount = 0
  
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i]
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        successCount++
        uploadProgress.value = Math.round(((i + 1) * 100) / validFiles.length)
      } else {
        failCount++
        console.error(`上传文件 ${file.name} 失败`)
      }
    } catch (error) {
      failCount++
      console.error(`上传文件 ${file.name} 时发生错误:`, error)
    }
  }
  
  if (successCount > 0) {
    ElMessage.success(`成功上传 ${successCount} 个文件`)
    if (failCount > 0) {
      ElMessage.warning(`${failCount} 个文件上传失败`)
    }
    showUploadDialog.value = false
    loadFiles()
  } else {
    ElMessage.error('所有文件上传失败')
  }
  
  uploading.value = false
  uploadProgress.value = 0
}

const cancelUpload = () => {
  previewUrl.value = ''
  uploading.value = false
  uploadProgress.value = 0
}

const loadFiles = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.FILES)
    const data = await response.json()
    files.value = data
    totalFiles.value = data.length
  } catch (error) {
    console.error('加载文件列表失败:', error)
  }
}

const handleDialogClosed = () => {
  // 重置所有上传相关的状态
  previewUrl.value = ''
  uploading.value = false
  uploadProgress.value = 0
  isDragging.value = false
  if (fileInput.value) {
    fileInput.value.value = '' // 清空文件输入框
  }
  selectedFiles.value = [] // 清空选择
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
  const deletePromises = selectedFiles.value.map(id => 
    fetch(API_ENDPOINTS.FILE(id), {
      method: 'DELETE'
    })
  )
  
  try {
    const results = await Promise.allSettled(deletePromises)
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    
    if (successCount > 0) {
      ElMessage.success(`成功删除 ${successCount} 个文件`)
      if (failCount > 0) {
        ElMessage.warning(`${failCount} 个文件删除失败`)
      }
      // 重新加载文件列表
      await loadFiles()
      // 如果当前页没有文件了，且不是第一页，则跳转到上一页
      if (currentPageFiles.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
      // 清空选择
      selectedFiles.value = []
    } else {
      ElMessage.error('所有文件删除失败')
    }
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败，请重试')
  }
}

const handleFileCardClick = (file: any) => {
  if (isBatchMode.value) {
    const index = selectedFiles.value.indexOf(file.id)
    if (index === -1) {
      selectedFiles.value.push(file.id)
    } else {
      selectedFiles.value.splice(index, 1)
    }
  } else {
    previewFile(file)
  }
}

onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.top-nav {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.files-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.file-count {
  font-size: 0.875rem;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.file-card {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
}

.file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.file-card.is-selected {
  border: 2px solid #409EFF;
}

.file-preview {
  position: relative;
  aspect-ratio: 16/9;
  background: #f5f7fa;
}

.preview-content {
  width: 100%;
  height: 100%;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e4e7eb;
}

.video-preview .el-icon {
  font-size: 2rem;
  color: #909399;
}

.file-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.file-card:hover .file-actions {
  opacity: 1;
}

.file-info {
  padding: 0.75rem;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #303133;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 0.75rem;
  color: #909399;
}

.empty-state {
  background: white;
  border-radius: 0.5rem;
  padding: 3rem 2rem;
  text-align: center;
}

.upload-dialog-content {
  padding: 1.5rem;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.upload-area.is-dragging {
  border-color: #409EFF;
  background-color: rgba(64, 158, 255, 0.05);
}

.upload-area.is-uploading {
  border-style: solid;
  border-color: #409EFF;
}

.upload-icon {
  font-size: 2rem;
  color: #909399;
  margin-bottom: 1rem;
}

.upload-text {
  margin-bottom: 1rem;
}

.primary-text {
  font-size: 1rem;
  color: #303133;
  margin-bottom: 0.5rem;
}

.secondary-text {
  font-size: 0.875rem;
  color: #909399;
  margin-bottom: 1rem;
}

.upload-tip {
  font-size: 0.75rem;
  color: #909399;
}

.upload-progress {
  padding: 20px;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  color: #606266;
}

.pagination-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .nav-content {
    padding: 1rem;
  }

  .main-content {
    padding: 1rem;
  }

  .files-section {
    padding: 1rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-right {
    display: flex;
    justify-content: center;
  }

  .files-grid {
    grid-template-columns: 1fr;
  }
}
</style> 