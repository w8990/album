<template>
  <div class="profile-container">
    <!-- 用户资料卡片 -->
    <div class="profile-card">
      <div class="profile-header">
        <el-avatar 
          :size="120" 
          :src="profileUser?.avatar" 
          :icon="UserFilled"
          class="profile-avatar"
        />
        <div class="profile-info">
          <h1 class="username">{{ profileUser?.nickname || profileUser?.username }}</h1>
          <p class="user-bio">{{ profileUser?.bio || '这个人很懒，什么都没写~' }}</p>
          
          <!-- 用户统计 -->
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">{{ userStats.albumCount }}</span>
              <span class="stat-label">相册</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.followersCount }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.followingCount }}</span>
              <span class="stat-label">关注</span>
            </div>
          </div>
          
          <!-- 智能切换按钮 -->
          <div class="action-buttons">
            <template v-if="isOwnProfile">
              <!-- 自己的资料 - 编辑功能 -->
              <el-button type="primary" @click="editMode = true">
                <el-icon><Edit /></el-icon>
                编辑资料
              </el-button>
              <el-button @click="$router.push('/my-albums')">
                <el-icon><PictureRounded /></el-icon>
                管理相册
              </el-button>
            </template>
            <template v-else>
              <!-- 他人资料 - 社交功能 -->
              <el-button type="primary" @click="handleFollowUser">
                <el-icon><Plus /></el-icon>
                关注
              </el-button>
              <el-button>
                <el-icon><ChatDotRound /></el-icon>
                私信
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editMode" title="编辑个人资料" width="600px">
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
      </el-form>
      <template #footer>
        <el-button @click="editMode = false">取消</el-button>
        <el-button type="primary" @click="handleSaveProfile" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 内容展示区 -->
    <div class="profile-content">
      <div class="content-header">
        <h2>{{ isOwnProfile ? '我的作品' : '精选作品' }}</h2>
        <el-button 
          v-if="albums.length > 0 && isOwnProfile" 
          type="primary" 
          @click="$router.push('/my-albums')"
        >
          查看全部
        </el-button>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="2" animated />
      </div>
      
      <!-- 作品展示 -->
      <div v-else-if="albums.length > 0" class="albums-grid">
        <div 
          v-for="album in displayAlbums" 
          :key="album.id" 
          class="album-card"
          @click="handleAlbumClick(album)"
        >
          <div class="album-cover">
            <img v-if="album.cover" :src="album.cover" :alt="album.title" />
            <div v-else class="default-cover">
              <el-icon size="48"><PictureRounded /></el-icon>
              <span>暂无封面</span>
            </div>
          </div>
          <div class="album-info">
            <h3>{{ album.title }}</h3>
            <p>{{ album.photoCount }} 张照片</p>
            <span class="album-date">{{ formatDate(album.createdAt) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty :description="isOwnProfile ? '还没有任何作品，快去创建第一个相册吧！' : '该用户还没有公开作品'">
          <el-button v-if="isOwnProfile" type="primary" @click="$router.push('/my-albums')">
            <el-icon><Plus /></el-icon>
            创建相册
          </el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  Edit,
  PictureRounded,
  Plus,
  ChatDotRound
} from '@element-plus/icons-vue'
import albumService from '../api/albumService.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 状态
const editMode = ref(false)
const loading = ref(false)
const saving = ref(false)
const profileUser = ref(null)
const albums = ref([])

// 表单数据
const profileForm = reactive({
  nickname: '',
  bio: ''
})

// 表单验证规则
const profileRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const isOwnProfile = computed(() => {
  const targetUserId = route.params.userId
  return !targetUserId || (userStore.user && targetUserId == userStore.user.id)
})

const targetUserId = computed(() => {
  return route.params.userId || userStore.user?.id
})

const userStats = computed(() => ({
  albumCount: albums.value.length,
  followersCount: profileUser.value?.followersCount || 0,
  followingCount: profileUser.value?.followingCount || 0
}))

const displayAlbums = computed(() => {
  // 只显示前6个相册
  return albums.value.slice(0, 6)
})

// 获取用户资料
const fetchUserProfile = async () => {
  try {
    loading.value = true
    
    if (isOwnProfile.value) {
      profileUser.value = userStore.user
      profileForm.nickname = userStore.user?.nickname || ''
      profileForm.bio = userStore.user?.bio || ''
    } else {
      // 获取他人资料的逻辑（暂时使用模拟数据）
      profileUser.value = {
        id: targetUserId.value,
        username: user_,
        nickname: 用户,
        bio: '这是一个公开的用户资料',
        avatar: null,
        followersCount: Math.floor(Math.random() * 1000),
        followingCount: Math.floor(Math.random() * 100)
      }
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
    ElMessage.error('获取用户资料失败')
  } finally {
    loading.value = false
  }
}

// 获取用户相册
const fetchUserAlbums = async () => {
  try {
    if (isOwnProfile.value) {
      const result = await albumService.getAlbums()
      if (result.success) {
        albums.value = result.data.albums.map(album => ({
          id: album.id,
          title: album.name,
          cover: album.cover,
          photoCount: album.fileCount || 0,
          createdAt: album.createdAt
        }))
      }
    } else {
      // 获取他人公开相册（暂时为空）
      albums.value = []
    }
  } catch (error) {
    console.error('获取用户相册失败:', error)
  }
}

// 保存个人资料
const handleSaveProfile = async () => {
  try {
    saving.value = true
    const result = await userStore.updateProfile(profileForm)
    if (result.success) {
      ElMessage.success('个人资料更新成功')
      editMode.value = false
      profileUser.value = userStore.user
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('更新个人资料失败:', error)
    ElMessage.error('更新失败')
  } finally {
    saving.value = false
  }
}

// 处理相册点击
const handleAlbumClick = (album) => {
  router.push(/album/)
}

// 处理关注用户
const handleFollowUser = () => {
  ElMessage.info('关注功能开发中...')
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 初始化数据
const initializeData = async () => {
  await fetchUserProfile()
  await fetchUserAlbums()
}

// 监听路由变化
watch(() => route.params.userId, () => {
  initializeData()
}, { immediate: true })

onMounted(() => {
  if (!userStore.initialized) {
    userStore.initializeAuth().then(() => {
      initializeData()
    })
  } else {
    initializeData()
  }
})
</script>

<style scoped>
.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.profile-avatar {
  flex-shrink: 0;
  border: 4px solid #f0f2f5;
}

.profile-info {
  flex: 1;
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
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.content-header h2 {
  margin: 0;
  color: #1f2937;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.album-card {
  background: #f9fafb;
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
  height: 160px;
  overflow: hidden;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  color: #8b9dc3;
}

.album-info {
  padding: 16px;
}

.album-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1f2937;
}

.album-info p {
  margin: 0 0 4px 0;
  color: #6b7280;
  font-size: 14px;
}

.album-date {
  color: #9ca3af;
  font-size: 12px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.loading-container {
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .user-stats {
    justify-content: center;
  }
  
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
