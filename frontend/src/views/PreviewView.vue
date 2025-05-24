<template>
  <div class="preview-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <h2>文件预览</h2>
              <el-input
                v-model="searchQuery"
                placeholder="搜索文件名"
                style="width: 200px"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </template>

          <el-table
            :data="filteredFiles"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="originalname" label="文件名" />
            <el-table-column prop="size" label="大小">
              <template #default="{ row }">
                {{ formatFileSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="mimetype" label="类型" />
            <el-table-column label="预览" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="previewFile(row)">
                  预览
                </el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
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
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const fileList = ref([])
const searchQuery = ref('')
const loading = ref(false)
const previewVisible = ref(false)
const previewFile = ref({})

const isImage = ref(false)
const isVideo = ref(false)

const filteredFiles = computed(() => {
  if (!searchQuery.value) return fileList.value
  return fileList.value.filter(file => 
    file.originalname.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
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

// TODO: 实现获取文件列表
const fetchFiles = async () => {
  loading.value = true
  try {
    // const response = await fetch('http://localhost:3000/api/files')
    // fileList.value = await response.json()
    ElMessage.warning('获取文件列表功能待实现')
  } catch (error) {
    ElMessage.error('获取文件列表失败')
  } finally {
    loading.value = false
  }
}

// 页面加载时获取文件列表
fetchFiles()
</script>

<style scoped>
.preview-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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