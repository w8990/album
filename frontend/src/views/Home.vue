<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">文件上传预览系统</h1>
        <p class="hero-subtitle">简单、高效的文件管理解决方案</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="showUploadDialog = true">
            <el-icon><Upload /></el-icon>
            快速上传
          </el-button>
          <el-button size="large" @click="$router.push('/preview')">
            <el-icon><Picture /></el-icon>
            在线预览
          </el-button>
        </div>
      </div>
    </div>

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
              支持 PNG, JPG, GIF, MP4, WebM 格式
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

        <!-- 预览区域 -->
        <div v-if="previewUrl" class="preview-section">
          <h3 class="preview-title">文件预览</h3>
          <div class="preview-content">
            <div class="preview-wrapper">
              <img
                v-if="isImage"
                :src="previewUrl"
                class="preview-image"
                alt="预览图片"
              >
              <video
                v-else
                :src="previewUrl"
                class="preview-video"
                controls
              ></video>
              <div class="preview-actions">
                <el-button type="danger" @click="cancelUpload">
                  取消上传
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <div class="recent-files-section" v-if="files.length > 0">
      <div class="section-header">
        <h2 class="section-title">最近上传</h2>
        <div class="batch-actions">
          <el-button 
            type="primary" 
            @click="toggleBatchMode"
            :class="{ 'is-active': isBatchMode }"
          >
            {{ isBatchMode ? '退出批量操作' : '批量操作' }}
          </el-button>
          <template v-if="isBatchMode">
            <el-button type="primary" @click="toggleSelectAll">
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
            <el-button 
              type="danger" 
              @click="confirmBatchDelete"
              :disabled="selectedFiles.length === 0"
            >
              批量删除 ({{ selectedFiles.length }})
            </el-button>
          </template>
        </div>
      </div>
      <div class="files-grid">
        <div v-for="file in files" :key="file.id" class="file-card" @click="handleFileCardClick(file)">
          <div class="file-preview">
            <div class="select-overlay" v-show="isBatchMode" @click.stop>
              <el-checkbox
                v-model="selectedFiles"
                :label="file.id"
                @change="handleSelectChange"
              />
            </div>
            <img
              v-if="file.mimetype.startsWith('image/')"
              :src="`${API_BASE_URL}${file.url}`"
              :alt="file.originalname"
              class="preview-image"
            >
            <div v-else class="video-placeholder">
              <el-icon><VideoPlay /></el-icon>
            </div>
            <div class="delete-overlay" @click.stop="deleteFile(file)">
              <el-icon><Delete /></el-icon>
            </div>
          </div>
          <div class="file-info">
            <h4 class="file-name">{{ file.originalname }}</h4>
            <p class="file-meta">{{ formatFileSize(file.size) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL, API_ENDPOINTS } from '../config'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const files = ref([])
const showUploadDialog = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const previewUrl = ref('')
const isImage = ref(true)
const selectedFiles = ref<number[]>([])
const isBatchMode = ref(false)

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
    // 从列表中移除已删除的文件
    files.value = files.value.filter(f => f.id !== file.id)
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
    console.log('获取到的文件数量:', data.length)
    files.value = data
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

const handleSelectChange = () => {
  console.log('已选择的文件:', selectedFiles.value)
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
      // 从列表中移除已删除的文件
      files.value = files.value.filter(f => !selectedFiles.value.includes(f.id))
      selectedFiles.value = []
    } else {
      ElMessage.error('所有文件删除失败')
    }
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败，请重试')
  }
}

const isAllSelected = computed(() => {
  return files.value.length > 0 && selectedFiles.value.length === files.value.length
})

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
    selectedFiles.value = files.value.map(file => file.id)
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.hero-section {
  text-align: center;
  padding: 40px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  border-radius: 16px;
  margin-bottom: 40px;
  flex-shrink: 0;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 16px;
  background: linear-gradient(120deg, #303133 0%, #606266 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 20px;
  color: #606266;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.hero-actions .el-button {
  padding: 12px 24px;
  font-size: 16px;
}

.section-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 24px;
  text-align: center;
}

.recent-files-section {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 20px;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding-bottom: 20px;
}

.file-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.file-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
}

.file-preview {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f5f7fa;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e4e7eb;
}

.video-placeholder .el-icon {
  font-size: 48px;
  color: #909399;
}

.delete-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.delete-overlay .el-icon {
  color: #fff;
  font-size: 24px;
}

.file-preview:hover .delete-overlay {
  opacity: 1;
}

.file-info {
  padding: 16px;
}

.file-name {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 14px;
  color: #909399;
}

@media (max-width: 768px) {
  .home-container {
    padding: 0 10px;
  }

  .hero-section {
    padding: 30px 0;
    margin-bottom: 30px;
  }

  .hero-title {
    font-size: 32px;
  }
  
  .hero-subtitle {
    font-size: 16px;
  }
  
  .hero-actions {
    flex-direction: column;
    gap: 10px;
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
  }
}

.upload-dialog-content {
  padding: 20px;
}

.upload-area {
  padding: 40px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
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

.upload-content {
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.upload-text {
  margin-bottom: 16px;
}

.primary-text {
  font-size: 18px;
  color: #303133;
  margin-bottom: 8px;
}

.secondary-text {
  font-size: 14px;
  color: #909399;
  margin-bottom: 16px;
}

.upload-tip {
  font-size: 14px;
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

.preview-section {
  margin-top: 20px;
}

.preview-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 16px;
}

.preview-content {
  display: flex;
  justify-content: center;
}

.preview-wrapper {
  position: relative;
  max-width: 100%;
}

.preview-image,
.preview-video {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
}

.preview-actions {
  margin-top: 16px;
  text-align: center;
}

.hidden {
  display: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.batch-actions {
  display: flex;
  gap: 12px;
}

.batch-actions .el-button.is-active {
  background-color: #67c23a;
  border-color: #67c23a;
}

.select-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.file-card:hover .select-overlay {
  opacity: 1;
}

.file-card {
  position: relative;
  cursor: pointer;
}
</style> 