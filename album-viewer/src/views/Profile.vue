<template>
  <div class="profile-container">
    <!-- 背景装饰 -->
    <div class="profile-background">
      <div class="bg-gradient"></div>
    </div>

    <!-- 用户资料卡片 -->
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-section">
          <el-upload
            v-if="isOwnProfile"
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :on-change="handleAvatarChange"
            :auto-upload="false"
          >
            <el-avatar 
              :size="120" 
              :src="profileUser?.avatar" 
              :icon="UserFilled"
              class="profile-avatar"
            />
            <div class="avatar-overlay">
              <el-icon><Camera /></el-icon>
              <span>更换头像</span>
            </div>
          </el-upload>
          <el-avatar 
            v-else
            :size="120" 
            :src="profileUser?.avatar" 
            :icon="UserFilled"
            class="profile-avatar"
          />
          
          <!-- 在线状态 -->
          <div v-if="profileUser?.isOnline" class="online-indicator">
            <div class="online-dot"></div>
          </div>
        </div>
        
        <div class="profile-info">
          <div class="user-title">
            <h1 class="username">{{ profileUser?.nickname || profileUser?.username }}</h1>
            <div class="user-badges">
              <el-tag v-if="profileUser?.isVip" type="warning" size="small">
                <el-icon><Medal /></el-icon>
                VIP
              </el-tag>
              <el-tag v-if="profileUser?.isVerified" type="success" size="small">
                <el-icon><Check /></el-icon>
                已验证
              </el-tag>
            </div>
          </div>
          
          <p class="user-bio">{{ profileUser?.bio || '这个人很懒，什么都没写~' }}</p>
          
          <!-- 用户详细信息 -->
          <div class="user-details">
            <div v-if="profileUser?.location" class="detail-item">
              <el-icon><Location /></el-icon>
              <span>{{ profileUser.location }}</span>
            </div>
            <div v-if="profileUser?.website" class="detail-item">
              <el-icon><Link /></el-icon>
              <el-link :href="profileUser.website" target="_blank">个人网站</el-link>
            </div>
            <div class="detail-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatJoinDate(profileUser?.createdAt) }} 加入</span>
            </div>
          </div>
          
          <!-- 用户统计 -->
          <div class="user-stats">
            <div class="stat-item" @click="showFollowersDialog = true">
              <span class="stat-number">{{ formatNumber(userStats.followersCount) }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item" @click="showFollowingDialog = true">
              <span class="stat-number">{{ formatNumber(userStats.followingCount) }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.albumCount }}</span>
              <span class="stat-label">相册</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ formatNumber(userStats.likesCount) }}</span>
              <span class="stat-label">获赞</span>
            </div>
          </div>
          
          <!-- 用户标签 -->
          <div v-if="userTags.length > 0" class="user-tags">
            <el-tag 
              v-for="tag in userTags" 
              :key="tag" 
              size="small" 
              class="user-tag"
            >
              {{ tag }}
            </el-tag>
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
              <el-button @click="shareProfile">
                <el-icon><Share /></el-icon>
                分享资料
              </el-button>
            </template>
            <template v-else>
              <!-- 他人资料 - 社交功能 -->
              <el-button 
                :type="isFollowing ? 'default' : 'primary'" 
                @click="handleFollowUser"
                :loading="followLoading"
              >
                <el-icon><component :is="getIconComponent(isFollowing ? 'Check' : 'Plus')" /></el-icon>
                {{ isFollowing ? '已关注' : '关注' }}
              </el-button>
              <el-button @click="startChat">
                <el-icon><ChatDotRound /></el-icon>
                私信
              </el-button>
              <el-button @click="shareProfile">
                <el-icon><Share /></el-icon>
                分享
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editMode" title="编辑个人资料" width="600px" :before-close="handleCloseEdit">
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
        
        <el-form-item label="所在地区">
          <el-input v-model="profileForm.location" placeholder="如：北京市朝阳区" />
        </el-form-item>
        
        <el-form-item label="个人网站">
          <el-input v-model="profileForm.website" placeholder="https://example.com" />
        </el-form-item>
        
        <el-form-item label="兴趣标签">
          <el-tag 
            v-for="tag in profileForm.tags" 
            :key="tag"
            closable
            @close="removeTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="inputVisible"
            ref="inputRef"
            v-model="inputValue"
            size="small"
            class="tag-input"
            @keyup.enter="handleInputConfirm"
            @blur="handleInputConfirm"
          />
          <el-button v-else @click="showInput" size="small" class="new-tag-btn">
            <el-icon><Plus /></el-icon>
            添加标签
          </el-button>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleCloseEdit">取消</el-button>
        <el-button type="primary" @click="handleSaveProfile" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 关注者列表对话框 -->
    <el-dialog v-model="showFollowersDialog" title="粉丝列表" width="500px">
      <div class="followers-list">
        <div v-for="follower in followers" :key="follower.id" class="follower-item">
          <el-avatar :size="40" :src="follower.avatar" />
          <div class="follower-info">
            <h4>{{ follower.nickname }}</h4>
            <p>{{ follower.bio }}</p>
          </div>
          <el-button v-if="!isOwnProfile" size="small" type="primary">关注</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 关注列表对话框 -->
    <el-dialog v-model="showFollowingDialog" title="关注列表" width="500px">
      <div class="following-list">
        <div v-for="following in followingList" :key="following.id" class="following-item">
          <el-avatar :size="40" :src="following.avatar" />
          <div class="following-info">
            <h4>{{ following.nickname }}</h4>
            <p>{{ following.bio }}</p>
          </div>
          <el-button v-if="isOwnProfile" size="small">取消关注</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 内容选项卡 -->
    <div class="profile-content">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="作品集" name="albums">
          <div class="tab-content">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
              <el-skeleton :rows="2" animated />
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
                  <div class="album-overlay">
                    <div class="overlay-info">
                      <span class="photo-count">{{ album.photoCount }} 张</span>
                      <span class="album-privacy" v-if="album.privacy === 'private'">
                        <el-icon><Lock /></el-icon>
                        私密
                      </span>
                    </div>
                  </div>
                </div>
                <div class="album-info">
                  <h3>{{ album.title }}</h3>
                  <p>{{ album.description || '暂无描述' }}</p>
                  <span class="album-date">{{ formatDate(album.createdAt) }}</span>
                </div>
              </div>
              
              <!-- 查看更多按钮 -->
              <div v-if="albums.length > 6 && isOwnProfile" class="view-more-card">
                <el-button type="primary" @click="$router.push('/my-albums')" class="view-more-btn">
                  <el-icon><ArrowRight /></el-icon>
                  查看全部 {{ albums.length }} 个相册
                </el-button>
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
        </el-tab-pane>
        
        <el-tab-pane label="最近动态" name="activities">
          <div class="activities-content">
            <div v-if="activities.length > 0" class="activities-list">
              <div v-for="activity in activities" :key="activity.id" class="activity-item">
                <div class="activity-icon">
                  <el-icon><component :is="getIconComponent(activity.icon)" /></el-icon>
                </div>
                <div class="activity-content">
                  <p class="activity-text">{{ activity.text }}</p>
                  <span class="activity-time">{{ formatRelativeTime(activity.time) }}</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无动态记录" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane v-if="isOwnProfile" label="数据统计" name="stats">
          <div class="stats-content">
            <div class="stats-cards">
              <div class="stats-card">
                <h4>本月数据</h4>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-value">{{ monthlyStats.views }}</span>
                    <span class="stat-label">浏览量</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ monthlyStats.likes }}</span>
                    <span class="stat-label">获赞数</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ monthlyStats.followers }}</span>
                    <span class="stat-label">新增粉丝</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ monthlyStats.uploads }}</span>
                    <span class="stat-label">上传作品</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Edit,
  Camera,
  Message,
  UserFilled,
  PictureRounded,
  Plus,
  ChatDotRound,
  Share,
  Check,
  Medal,
  Location,
  Link,
  Calendar,
  Lock,
  ArrowRight,
  Upload,
  Star,
  StarFilled,
  View
} from '@element-plus/icons-vue'
import albumService from '../api/albumService.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 状态
const editMode = ref(false)
const loading = ref(false)
const saving = ref(false)
const followLoading = ref(false)
const profileUser = ref(null)
const albums = ref([])
const activeTab = ref('albums')
const showFollowersDialog = ref(false)
const showFollowingDialog = ref(false)

