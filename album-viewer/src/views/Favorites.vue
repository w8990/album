<template>
  <div class="favorites-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><StarFilled /></el-icon>
            我的收藏
          </h1>
          <p class="page-subtitle">珍藏那些让你心动的瞬间</p>
        </div>
        
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索收藏内容..."
            :prefix-icon="Search"
            clearable
            style="width: 280px"
          />
        </div>
      </div>
      
      <!-- 统计信息 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-number">{{ favoritePhotos.length }}</span>
          <span class="stat-label">收藏照片</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ favoriteAlbums.length }}</span>
          <span class="stat-label">收藏相册</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ favoriteUsers.length }}</span>
          <span class="stat-label">关注用户</span>
        </div>
      </div>
    </div>

    <!-- 选项卡 -->
    <el-tabs v-model="activeTab" class="favorites-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="照片" name="photos">
        <div class="tab-header">
          <div class="tab-info">
            <h3>收藏的照片</h3>
            <span class="count">共 {{ filteredPhotos.length }} 张</span>
          </div>
          
          <div class="tab-controls">
            <el-select v-model="photoSortBy" placeholder="排序" style="width: 140px">
              <el-option label="最新收藏" value="latest" />
              <el-option label="最早收藏" value="oldest" />
              <el-option label="点赞最多" value="likes" />
              <el-option label="浏览最多" value="views" />
            </el-select>
            
            <el-radio-group v-model="photoViewMode" size="small">
              <el-radio-button value="grid">
                <el-icon><Grid /></el-icon>
              </el-radio-button>
              <el-radio-button value="waterfall">
                <el-icon><Menu /></el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
          <el-skeleton :rows="3" animated />
        </div>
        
        <!-- 照片内容 -->
        <template v-else>
          <!-- 照片网格 -->
          <div v-if="photoViewMode === 'grid'" class="photos-grid">
            <div 
              v-for="photo in filteredPhotos" 
              :key="photo.id"
              class="photo-card"
              @click="handlePhotoClick(photo)"
            >
              <div class="photo-image">
                <img :src="photo.thumbnail" :alt="photo.title" />
                <div class="photo-overlay">
                  <div class="overlay-content">
                    <div class="photo-stats">
                      <span><el-icon><View /></el-icon> {{ photo.views }}</span>
                      <span><el-icon><StarFilled /></el-icon> {{ photo.likes }}</span>
                    </div>
                    <div class="photo-actions">
                      <el-button 
                        type="danger" 
                        :icon="Delete" 
                        circle 
                        size="small"
                        @click.stop="handleRemovePhoto(photo)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="photo-info">
                <h4 class="photo-title">{{ photo.title }}</h4>
                <p class="photo-author">by {{ photo.author }}</p>
                <span class="favorite-date">{{ formatRelativeTime(photo.favoriteAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 瀑布流视图 -->
          <div v-else class="photos-waterfall">
            <div class="waterfall-column" v-for="column in waterfallColumns" :key="column.id">
              <div 
                v-for="photo in column.photos" 
                :key="photo.id"
                class="waterfall-item"
                @click="handlePhotoClick(photo)"
              >
                <img :src="photo.url" :alt="photo.title" :style="{ height: photo.height + 'px' }" />
                <div class="waterfall-overlay">
                  <h4 class="photo-title">{{ photo.title }}</h4>
                  <div class="photo-stats">
                    <span><el-icon><View /></el-icon> {{ photo.views }}</span>
                    <span><el-icon><StarFilled /></el-icon> {{ photo.likes }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </el-tab-pane>

      <el-tab-pane label="相册" name="albums">
        <div class="tab-header">
          <div class="tab-info">
            <h3>收藏的相册</h3>
            <span class="count">共 {{ filteredAlbums.length }} 个</span>
          </div>
          
          <div class="tab-controls">
            <el-select v-model="albumSortBy" placeholder="排序" style="width: 140px">
              <el-option label="最新收藏" value="latest" />
              <el-option label="最早收藏" value="oldest" />
              <el-option label="照片最多" value="photos" />
              <el-option label="浏览最多" value="views" />
            </el-select>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
          <el-skeleton :rows="3" animated />
        </div>
        
        <!-- 相册内容 -->
        <div v-else class="albums-grid">
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
              
              <!-- 移除收藏按钮 -->
              <div class="remove-favorite">
                <el-button 
                  type="danger" 
                  :icon="Delete" 
                  circle 
                  size="small"
                  @click.stop="handleRemoveAlbum(album)"
                />
              </div>
            </div>
            
            <div class="album-info">
              <h3 class="album-title">{{ album.title }}</h3>
              <p class="album-author">by {{ album.author }}</p>
              <span class="favorite-date">收藏于 {{ formatDate(album.favoriteAt) }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="用户" name="users">
        <div class="tab-header">
          <div class="tab-info">
            <h3>关注的用户</h3>
            <span class="count">共 {{ filteredUsers.length }} 位</span>
          </div>
          
          <div class="tab-controls">
            <el-select v-model="userSortBy" placeholder="排序" style="width: 140px">
              <el-option label="最新关注" value="latest" />
              <el-option label="最早关注" value="oldest" />
              <el-option label="活跃度" value="activity" />
            </el-select>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        
        <!-- 用户列表 -->
        <div v-else class="users-grid">
          <div 
            v-for="user in filteredUsers" 
            :key="user.id"
            class="user-card"
            @click="handleUserClick(user)"
          >
            <div class="user-avatar">
              <el-avatar :size="80" :src="user.avatar" />
              <div v-if="user.isOnline" class="online-status"></div>
            </div>
            
            <div class="user-info">
              <h4 class="user-name">{{ user.nickname }}</h4>
              <p class="user-bio">{{ user.bio }}</p>
              
              <div class="user-stats">
                <span>{{ user.albumCount }} 相册</span>
                <span>{{ user.followersCount }} 粉丝</span>
              </div>
              
              <div class="user-actions">
                <el-button 
                  size="small" 
                  @click.stop="handleUnfollowUser(user)"
                  :loading="user.unfollowing"
                >
                  取消关注
                </el-button>
                <el-button 
                  type="primary" 
                  size="small"
                  @click.stop="handleVisitProfile(user)"
                >
                  查看资料
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 用户空状态 -->
        <el-empty 
          v-if="!loading && filteredUsers.length === 0" 
          description="还没有关注任何用户"
          :image-size="200"
        >
          <el-button type="primary" @click="$router.push('/social')">
            <el-icon><Plus /></el-icon>
            发现精彩用户
          </el-button>
        </el-empty>
      </el-tab-pane>
    </el-tabs>

    <!-- 批量操作工具栏 -->
    <el-dialog v-model="showBatchDialog" title="批量操作" width="500px">
      <div class="batch-actions">
        <p>已选择 {{ selectedItems.length }} 项</p>
        <div class="action-buttons">
          <el-button @click="batchRemove" type="danger">批量移除</el-button>
          <el-button @click="batchExport">导出列表</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 照片预览对话框 -->
    <el-dialog v-model="showPhotoDialog" :title="currentPhoto?.title" width="80%">
      <div v-if="currentPhoto" class="photo-preview">
        <img :src="currentPhoto.url" :alt="currentPhoto.title" class="preview-image" />
        <div class="photo-meta">
          <div class="meta-item">
            <span class="label">作者:</span>
            <span class="value">{{ currentPhoto.author }}</span>
          </div>
          <div class="meta-item">
            <span class="label">收藏时间:</span>
            <span class="value">{{ formatDate(currentPhoto.favoriteAt) }}</span>
          </div>
          <div class="meta-item">
            <span class="label">浏览量:</span>
            <span class="value">{{ currentPhoto.views }}</span>
          </div>
          <div class="meta-item">
            <span class="label">点赞数:</span>
            <span class="value">{{ currentPhoto.likes }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  StarFilled,
  Search,
  Grid,
  Menu,
  View,
  Delete,
  Plus,
  User,
  Share
} from '@element-plus/icons-vue'
import albumService from '../api/albumService.js'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const activeTab = ref('photos')
const searchQuery = ref('')
const loading = ref(false)
const photoViewMode = ref('grid')
const photoSortBy = ref('latest')
const albumSortBy = ref('latest')
const userSortBy = ref('latest')
const showBatchDialog = ref(false)
const showPhotoDialog = ref(false)
const selectedItems = ref([])
const currentPhoto = ref(null)

// 收藏数据
const favoritePhotos = ref([])
const favoriteAlbums = ref([])
const favoriteUsers = ref([])

// 计算属性
const filteredPhotos = computed(() => {
  let filtered = favoritePhotos.value

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(photo => 
      photo.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      photo.author.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 排序
  filtered.sort((a, b) => {
    switch (photoSortBy.value) {
      case 'latest':
        return new Date(b.favoriteAt) - new Date(a.favoriteAt)
      case 'oldest':
        return new Date(a.favoriteAt) - new Date(b.favoriteAt)
      case 'likes':
        return b.likes - a.likes
      case 'views':
        return b.views - a.views
      default:
        return 0
    }
  })

  return filtered
})

const filteredAlbums = computed(() => {
  let filtered = favoriteAlbums.value

  if (searchQuery.value) {
    filtered = filtered.filter(album => 
      album.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      album.author.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  filtered.sort((a, b) => {
    switch (albumSortBy.value) {
      case 'latest':
        return new Date(b.favoriteAt) - new Date(a.favoriteAt)
      case 'oldest':
        return new Date(a.favoriteAt) - new Date(b.favoriteAt)
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

const filteredUsers = computed(() => {
  let filtered = favoriteUsers.value

  if (searchQuery.value) {
    filtered = filtered.filter(user => 
      user.nickname.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (user.bio && user.bio.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }

  filtered.sort((a, b) => {
    switch (userSortBy.value) {
      case 'latest':
        return new Date(b.followAt) - new Date(a.followAt)
      case 'oldest':
        return new Date(a.followAt) - new Date(b.followAt)
      case 'activity':
        return b.lastActiveAt - a.lastActiveAt
      default:
        return 0
    }
  })

  return filtered
})

// 瀑布流计算
const waterfallColumns = computed(() => {
  const columnCount = 3
  const columns = Array.from({ length: columnCount }, () => ({ id: Math.random(), photos: [] }))
  
  filteredPhotos.value.forEach((photo, index) => {
    const columnIndex = index % columnCount
    const randomHeight = 200 + Math.random() * 100 // 随机高度模拟瀑布流
    columns[columnIndex].photos.push({
      ...photo,
      height: randomHeight
    })
  })
  
  return columns
})

// 数据获取
const fetchFavorites = async () => {
  try {
    loading.value = true
    
    // 检查用户登录状态
    if (!userStore.isAuthenticated) {
      ElMessage.warning('请先登录')
      return
    }

    // 这里应该调用真实的收藏API，现在使用模拟数据
    await Promise.all([
      fetchFavoritePhotos(),
      fetchFavoriteAlbums(),
      fetchFavoriteUsers()
    ])
  } catch (error) {
    console.error('获取收藏数据失败:', error)
    ElMessage.error('获取收藏数据失败')
  } finally {
    loading.value = false
  }
}

const fetchFavoritePhotos = async () => {
  // 模拟收藏照片数据
  favoritePhotos.value = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `精彩照片 ${i + 1}`,
    thumbnail: `https://picsum.photos/300/400?random=${i + 100}`,
    url: `https://picsum.photos/800/1200?random=${i + 100}`,
    author: `摄影师${i + 1}`,
    views: Math.floor(Math.random() * 1000) + 100,
    likes: Math.floor(Math.random() * 100) + 10,
    favoriteAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  }))
}

const fetchFavoriteAlbums = async () => {
  // 模拟收藏相册数据
  favoriteAlbums.value = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    title: `精选相册 ${i + 1}`,
    cover: `https://picsum.photos/400/300?random=${i + 200}`,
    author: `创作者${i + 1}`,
    photoCount: Math.floor(Math.random() * 50) + 10,
    views: Math.floor(Math.random() * 2000) + 200,
    likes: Math.floor(Math.random() * 150) + 20,
    favoriteAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
  }))
}

const fetchFavoriteUsers = async () => {
  // 模拟关注用户数据
  favoriteUsers.value = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    nickname: `优秀创作者${i + 1}`,
    bio: `专注${['风景', '人像', '街拍', '建筑', '生活', '艺术'][i]}摄影`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
    albumCount: Math.floor(Math.random() * 20) + 5,
    followersCount: Math.floor(Math.random() * 1000) + 100,
    isOnline: Math.random() > 0.5,
    followAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    lastActiveAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
    unfollowing: false
  }))
}

// 事件处理
const handleTabChange = (tab) => {
  activeTab.value = tab
}

const handlePhotoClick = (photo) => {
  currentPhoto.value = photo
  showPhotoDialog.value = true
}

const handleAlbumClick = (album) => {
  router.push(`/album/${album.id}`)
}

const handleUserClick = (user) => {
  router.push(`/profile/${user.id}`)
}

const handleVisitProfile = (user) => {
  router.push(`/profile/${user.id}`)
}

const handleRemovePhoto = async (photo) => {
  try {
    const result = await ElMessageBox.confirm(
      `确定要从收藏中移除"${photo.title}"吗？`,
      '移除收藏',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      const index = favoritePhotos.value.findIndex(p => p.id === photo.id)
      if (index > -1) {
        favoritePhotos.value.splice(index, 1)
        ElMessage.success('已从收藏中移除')
      }
    }
  } catch (error) {
    // 用户取消操作
  }
}

const handleRemoveAlbum = async (album) => {
  try {
    const result = await ElMessageBox.confirm(
      `确定要从收藏中移除"${album.title}"吗？`,
      '移除收藏',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      const index = favoriteAlbums.value.findIndex(a => a.id === album.id)
      if (index > -1) {
        favoriteAlbums.value.splice(index, 1)
        ElMessage.success('已从收藏中移除')
      }
    }
  } catch (error) {
    // 用户取消操作
  }
}

const handleUnfollowUser = async (user) => {
  try {
    const result = await ElMessageBox.confirm(
      `确定要取消关注"${user.nickname}"吗？`,
      '取消关注',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      user.unfollowing = true
      // 模拟取消关注操作
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const index = favoriteUsers.value.findIndex(u => u.id === user.id)
      if (index > -1) {
        favoriteUsers.value.splice(index, 1)
        ElMessage.success('已取消关注')
      }
    }
  } catch (error) {
    user.unfollowing = false
  }
}

// 批量操作
const batchRemove = async () => {
  try {
    const result = await ElMessageBox.confirm(
      `确定要移除选中的 ${selectedItems.value.length} 项吗？`,
      '批量移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      selectedItems.value = []
      showBatchDialog.value = false
      ElMessage.success('批量移除成功')
    }
  } catch (error) {
    // 用户取消操作
  }
}

const batchExport = () => {
  ElMessage.info('导出功能开发中...')
  showBatchDialog.value = false
}

// 工具方法
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatRelativeTime = (date) => {
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return `${Math.floor(days / 30)}个月前`
}

// 监听搜索
watch(searchQuery, () => {
  // 搜索变化时可以添加防抖逻辑
})

// 组件挂载
onMounted(async () => {
  if (!userStore.initialized) {
    await userStore.initializeAuth()
  }
  
  if (userStore.isAuthenticated) {
    fetchFavorites()
  } else {
    ElMessage.warning('请先登录以查看收藏')
  }
})
</script>

<style scoped>
.favorites-container {
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

.favorites-tabs {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.tab-info h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
}

.count {
  color: #6b7280;
  font-size: 14px;
  margin-left: 8px;
}

.tab-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 照片网格 */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 24px;
}

.photo-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f3f4f6;
}

.photo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.photo-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.photo-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-card:hover .photo-image img {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-card:hover .photo-overlay {
  opacity: 1;
}

.overlay-content {
  text-align: center;
}

.photo-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.photo-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.photo-info {
  padding: 16px;
}

.photo-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.photo-author {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.favorite-date {
  color: #9ca3af;
  font-size: 12px;
}

/* 瀑布流 */
.photos-waterfall {
  display: flex;
  gap: 16px;
  padding: 24px;
}

.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.waterfall-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.waterfall-item:hover {
  transform: scale(1.02);
}

.waterfall-item img {
  width: 100%;
  display: block;
}

.waterfall-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 16px;
}

/* 相册网格 */
.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  padding: 24px;
}

.album-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f3f4f6;
}

.album-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.album-cover {
  position: relative;
  height: 200px;
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

.remove-favorite {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.album-card:hover .remove-favorite {
  opacity: 1;
}

.album-info {
  padding: 20px;
}

.album-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.album-author {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 8px 0;
}

/* 用户网格 */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.user-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  text-align: center;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}

.user-avatar {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.online-status {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  background: #52c41a;
  border-radius: 50%;
  border: 2px solid white;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.user-bio {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 16px 0;
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #6b7280;
}

.user-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.batch-actions {
  text-align: center;
  padding: 20px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.photo-preview {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 20px;
}

.photo-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  text-align: left;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.label {
  font-weight: 600;
  color: #374151;
}

.value {
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .user-actions {
    flex-direction: column;
  }
  
  .photo-meta {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style> 