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

      <el-tab-pane label="关注" name="users">
        <div class="tab-header">
          <div class="tab-info">
            <h3>关注的用户</h3>
            <span class="count">共 {{ filteredUsers.length }} 人</span>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
          <el-skeleton :rows="3" animated />
        </div>
        
        <!-- 用户内容 -->
        <div v-else class="users-grid">
          <div 
            v-for="user in filteredUsers" 
            :key="user.id"
            class="user-card"
            @click="handleUserClick(user)"
          >
            <div class="user-avatar">
              <el-avatar :size="80" :src="user.avatar" :icon="UserFilled" />
              <div class="user-status" :class="{ online: user.isOnline }"></div>
            </div>
            
            <div class="user-info">
              <h3 class="user-name">{{ user.nickname || user.username }}</h3>
              <p class="user-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</p>
              
              <div class="user-stats">
                <span>{{ user.albumCount }} 相册</span>
                <span>{{ user.followersCount }} 粉丝</span>
              </div>
              
              <div class="user-actions">
                <el-button type="primary" size="small">
                  <el-icon><ChatDotRound /></el-icon>
                  私信
                </el-button>
                <el-button size="small" @click.stop="handleUnfollowUser(user)">
                  <el-icon><Close /></el-icon>
                  取消关注
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 空状态 -->
    <el-empty 
      v-if="!loading && isEmpty" 
      :description="emptyDescription"
      :image-size="200"
    >
      <el-button type="primary" @click="$router.push('/home')">
        <el-icon><Compass /></el-icon>
        去发现更多内容
      </el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  StarFilled,
  Search,
  Grid,
  Menu,
  View,
  Delete,
  UserFilled,
  ChatDotRound,
  Close,
  Compass
} from '@element-plus/icons-vue'
import albumService from '../api/albumService.js'
import { useUserStore } from '../stores/user.js'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('photos')
const searchQuery = ref('')
const photoSortBy = ref('latest')
const albumSortBy = ref('latest')
const photoViewMode = ref('grid')
const loading = ref(false)

// 收藏数据 - 从API获取
const favoritePhotos = ref([])
const favoriteAlbums = ref([])
const favoriteUsers = ref([])

// 获取收藏的照片
const fetchFavoritePhotos = async () => {
  try {
    loading.value = true
    const result = await albumService.getUserFavorites(userStore.user?.id, { type: 'photos' })
    
    if (result.success) {
      favoritePhotos.value = result.data.favorites.map(fav => ({
        id: fav.post.id,
        title: fav.post.title || fav.post.content || '未命名照片',
        thumbnail: fav.post.images?.[0] || null,
        url: fav.post.images?.[0] || null,
        height: 250 + Math.random() * 150, // 随机高度用于瀑布流
        author: fav.post.author?.nickname || fav.post.author?.username || '匿名用户',
        views: fav.post.views || 0,
        likes: fav.post.likes || 0,
        favoriteAt: fav.createdAt
      }))
    } else {
      ElMessage.error(result.message || '获取收藏照片失败')
    }
  } catch (error) {
    console.error('获取收藏照片失败:', error)
    ElMessage.error('网络错误，获取收藏照片失败')
  } finally {
    loading.value = false
  }
}

// 获取收藏的相册
const fetchFavoriteAlbums = async () => {
  try {
    loading.value = true
    const result = await albumService.getUserFavorites(userStore.user?.id, { type: 'albums' })
    
    if (result.success) {
      favoriteAlbums.value = result.data.favorites.map(fav => ({
        id: fav.post.id,
        title: fav.post.title || fav.post.content || '未命名相册',
        cover: fav.post.images?.[0] || null,
        author: fav.post.author?.nickname || fav.post.author?.username || '匿名用户',
        photoCount: fav.post.images?.length || 0,
        views: fav.post.views || 0,
        likes: fav.post.likes || 0,
        favoriteAt: fav.createdAt?.split('T')[0]
      }))
    } else {
      ElMessage.error(result.message || '获取收藏相册失败')
    }
  } catch (error) {
    console.error('获取收藏相册失败:', error)
    ElMessage.error('网络错误，获取收藏相册失败')
  } finally {
    loading.value = false
  }
}

// 获取关注的用户
const fetchFollowingUsers = async () => {
  try {
    loading.value = true
    const result = await albumService.getFollowing(userStore.user?.id)
    
    if (result.success) {
      favoriteUsers.value = result.data.following.map(follow => ({
        id: follow.following.id,
        username: follow.following.username,
        nickname: follow.following.nickname || follow.following.username,
        avatar: follow.following.avatar || null,
        bio: follow.following.bio || '这个人很懒，什么都没写~',
        albumCount: follow.following.albumCount || 0,
        followersCount: follow.following.followersCount || 0,
        isOnline: Math.random() > 0.5, // 随机在线状态
        followAt: follow.createdAt?.split('T')[0]
      }))
    } else {
      ElMessage.error(result.message || '获取关注用户失败')
    }
  } catch (error) {
    console.error('获取关注用户失败:', error)
    ElMessage.error('网络错误，获取关注用户失败')
  } finally {
    loading.value = false
  }
}