// 关注状态
const isFollowing = ref(false)
const followers = ref([])
const followingList = ref([])

// 标签输入
const inputVisible = ref(false)
const inputValue = ref('')
const inputRef = ref()

// 表单数据
const profileForm = reactive({
  nickname: '',
  bio: '',
  location: '',
  website: '',
  tags: []
})

const profileFormRef = ref()

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
  followersCount: profileUser.value?.followersCount || 1234,
  followingCount: profileUser.value?.followingCount || 89,
  likesCount: profileUser.value?.likesCount || 5678
}))

const displayAlbums = computed(() => {
  return albums.value.slice(0, 6)
})

const userTags = computed(() => {
  return profileUser.value?.tags || ['摄影爱好者', '旅行', '生活记录']
})

// 活动数据
const activities = ref([
  {
    id: 1,
    icon: 'Upload',
    text: '上传了新相册《春日景色》',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 2,
    icon: 'StarFilled',
    text: '获得了10个新点赞',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: 3,
    icon: 'Star',
    text: '作品被收藏了5次',
    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
])

// 图标映射，避免动态导入问题
const iconComponents = {
  Upload,
  Star,
  StarFilled,
  View,
  Medal,
  Plus,
  Check
}

// 获取图标组件
const getIconComponent = (iconName) => {
  console.log('获取图标组件:', iconName)
  return iconComponents[iconName] || Star // 默认使用Star图标
}

// 月度统计
const monthlyStats = reactive({
  views: 12450,
  likes: 892,
  followers: 156,
  uploads: 23
})

// 获取用户资料
const fetchUserProfile = async () => {
  try {
    loading.value = true
    
    if (isOwnProfile.value) {
      profileUser.value = {
        ...userStore.user,
        isOnline: true,
        isVerified: true,
        isVip: false
      }
      
      // 填充编辑表单
      profileForm.nickname = userStore.user?.nickname || userStore.user?.display_name || ''
      profileForm.bio = userStore.user?.bio || ''
      profileForm.location = userStore.user?.location || ''
      profileForm.website = userStore.user?.website || ''
      profileForm.tags = userStore.user?.tags || []
    } else {
      // 获取他人资料的逻辑（使用模拟数据）
      profileUser.value = {
        id: targetUserId.value,
        username: `user_${targetUserId.value}`,
        nickname: `用户${targetUserId.value}`,
        bio: '这是一个公开的用户资料',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUserId.value}`,
        location: '北京市',
        website: '',
        isOnline: Math.random() > 0.5,
        isVerified: Math.random() > 0.7,
        isVip: Math.random() > 0.8,
        followersCount: Math.floor(Math.random() * 1000) + 100,
        followingCount: Math.floor(Math.random() * 100) + 10,
        likesCount: Math.floor(Math.random() * 5000) + 500,
        tags: ['摄影', '设计', '艺术']
      }
      
      // 随机关注状态
      isFollowing.value = Math.random() > 0.5
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
          description: album.description,
          cover: album.cover,
          photoCount: album.fileCount || 0,
          privacy: album.privacy || 'public',
          createdAt: album.createdAt
        }))
      }
    } else {
      // 获取他人公开相册（模拟数据）
      albums.value = Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        title: `相册 ${i + 1}`,
        description: '精彩作品集',
        cover: `https://picsum.photos/400/300?random=${i + 30}`,
        photoCount: Math.floor(Math.random() * 50) + 10,
        privacy: 'public',
        createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
      }))
    }
  } catch (error) {
    console.error('获取用户相册失败:', error)
  }
}

