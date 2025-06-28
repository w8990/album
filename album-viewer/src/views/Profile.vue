<template>
  <div class="profile-container">
    <!-- 头部横幅 -->
    <div class="profile-header">
      <div class="header-bg">
        <img v-if="userStore.user?.cover" :src="userStore.user.cover" alt="封面" />
        <div class="header-overlay"></div>
      </div>
      
      <div class="profile-info">
        <div class="avatar-section">
          <el-avatar 
            :size="120" 
            :src="userStore.user?.avatar" 
            :icon="UserFilled"
            class="profile-avatar"
          />
          <el-button 
            type="primary" 
            :icon="Camera" 
            circle 
            class="avatar-edit-btn"
            @click="handleAvatarEdit"
          />
        </div>
        
        <div class="user-details">
          <h1 class="username">{{ userStore.user?.nickname || userStore.user?.username }}</h1>
          <p class="user-bio">{{ userStore.user?.bio || '这个人很懒，什么都没写~' }}</p>
          
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">{{ userStore.user?.albumCount || 0 }}</span>
              <span class="stat-label">相册</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStore.user?.followersCount || 0 }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStore.user?.followingCount || 0 }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStore.user?.likesCount || 0 }}</span>
              <span class="stat-label">获赞</span>
            </div>
          </div>
          
          <div class="action-buttons">
            <el-button type="primary" @click="editMode = true" :disabled="editMode">
              <el-icon><Edit /></el-icon>
              编辑资料
            </el-button>
            <el-button @click="handleShareProfile">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑模式 -->
    <el-dialog 
      v-model="editMode" 
      title="编辑个人资料" 
      width="600px"
      :before-close="handleCloseEdit"
    >
      <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="80px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        
        <el-form-item label="个人简介">
          <el-input 
            v-model="profileForm.bio" 
            type="textarea" 
            :rows="4"
            placeholder="介绍一下你自己吧..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="性别">
          <el-radio-group v-model="profileForm.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
            <el-radio value="other">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="生日">
          <el-date-picker
            v-model="profileForm.birthday"
            type="date"
            placeholder="选择生日"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="所在地">
          <el-input v-model="profileForm.location" placeholder="请输入所在地" />
        </el-form-item>
        
        <el-form-item label="个人网站">
          <el-input v-model="profileForm.website" placeholder="https://" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleCloseEdit">取消</el-button>
        <el-button type="primary" @click="handleSaveProfile" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 内容区域 -->
    <div class="profile-content">
      <!-- 选项卡 -->
      <el-tabs v-model="activeTab" class="profile-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="我的相册" name="albums">
          <!-- 加载状态 -->
          <div v-if="loading && activeTab === 'albums'" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>
          
          <!-- 相册内容 -->
          <div v-else class="albums-grid">
            <div 
              v-for="album in albums" 
              :key="album.id" 
              class="album-card"
              @click="handleAlbumClick(album)"
            >
              <div class="album-cover">
                <img :src="album.cover" :alt="album.title" />
                <div class="album-overlay">
                  <span class="photo-count">{{ album.photoCount }} 张</span>
                </div>
              </div>
              <div class="album-info">
                <h3 class="album-title">{{ album.title }}</h3>
                <p class="album-date">{{ formatDate(album.createdAt) }}</p>
              </div>
            </div>
            
            <!-- 创建新相册 -->
            <div class="album-card create-album" @click="handleCreateAlbum">
              <div class="create-content">
                <el-icon size="48"><Plus /></el-icon>
                <span>创建相册</span>
              </div>
            </div>
            
            <!-- 空状态 -->
            <div v-if="albums.length === 0" class="empty-state">
              <el-empty description="还没有任何相册">
                <el-button type="primary" @click="handleCreateAlbum">
                  <el-icon><Plus /></el-icon>
                  创建第一个相册
                </el-button>
              </el-empty>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="获赞照片" name="liked">
          <!-- 加载状态 -->
          <div v-if="loading && activeTab === 'liked'" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>
          
          <!-- 照片内容 -->
          <div v-else class="photos-grid">
            <div 
              v-for="photo in likedPhotos" 
              :key="photo.id" 
              class="photo-card"
              @click="handlePhotoClick(photo)"
            >
              <img :src="photo.thumbnail" :alt="photo.title" />
              <div class="photo-overlay">
                <el-icon class="like-icon"><StarFilled /></el-icon>
                <span>{{ photo.likes }}</span>
              </div>
            </div>
            
            <!-- 空状态 -->
            <div v-if="likedPhotos.length === 0" class="empty-state">
              <el-empty description="还没有获赞的照片" />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="活动记录" name="activity">
          <!-- 加载状态 -->
          <div v-if="loading && activeTab === 'activity'" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          
          <!-- 活动内容 -->
          <div v-else class="activity-list">
            <div 
              v-for="activity in activities" 
              :key="activity.id" 
              class="activity-item"
            >
              <div class="activity-avatar">
                <el-avatar :size="40" :src="userStore.user?.avatar" :icon="UserFilled" />
              </div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.text }}</p>
                <span class="activity-time">{{ formatRelativeTime(activity.createdAt) }}</span>
              </div>
            </div>
            
            <!-- 空状态 -->
            <div v-if="activities.length === 0" class="empty-state">
              <el-empty description="还没有任何活动记录" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UserFilled,
  Camera,
  Edit,
  Share,
  Plus,
  StarFilled
} from '@element-plus/icons-vue'
import albumService from '../api/albumService.js'