// 计算属性
const filteredPhotos = computed(() => {
  let filtered = favoritePhotos.value

  if (searchQuery.value) {
    filtered = filtered.filter(photo => 
      photo.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      photo.author.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered.sort((a, b) => {
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
})

const filteredAlbums = computed(() => {
  let filtered = favoriteAlbums.value

  if (searchQuery.value) {
    filtered = filtered.filter(album => 
      album.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      album.author.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered.sort((a, b) => {
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
})

const filteredUsers = computed(() => {
  if (!searchQuery.value) return favoriteUsers.value
  
  return favoriteUsers.value.filter(user => 
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (user.nickname && user.nickname.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
    (user.bio && user.bio.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const waterfallColumns = computed(() => {
  const columns = [{ id: 1, photos: [] }, { id: 2, photos: [] }, { id: 3, photos: [] }]
  let columnHeights = [0, 0, 0]

  filteredPhotos.value.forEach(photo => {
    const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights))
    columns[minHeightIndex].photos.push(photo)
    columnHeights[minHeightIndex] += photo.height + 16 // 16px for margin
  })

  return columns
})

const isEmpty = computed(() => {
  switch (activeTab.value) {
    case 'photos':
      return filteredPhotos.value.length === 0
    case 'albums':
      return filteredAlbums.value.length === 0
    case 'users':
      return filteredUsers.value.length === 0
    default:
      return false
  }
})

const emptyDescription = computed(() => {
  switch (activeTab.value) {
    case 'photos':
      return '还没有收藏任何照片'
    case 'albums':
      return '还没有收藏任何相册'
    case 'users':
      return '还没有关注任何用户'
    default:
      return '暂无数据'
  }
})

// 处理照片点击
const handlePhotoClick = (photo) => {
  router.push(`/photo/${photo.id}`)
}

// 处理相册点击
const handleAlbumClick = (album) => {
  router.push(`/album/${album.id}`)
}

// 处理用户点击
const handleUserClick = (user) => {
  router.push(`/user/${user.id}`)
}

// 移除收藏照片
const handleRemovePhoto = async (photo) => {
  try {
    const result = await albumService.togglePostFavorite(photo.id, false)
    if (result.success) {
      const index = favoritePhotos.value.findIndex(p => p.id === photo.id)
      if (index > -1) {
        favoritePhotos.value.splice(index, 1)
      }
      ElMessage.success('已取消收藏')
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    console.error('取消收藏失败:', error)
    ElMessage.error('操作失败')
  }
}

// 移除收藏相册
const handleRemoveAlbum = async (album) => {
  try {
    const result = await albumService.togglePostFavorite(album.id, false)
    if (result.success) {
      const index = favoriteAlbums.value.findIndex(a => a.id === album.id)
      if (index > -1) {
        favoriteAlbums.value.splice(index, 1)
      }
      ElMessage.success('已取消收藏')
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    console.error('取消收藏失败:', error)
    ElMessage.error('操作失败')
  }
}

// 取消关注用户
const handleUnfollowUser = async (user) => {
  try {
    const result = await albumService.unfollowUser(user.id)
    if (result.success) {
      const index = favoriteUsers.value.findIndex(u => u.id === user.id)
      if (index > -1) {
        favoriteUsers.value.splice(index, 1)
      }
      ElMessage.success('已取消关注')
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    console.error('取消关注失败:', error)
    ElMessage.error('操作失败')
  }
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 格式化相对时间
const formatRelativeTime = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return formatDate(dateString)
}

// 获取所有收藏数据
const fetchAllFavorites = async () => {
  if (!userStore.isAuthenticated) return
  
  switch (activeTab.value) {
    case 'photos':
      await fetchFavoritePhotos()
      break
    case 'albums':
      await fetchFavoriteAlbums()
      break
    case 'users':
      await fetchFollowingUsers()
      break
  }
}

// 监听选项卡变化
const handleTabChange = (tab) => {
  activeTab.value = tab
  fetchAllFavorites()
}

// 组件挂载时获取数据
onMounted(() => {
  if (userStore.isAuthenticated) {
    fetchAllFavorites()
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
  padding: 24px;
}

.user-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f3f4f6;
  text-align: center;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.user-status {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #d1d5db;
  border: 2px solid #fff;
}

.user-status.online {
  background: #10b981;
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
  line-height: 1.4;
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #6b7280;
}

.user-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .stats-bar {
    justify-content: space-around;
  }
  
  .tab-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .tab-controls {
    justify-content: space-between;
  }
  
  .photos-grid,
  .albums-grid,
  .users-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .photos-waterfall {
    flex-direction: column;
  }
}
</style> 