// 头像上传相关
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像图片只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleAvatarChange = (file) => {
  // 这里可以实现头像上传逻辑
  ElMessage.success('头像上传功能开发中...')
}

// 标签管理
const removeTag = (tag) => {
  profileForm.tags.splice(profileForm.tags.indexOf(tag), 1)
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value && !profileForm.tags.includes(inputValue.value)) {
    profileForm.tags.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
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
      profileUser.value = { ...profileUser.value, ...profileForm }
    } else {
      ElMessage.error(result.message || '更新失败')
    }
  } catch (error) {
    console.error('更新个人资料失败:', error)
    ElMessage.error('更新失败')
  } finally {
    saving.value = false
  }
}

const handleCloseEdit = () => {
  editMode.value = false
  // 重置表单
  profileForm.nickname = profileUser.value?.nickname || ''
  profileForm.bio = profileUser.value?.bio || ''
  profileForm.location = profileUser.value?.location || ''
  profileForm.website = profileUser.value?.website || ''
  profileForm.tags = [...(profileUser.value?.tags || [])]
}

// 处理相册点击
const handleAlbumClick = (album) => {
  router.push(`/album/${album.id}`)
}

// 处理关注用户
const handleFollowUser = async () => {
  try {
    followLoading.value = true
    // 这里调用关注/取消关注API
    isFollowing.value = !isFollowing.value
    ElMessage.success(isFollowing.value ? '关注成功' : '取消关注成功')
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

// 分享资料
const shareProfile = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('资料链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 开始聊天
const startChat = () => {
  ElMessage.info('私信功能开发中...')
}

// 工具方法
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatJoinDate = (dateString) => {
  return new Date(dateString).getFullYear() + '年'
}

const formatRelativeTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

const formatNumber = (num) => {
  if (num >= 10000) return Math.floor(num / 1000) / 10 + 'w'
  if (num >= 1000) return Math.floor(num / 100) / 10 + 'k'
  return num.toString()
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
  position: relative;
}

.profile-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  z-index: 0;
}

.bg-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
  margin-top: 120px;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 32px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.avatar-uploader {
  position: relative;
  cursor: pointer;
}

.profile-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
  font-size: 12px;
}

.avatar-uploader:hover .avatar-overlay {
  opacity: 1;
}

.online-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.online-dot {
  width: 16px;
  height: 16px;
  background: #52c41a;
  border-radius: 50%;
  border: 2px solid white;
}

.profile-info {
  flex: 1;
}

.user-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.username {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1f2937;
}

.user-badges {
  display: flex;
  gap: 8px;
}

.user-bio {
  color: #6b7280;
  font-size: 16px;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.user-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 14px;
}

.user-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
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

.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.user-tag {
  background: #f0f9ff;
  color: #0284c7;
  border: none;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.profile-content {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.tab-content {
  padding-top: 20px;
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
  transition: transform 0.3s ease;
}

.album-card:hover .album-cover img {
  transform: scale(1.05);
}

.album-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  display: flex;
  align-items: flex-end;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.album-card:hover .album-overlay {
  opacity: 1;
}

.overlay-info {
  color: white;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.album-privacy {
  display: flex;
  align-items: center;
  gap: 4px;
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
  font-weight: 600;
}

.album-info p {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
}

.album-date {
  color: #9ca3af;
  font-size: 12px;
}

.view-more-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.view-more-card:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.view-more-btn {
  font-size: 16px;
  padding: 12px 24px;
}

.activities-list {
  space-y: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 14px;
}

.activity-time {
  color: #6b7280;
  font-size: 12px;
}

.stats-cards {
  display: grid;
  gap: 24px;
}

.stats-card {
  background: #f9fafb;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.stats-card h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
}

.stats-grid .stat-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  display: block;
}

.followers-list, .following-list {
  max-height: 400px;
  overflow-y: auto;
}

.follower-item, .following-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.follower-info, .following-info {
  flex: 1;
}

.follower-info h4, .following-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #1f2937;
}

.follower-info p, .following-info p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}

.tag-input {
  width: 100px;
  margin-right: 8px;
}

.new-tag-btn {
  border: 1px dashed #d9d9d9;
  background: white;
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
    gap: 20px;
  }
  
  .user-stats {
    justify-content: center;
  }
  
  .user-details {
    justify-content: center;
  }
  
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .user-title {
    flex-direction: column;
    gap: 8px;
  }
  
  .username {
    font-size: 24px;
  }
}
</style>