const router = useRouter()
const userStore = useUserStore()
const editMode = ref(false)
const saving = ref(false)
const loading = ref(false)
const activeTab = ref('albums')
const profileFormRef = ref()

// 表单数据
const profileForm = reactive({
  nickname: '',
  bio: '',
  gender: '',
  birthday: '',
  location: '',
  website: ''
})

// 表单验证规则
const profileRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 数据 - 从API获取
const albums = ref([])
const likedPhotos = ref([])
const activities = ref([])

// 获取用户相册
const fetchUserAlbums = async () => {
  try {
    loading.value = true
    const result = await albumService.getSocialPosts({ 
      userId: userStore.user?.id,
      type: 'albums' 
    })
    
    if (result.success) {
      albums.value = result.data.posts.map(post => ({
        id: post.id,
        title: post.title || post.content || '未命名相册',
        cover: post.images?.[0] || 'https://picsum.photos/300/200?random=' + post.id,
        photoCount: post.images?.length || 0,
        createdAt: post.createdAt
      }))
    } else {
      ElMessage.error(result.message || '获取相册失败')
    }
  } catch (error) {
    console.error('获取用户相册失败:', error)
    ElMessage.error('网络错误，获取相册失败')
  } finally {
    loading.value = false
  }
}

// 获取用户获赞照片
const fetchLikedPhotos = async () => {
  try {
    loading.value = true
    const result = await albumService.getSocialPosts({ 
      userId: userStore.user?.id,
      type: 'photos',
      sortBy: 'likes'
    })
    
    if (result.success) {
      likedPhotos.value = result.data.posts
        .filter(post => post.likes > 0)
        .slice(0, 12) // 只显示前12张
        .map(post => ({
          id: post.id,
          title: post.title || post.content || '未命名照片',
          thumbnail: post.images?.[0] || 'https://picsum.photos/200/200?random=' + post.id,
          likes: post.likes || 0
        }))
    } else {
      ElMessage.error(result.message || '获取获赞照片失败')
    }
  } catch (error) {
    console.error('获取获赞照片失败:', error)
    ElMessage.error('网络错误，获取获赞照片失败')
  } finally {
    loading.value = false
  }
}

