<template>
  <div class="upload-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <h2>文件上传</h2>
            </div>
          </template>
          
          <el-upload
            class="upload-area"
            drag
            action="http://localhost:3000/api/files/upload"
            :on-success="handleSuccess"
            :on-error="handleError"
            :before-upload="beforeUpload"
            name="files"
            multiple
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持图片和视频文件上传
              </div>
            </template>
          </el-upload>

          <el-divider>上传列表</el-divider>

          <el-table :data="fileList" style="width: 100%">
            <el-table-column prop="originalname" label="文件名" />
            <el-table-column prop="size" label="大小">
              <template #default="{ row }">
                {{ formatFileSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="mimetype" label="类型" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button type="primary" link @click="previewFile(row)">
                  预览
                </el-button>
                <el-button type="danger" link @click="deleteFile(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" :title="previewFile.name" width="50%">
      <div class="preview-content">
        <img v-if="isImage" :src="previewFile.url" class="preview-image" />
        <video v-else-if="isVideo" :src="previewFile.url" controls class="preview-video" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const fileList = ref([])
const previewVisible = ref(false)
const previewFile = ref({})

const isImage = ref(false)
const isVideo = ref(false)

const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

const beforeUpload = (file: File) => {
  console.log('准备上传文件:', {
    name: file.name,
    type: file.type,
    size: file.size
  })
  
  const isImageOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/')
  if (!isImageOrVideo) {
    ElMessage.error('只能上传图片或视频文件！')
    return false
  }
  
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过100MB')
    return false
  }
  
  return true
}

const handleSuccess = (response: any) => {
  console.log('上传成功响应:', response)
  if (response.success && response.data) {
    fileList.value.push(...response.data)
    ElMessage.success(response.message || '上传成功')
  } else {
    console.error('响应格式错误:', response)
    ElMessage.error('上传响应格式错误')
  }
}

const handleError = (error: any) => {
  console.error('上传错误详情:', error)
  let errorMessage = '上传失败'
  
  if (error?.response?.data?.error) {
    errorMessage = error.response.data.error
  } else if (error?.message) {
    errorMessage = error.message
  }
  
  ElMessage.error(errorMessage)
}

const previewFile = (file: any) => {
  previewFile.value = file
  isImage.value = file.mimetype.startsWith('image/')
  isVideo.value = file.mimetype.startsWith('video/')
  previewVisible.value = true
}

const deleteFile = (file: any) => {
  // TODO: 实现删除功能
  ElMessage.warning('删除功能待实现')
}
</script>

<style scoped>
.upload-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-area {
  width: 100%;
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
}

.preview-video {
  max-width: 100%;
  max-height: 500px;
}
</style> 