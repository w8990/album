<template>
  <div class="my-albums-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><PictureRounded /></el-icon>
            我的相册
          </h1>
          <p class="page-subtitle">管理和分享你的精彩瞬间</p>
        </div>
        
        <div class="header-actions">
          <el-button type="primary" size="large" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建相册
          </el-button>
          
          <!-- 视图切换 -->
          <el-radio-group v-model="viewMode" size="large">
            <el-radio-button value="grid">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 统计信息 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-number">{{ albums.length }}</span>
          <span class="stat-label">个相册</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ totalPhotos }}</span>
          <span class="stat-label">张照片</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ totalViews }}</span>
          <span class="stat-label">次浏览</span>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索相册..."
        :prefix-icon="Search"
        clearable
        style="width: 300px"
        @input="handleSearch"
      />
      
      <div class="filter-controls">
        <el-select v-model="sortBy" placeholder="排序方式" style="width: 140px">
          <el-option label="最新创建" value="latest" />
          <el-option label="最早创建" value="oldest" />
          <el-option label="照片最多" value="photos" />
          <el-option label="浏览最多" value="views" />
        </el-select>
        
        <el-select v-model="filterBy" placeholder="筛选" style="width: 120px">
          <el-option label="全部" value="all" />
          <el-option label="公开" value="public" />
          <el-option label="私密" value="private" />
        </el-select>
      </div>
    </div>

    <!-- 相册列表 -->
    <div class="albums-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated />
      </div>
      
      <!-- 相册内容 -->
      <template v-else>
        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="albums-grid">
          <div 
            v-for="album in filteredAlbums" 
            :key="album.id"
            class="album-card"
            @click="handleAlbumClick(album)"
          >
            <div class="album-cover">
              <img :src="album.cover" :alt="album.title" />
              <div class="album-overlay">
                <div class="overlay-content">
                  <span class="photo-count">{{ album.photoCount }} 张照片</span>
                  <div class="album-stats">
                    <span><el-icon><View /></el-icon> {{ album.views }}</span>
                    <span><el-icon><StarFilled /></el-icon> {{ album.likes }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 隐私状态 -->
              <div class="privacy-badge" v-if="album.privacy === 'private'">
                <el-icon><Lock /></el-icon>
              </div>
              
              <!-- 操作按钮 -->
              <div class="album-actions">
                <el-button 
                  type="primary" 
                  :icon="Edit" 
                  circle 
                  size="small"
                  @click.stop="handleEditAlbum(album)"
                />
                <el-button 
                  type="danger" 
                  :icon="Delete" 
                  circle 
                  size="small"
                  @click.stop="handleDeleteAlbum(album)"
                />
              </div>
            </div>
            
            <div class="album-info">
              <h3 class="album-title">{{ album.title }}</h3>
              <p class="album-meta">
                创建于 {{ formatDate(album.createdAt) }}
                <el-tag v-if="album.privacy === 'private'" type="warning" size="small">私密</el-tag>
              </p>
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else class="albums-list">
          <el-table :data="filteredAlbums" style="width: 100%" v-loading="loading">
            <el-table-column width="120">
              <template #default="{ row }">
                <div class="table-cover">
                  <img :src="row.cover" :alt="row.title" />
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="title" label="相册名称" min-width="200">
              <template #default="{ row }">
                <div class="album-title-cell">
                  <span class="title">{{ row.title }}</span>
                  <el-tag v-if="row.privacy === 'private'" type="warning" size="small">
                    <el-icon><Lock /></el-icon>
                    私密
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="photoCount" label="照片数量" width="100" align="center">
              <template #default="{ row }">
                <span class="photo-count">{{ row.photoCount }}</span>
              </template>
            </el-table-column>
            
            <el-table-column prop="views" label="浏览量" width="100" align="center" />
            
            <el-table-column prop="likes" label="点赞" width="80" align="center" />
            
            <el-table-column prop="createdAt" label="创建时间" width="120">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" :icon="View" size="small" @click="handleAlbumClick(row)">
                  查看
                </el-button>
                <el-button :icon="Edit" size="small" @click="handleEditAlbum(row)">
                  编辑
                </el-button>
                <el-button type="danger" :icon="Delete" size="small" @click="handleDeleteAlbum(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 空状态 -->
        <el-empty 
          v-if="!loading && filteredAlbums.length === 0 && userStore.isAuthenticated" 
          description="还没有相册，创建一个开始分享吧！"
          :image-size="200"
        >
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建第一个相册
          </el-button>
        </el-empty>
        
        <!-- 未登录状态 -->
        <el-empty 
          v-if="!loading && !userStore.isAuthenticated" 
          description="请先登录以查看您的相册"
          :image-size="200"
        >
          <el-button type="primary" @click="$router.push('/login')">
            立即登录
          </el-button>
        </el-empty>
      </template>
    </div>

    <!-- 创建相册对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      title="创建新相册"
      width="600px"
      :before-close="handleCloseCreate"
    >
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="相册名称" prop="title">
          <el-input v-model="createForm.title" placeholder="给你的相册起个名字" />
        </el-form-item>
        
        <el-form-item label="相册描述">
          <el-input 
            v-model="createForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="描述一下这个相册..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="隐私设置">
          <el-radio-group v-model="createForm.privacy">
            <el-radio value="public">
              <el-icon><Unlock /></el-icon>
              公开 - 所有人都可以查看
            </el-radio>
            <el-radio value="private">
              <el-icon><Lock /></el-icon>
              私密 - 只有我可以查看
            </el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="相册封面">
          <el-upload
            v-model:file-list="coverFileList"
            :auto-upload="false"
            :limit="1"
            list-type="picture-card"
            accept="image/*"
            @change="handleCoverChange"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleCloseCreate">取消</el-button>
        <el-button type="primary" @click="handleCreateAlbum" :loading="creating">
          创建相册
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  PictureRounded,
  Plus,
  Grid,
  List,
  Search,
  View,
  StarFilled,
  Lock,
  Unlock,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import albumService from '../api/albumService.js'
import { useUserStore } from '../stores/user.js'

const router = useRouter()
const viewMode = ref('grid')
const searchQuery = ref('')
const sortBy = ref('latest')
const filterBy = ref('all')
const showCreateDialog = ref(false)
const creating = ref(false)
const loading = ref(false)
const createFormRef = ref()
const coverFileList = ref([])
const userStore = useUserStore()

// 创建表单
const createForm = reactive({
  title: '',
  description: '',
  privacy: 'public',
  images: []
})

// 表单验证规则
const createRules = {
  title: [
    { required: true, message: '请输入相册名称', trigger: 'blur' },
    { min: 1, max: 50, message: '相册名称长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// 相册数据 - 从API获取
const albums = ref([])

// 获取用户相册
const fetchAlbums = async () => {
  try {
    loading.value = true
    
    // 检查用户是否已登录
    if (!userStore.isAuthenticated || !userStore.user?.id) {
      ElMessage.warning('请先登录')
      albums.value = []
      return
    }
    
    // 获取所有社交动态，然后过滤当前用户的
    const result = await albumService.getSocialPosts({ 
      page: 1, 
      limit: 100  // 获取更多数据
    })
    
    if (result.success) {
      // 过滤当前用户的posts
      const userPosts = result.data.posts.filter(post => {
        return post.authorId == userStore.user?.id
      })
      
      // 转换API数据格式为相册格式
      albums.value = userPosts.map(post => {
        // 提取文件信息
        const firstImage = post.images?.[0]
        const fileName = firstImage?.title || firstImage?.description || '未命名文件'
        
        return {
          id: post.id,
          title: post.content || fileName || `照片 ${post.id}`,
          description: post.content || '',
          cover: firstImage?.url || 'https://picsum.photos/400/300?random=' + post.id,
          photoCount: post.images?.length || 1,
          views: post.views || 0,
          likes: post.likes || 0,
          privacy: 'public', // 默认公开
          createdAt: post.createdAt,
          updatedAt: post.createdAt
        }
      })
      
    } else {
      console.log('API调用失败:', result)
      ElMessage.error(result.message || '获取相册失败')
      albums.value = []
    }
  } catch (error) {
    console.error('获取相册失败:', error)
    ElMessage.error('网络错误，获取相册失败')
    albums.value = []
  } finally {
    loading.value = false
  }
}

// 计算属性
const totalPhotos = computed(() => {
  return albums.value.reduce((total, album) => total + album.photoCount, 0)
})

const totalViews = computed(() => {
  return albums.value.reduce((total, album) => total + album.views, 0)
})

const filteredAlbums = computed(() => {
  let filtered = albums.value

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(album => 
      album.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      album.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 隐私过滤
  if (filterBy.value !== 'all') {
    filtered = filtered.filter(album => album.privacy === filterBy.value)
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'latest':
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt)
      case 'photos':
        return b.photoCount - a.photoCount
      case 'views':
        return b.views - a.views
      default:
        return 0
    }
  })

  return filtered
})

// 搜索处理
const handleSearch = (value) => {
  // 实时搜索已经通过计算属性实现
}

// 处理相册点击
const handleAlbumClick = (album) => {
  // 增加浏览量
  albumService.incrementViews(album.id).catch(error => {
    console.error('增加浏览量失败:', error)
  })
  router.push(`/album/${album.id}`)
}

// 编辑相册
const handleEditAlbum = (album) => {
  ElMessage.info('编辑相册功能开发中...')
}

// 删除相册
const handleDeleteAlbum = (album) => {
  ElMessageBox.confirm(
    `确定要删除相册"${album.title}"吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // 调用API删除相册
      const result = await albumService.deletePost(album.id)
      if (result.success) {
        // 从列表中移除
        const index = albums.value.findIndex(a => a.id === album.id)
        if (index > -1) {
          albums.value.splice(index, 1)
        }
        ElMessage.success('相册删除成功')
      } else {
        ElMessage.error(result.message || '删除失败')
      }
    } catch (error) {
      console.error('删除相册失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 处理封面上传变化
const handleCoverChange = (file, fileList) => {
  createForm.images = fileList.map(f => f.raw).filter(Boolean)
}

// 创建相册
const handleCreateAlbum = async () => {
  try {
    await createFormRef.value.validate()
    
    // 检查是否有图片文件
    if (!createForm.images || createForm.images.length === 0) {
      ElMessage.error('请选择要上传的图片')
      return
    }
    
    // 检查用户是否已登录
    if (!userStore.isAuthenticated) {
      ElMessage.error('请先登录')
      return
    }
    
    creating.value = true
    
    // 准备上传数据
    const postData = {
      content: createForm.title,
      images: createForm.images.map(file => ({ raw: file })), // 转换为预期格式
      tags: ['相册'], // 添加标签
      location: '',
      privacy_level: createForm.privacy === 'private' ? 'private' : 'public'
    }

    // 调用API创建相册（实际是上传文件）
    const result = await albumService.createPost(postData)
    
    if (result.success) {
      ElMessage.success('相册创建成功')
      handleCloseCreate()
      // 重新获取相册列表
      await fetchAlbums()
    } else {
      ElMessage.error(result.message || '创建失败')
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 表单验证错误，不需要额外处理
      return
    }
    console.error('创建相册失败:', error)
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

// 关闭创建对话框
const handleCloseCreate = () => {
  showCreateDialog.value = false
  createForm.title = ''
  createForm.description = ''
  createForm.privacy = 'public'
  createForm.images = []
  coverFileList.value = []
  createFormRef.value?.resetFields()
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 组件挂载时获取数据
onMounted(async () => {
  // 确保用户存储已初始化
  if (!userStore.initialized) {
    await userStore.initializeAuth()
  }
  
  if (userStore.isAuthenticated) {
    fetchAlbums()
  } else {
    ElMessage.warning('请先登录以查看您的相册')
  }
})
</script>

<style scoped>
.my-albums-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stats-bar {
  display: flex;
  gap: 32px;
  padding: 20px 0;
  border-top: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-controls {
  display: flex;
  gap: 12px;
}

.albums-container {
  min-height: 400px;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.album-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.album-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.album-cover {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.album-card:hover .album-cover img {
  transform: scale(1.1);
}

.album-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 20px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.album-card:hover .album-overlay {
  transform: translateY(0);
}

.overlay-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.photo-count {
  font-weight: 600;
}

.album-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.album-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.privacy-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.album-actions {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.album-card:hover .album-actions {
  opacity: 1;
}

.album-info {
  padding: 20px;
}

.album-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.album-meta {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.albums-list {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.table-cover {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
}

.table-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-title-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-weight: 600;
  color: #1f2937;
}

.photo-count {
  font-weight: 600;
  color: #667eea;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .stats-bar {
    justify-content: space-around;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 16px;
  }
  
  .filter-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .albums-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .album-card {
    margin: 0 auto;
    max-width: 400px;
  }
}
</style> 