// 获取用户活动记录
const fetchUserActivities = async () => {
  try {
    loading.value = true
    // 这里可以调用获取用户活动的API
    // 暂时使用相册数据生成活动记录
    const result = await albumService.getSocialPosts({ 
      userId: userStore.user?.id,
      limit: 10
    })
    
    if (result.success) {
      activities.value = result.data.posts.map(post => ({
        id: post.id,
        text: `上传了新${post.images?.length > 1 ? '相册' : '照片'}《${post.title || post.content || '未命名'}》`,
        createdAt: post.createdAt
      }))
    } else {
      ElMessage.error(result.message || '获取活动记录失败')
    }
  } catch (error) {
    console.error('获取活动记录失败:', error)
    ElMessage.error('网络错误，获取活动记录失败')
  } finally {
    loading.value = false
  }
}

// 初始化表单数据
const initializeForm = () => {
  if (userStore.user) {
    profileForm.nickname = userStore.user.nickname || userStore.user.username || ''
    profileForm.bio = userStore.user.bio || ''
    profileForm.gender = userStore.user.gender || ''
    profileForm.birthday = userStore.user.birthday || ''
    profileForm.location = userStore.user.location || ''
    profileForm.website = userStore.user.website || ''
  }
}

// 处理头像编辑
const handleAvatarEdit = () => {
  ElMessage.info('头像编辑功能开发中...')
}

// 处理个人资料分享
const handleShareProfile = () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    ElMessage.success('个人资料链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 保存个人资料
const handleSaveProfile = async () => {
  try {
    await profileFormRef.value.validate()
    saving.value = true
    
    const result = await userStore.updateProfile(profileForm)
    if (result.success) {
      ElMessage.success('个人资料更新成功')
      editMode.value = false
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    saving.value = false
  }
}

// 关闭编辑模式
const handleCloseEdit = () => {
  editMode.value = false
  initializeForm() // 重置表单数据
}

// 处理相册点击
const handleAlbumClick = (album) => {
  router.push(`/album/${album.id}`)
}

// 创建新相册
const handleCreateAlbum = () => {
  router.push('/albums/create')
}

// 处理照片点击
const handlePhotoClick = (photo) => {
  router.push(`/photo/${photo.id}`)
}

// 处理选项卡变化
const handleTabChange = (tab) => {
  activeTab.value = tab
  fetchTabData()
}

// 根据选项卡获取对应数据
const fetchTabData = async () => {
  if (!userStore.isAuthenticated) return
  
  switch (activeTab.value) {
    case 'albums':
      await fetchUserAlbums()
      break
    case 'liked':
      await fetchLikedPhotos()
      break
    case 'activity':
      await fetchUserActivities()
      break
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

onMounted(() => {
  initializeForm()
  if (userStore.isAuthenticated) {
    fetchTabData()
  }
})
</script>

<style scoped>
.profile-container {
  max-width: 1000px;
  margin: 0 auto;
}

.profile-header {
  position: relative;
  margin-bottom: 32px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-bg {
  height: 200px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  position: relative;
}

.header-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
}

.profile-info {
  display: flex;
  align-items: flex-start;
  padding: 32px;
  gap: 24px;
  margin-top: -60px;
  position: relative;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-details {
  flex: 1;
  margin-top: 40px;
}

.username {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.user-bio {
  color: #6b7280;
  font-size: 16px;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.user-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.profile-content {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.profile-tabs {
  padding: 24px 24px 0;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 24px 0;
}

.album-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.album-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.album-cover {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.album-card:hover .album-cover img {
  transform: scale(1.05);
}

.album-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 16px;
  font-size: 14px;
}

.album-info {
  padding: 16px;
}

.album-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.album-date {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.create-album {
  border: 2px dashed #d1d5db;
  background: #f9fafb;
}

.create-album:hover {
  border-color: #667eea;
  background: #f3f4f6;
}

.create-content {
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  gap: 8px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 24px 0;
}

.photo-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.photo-card:hover {
  transform: scale(1.02);
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.like-icon {
  color: #fbbf24;
}

.activity-list {
  padding: 24px 0;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 8px 0;
  color: #1f2937;
}

.activity-time {
  color: #6b7280;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px 16px;
  }
  
  .user-details {
    margin-top: 16px;
  }
  
  .user-stats {
    justify-content: center;
  }
  
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style> 