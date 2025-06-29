<template>
  <div class="profile-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="profile-main">
          <!-- 头像区域 -->
          <div class="avatar-section">
            <el-upload
              v-if="isOwnProfile"
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :on-change="handleAvatarChange"
              :auto-upload="false"
              :disabled="avatarUploading"
            >
              <el-avatar 
                :size="100" 
                :src="profileUser?.avatar" 
                :icon="UserFilled"
                class="profile-avatar"
              />
              <div class="avatar-overlay" :class="{ 'uploading': avatarUploading }">
                <el-icon v-if="!avatarUploading" class="camera-icon"><Camera /></el-icon>
                <el-icon v-else class="loading-icon"><Loading /></el-icon>
                <span v-if="avatarUploading" class="upload-text">上传中...</span>
              </div>
            </el-upload>
            <div v-else class="avatar-container">
              <el-avatar 
                :size="100" 
                :src="profileUser?.avatar" 
                :icon="UserFilled"
                class="profile-avatar"
              />
            </div>
            
            <!-- 在线状态 -->
            <div v-if="profileUser?.isOnline" class="status-indicator">
              <div class="status-dot"></div>
            </div>
          </div>
          
          <!-- 用户信息 -->
          <div class="user-info">
            <div class="user-title">
              <h1 class="username">{{ profileUser?.nickname || profileUser?.display_name || profileUser?.username }}</h1>
              <div class="user-badges">
                <el-tag v-if="profileUser?.isVip" type="warning" size="small" class="vip-badge">
                  <el-icon><Medal /></el-icon>
                  VIP
                </el-tag>
                <el-tag v-if="profileUser?.isVerified" type="success" size="small" class="verified-badge">
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
                <span>{{ formatJoinDate(profileUser?.created_at || profileUser?.createdAt) }} 加入</span>
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
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="header-actions">
          <template v-if="isOwnProfile">
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
              分享
            </el-button>
          </template>
          <template v-else>
            <el-button 
              :type="isFollowing ? 'default' : 'primary'" 
              @click="handleFollowUser"
              :loading="followLoading"
            >
              <el-icon><component :is="isFollowing ? Check : Plus" /></el-icon>
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
      
      <!-- 统计信息 -->
      <div class="stats-bar">
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
    </div>

    <!-- 内容导航 -->
    <div class="filter-bar">
      <div class="nav-tabs">
        <el-button 
          :type="activeTab === 'albums' ? 'primary' : ''"
          @click="activeTab = 'albums'"
        >
          <el-icon><PictureRounded /></el-icon>
          作品集
        </el-button>
        <el-button 
          :type="activeTab === 'activities' ? 'primary' : ''"
          @click="activeTab = 'activities'"
        >
          <el-icon><Histogram /></el-icon>
          动态
        </el-button>
        <el-button 
          v-if="isOwnProfile"
          :type="activeTab === 'stats' ? 'primary' : ''"
          @click="activeTab = 'stats'"
        >
          <el-icon><TrendCharts /></el-icon>
          统计
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-container">
      <!-- 作品集 -->
      <div v-if="activeTab === 'albums'" class="tab-content">
        <div v-if="albumsLoading" class="loading-container">
          <el-skeleton :rows="3" animated />
          <el-skeleton :rows="3" animated />
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="albums.length > 0" class="albums-grid">
          <div 
            v-for="album in displayAlbums" 
            :key="album.id" 
            class="album-card"
            @click="handleAlbumClick(album)"
          >
            <div class="album-cover">
              <img v-if="album.cover" :src="album.cover" :alt="album.title" loading="lazy" />
              <div v-else class="default-cover">
                <el-icon size="48"><PictureRounded /></el-icon>
                <span>暂无封面</span>
              </div>
              <div class="album-overlay">
                <div class="overlay-content">
                  <span class="photo-count">{{ album.photoCount }} 张</span>
                  <span v-if="album.privacy === 'private'" class="privacy-indicator">
                    <el-icon><Lock /></el-icon>
                    私密
                  </span>
                </div>
              </div>
            </div>
            <div class="album-info">
              <h3 class="album-title">{{ album.title }}</h3>
              <p class="album-meta">{{ formatDate(album.createdAt) }}</p>
            </div>
          </div>
          
          <!-- 查看更多 -->
          <div v-if="albums.length > 6" class="view-more-card" @click="$router.push('/my-albums')">
            <div class="view-more-content">
              <el-icon size="32"><ArrowRight /></el-icon>
              <span>查看全部 {{ albums.length }} 个相册</span>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <el-empty :description="isOwnProfile ? '还没有任何作品，快去创建第一个相册吧！' : '该用户还没有公开作品'">
            <el-button v-if="isOwnProfile" type="primary" @click="$router.push('/my-albums')">
              <el-icon><Plus /></el-icon>
              创建相册
            </el-button>
          </el-empty>
        </div>
      </div>
      
      <!-- 动态 -->
      <div v-if="activeTab === 'activities'" class="tab-content">
        <div v-if="activitiesLoading" class="loading-container">
          <el-skeleton :rows="4" animated />
        </div>
        <div v-else-if="activities.length > 0" class="activities-list">
          <div v-for="activity in activities" :key="activity.id" class="activity-item">
            <div class="activity-icon">
              <el-icon><component :is="getActivityIcon(activity.type)" /></el-icon>
            </div>
            <div class="activity-content">
              <p class="activity-text">{{ activity.text }}</p>
              <span class="activity-time">{{ formatRelativeTime(activity.time) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无动态记录" />
        </div>
      </div>
      
      <!-- 统计 -->
      <div v-if="activeTab === 'stats' && isOwnProfile" class="tab-content">
        <div class="stats-content">
          <div class="stats-cards">
            <div class="stats-card">
              <h4>本月数据</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ formatNumber(monthlyStats.views) }}</span>
                  <span class="stat-label">浏览量</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ formatNumber(monthlyStats.likes) }}</span>
                  <span class="stat-label">获赞数</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ formatNumber(monthlyStats.followers) }}</span>
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
        <div v-if="followersLoading" class="loading-state">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="followers.length > 0" class="user-list">
          <div v-for="follower in followers" :key="follower.id" class="user-item">
            <el-avatar :size="40" :src="follower.avatar" />
            <div class="user-info">
              <h4>{{ follower.nickname || follower.display_name || follower.username }}</h4>
              <p>{{ follower.bio || '这个人很懒，什么都没写~' }}</p>
            </div>
            <el-button v-if="!isOwnProfile" size="small" type="primary">关注</el-button>
          </div>
        </div>
        <el-empty v-else description="暂无粉丝" />
      </div>
    </el-dialog>

    <!-- 关注列表对话框 -->
    <el-dialog v-model="showFollowingDialog" title="关注列表" width="500px">
      <div class="following-list">
        <div v-if="followingLoading" class="loading-state">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="followingList.length > 0" class="user-list">
          <div v-for="following in followingList" :key="following.id" class="user-item">
            <el-avatar :size="40" :src="following.avatar" />
            <div class="user-info">
              <h4>{{ following.nickname || following.display_name || following.username }}</h4>
              <p>{{ following.bio || '这个人很懒，什么都没写~' }}</p>
            </div>
            <el-button v-if="isOwnProfile" size="small">取消关注</el-button>
          </div>
        </div>
        <el-empty v-else description="暂无关注" />
      </div>
    </el-dialog>
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
  View,
  Close,
  Histogram, 
  TrendCharts,
  Loading
} from '@element-plus/icons-vue'
import albumService from '../api/albumService.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 状态管理
const editMode = ref(false)
const loading = ref(false)
const saving = ref(false)
const followLoading = ref(false)
const albumsLoading = ref(false)
const activitiesLoading = ref(false)
const followersLoading = ref(false)
const followingLoading = ref(false)
const avatarUploading = ref(false)

const profileUser = ref(null)
const albums = ref([])
const activities = ref([])
const activeTab = ref('albums')
const showFollowersDialog = ref(false)
const showFollowingDialog = ref(false)

// 社交相关状态
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
  followersCount: profileUser.value?.followersCount || 0,
  followingCount: profileUser.value?.followingCount || 0,
  likesCount: profileUser.value?.likesCount || 0
}))

const displayAlbums = computed(() => {
  return albums.value.slice(0, 6)
})

const userTags = computed(() => {
  return profileUser.value?.tags || []
})

// 月度统计数据
const monthlyStats = reactive({
  views: 0,
  likes: 0,
  followers: 0,
  uploads: 0
})

// ===== API 调用方法 =====

// 获取用户资料
const fetchUserProfile = async () => {
  try {
    loading.value = true
    
    if (isOwnProfile.value) {
      // 获取当前用户信息
      const result = await albumService.getCurrentUser()
      if (result.success) {
        const user = result.data.user
        profileUser.value = {
          ...user,
          // 处理头像URL，如果是相对路径则添加服务器地址
          avatar: user.avatar_url ? 
            (user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:3000${user.avatar_url}`) 
            : null,
          isOnline: true, // 自己总是在线
          isVerified: user.isVerified || false,
          isVip: user.isVip || false
        }
        
        // 填充编辑表单
        profileForm.nickname = user.nickname || user.display_name || ''
        profileForm.bio = user.bio || ''
        profileForm.location = user.location || ''
        profileForm.website = user.website || ''
        profileForm.tags = user.tags || []
      } else {
        ElMessage.error('获取用户信息失败')
      }
    } else {
      // 获取其他用户资料
      const result = await albumService.getUserProfile(targetUserId.value)
      if (result.success) {
        const user = result.data.user
        profileUser.value = {
          ...user,
          // 处理头像URL
          avatar: user.avatar_url ? 
            (user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:3000${user.avatar_url}`) 
            : null,
          isOnline: Math.random() > 0.5, // 随机在线状态
          isVerified: user.isVerified || false,
          isVip: user.isVip || false
        }
      } else {
        ElMessage.error('获取用户资料失败')
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
    albumsLoading.value = true
    
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
          createdAt: album.createdAt || album.created_at
        }))
      }
    } else {
      // 获取其他用户的公开相册
      const result = await albumService.getUserPosts(targetUserId.value)
      if (result.success) {
        // 将动态转换为相册格式显示
        albums.value = result.data.posts.map(post => ({
          id: post.id,
          title: post.content || '无标题',
          description: post.content,
          cover: post.images && post.images.length > 0 ? post.images[0].url : null,
          photoCount: post.images ? post.images.length : 0,
          privacy: 'public',
          createdAt: post.createdAt
        }))
      }
    }
  } catch (error) {
    console.error('获取用户相册失败:', error)
  } finally {
    albumsLoading.value = false
  }
}

// 获取用户动态
const fetchUserActivities = async () => {
  try {
    activitiesLoading.value = true
    
    const result = await albumService.getUserPosts(targetUserId.value, { limit: 10 })
    if (result.success) {
      activities.value = result.data.posts.map(post => ({
        id: post.id,
        type: 'upload',
        text: `发布了新作品：${post.content || '无标题'}`,
        time: new Date(post.createdAt)
      }))
    }
  } catch (error) {
    console.error('获取用户动态失败:', error)
  } finally {
    activitiesLoading.value = false
  }
}

// 获取关注者列表
const fetchFollowers = async () => {
  try {
    followersLoading.value = true
    const result = await albumService.getFollowers(targetUserId.value)
    if (result.success) {
      followers.value = result.data.followers || []
    }
  } catch (error) {
    console.error('获取粉丝列表失败:', error)
  } finally {
    followersLoading.value = false
  }
}

// 获取关注列表  
const fetchFollowing = async () => {
  try {
    followingLoading.value = true
    const result = await albumService.getFollowing(targetUserId.value)
    if (result.success) {
      followingList.value = result.data.following || []
    }
  } catch (error) {
    console.error('获取关注列表失败:', error)
  } finally {
    followingLoading.value = false
  }
}

// ===== 事件处理方法 =====

// 头像上传
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像图片只能是 JPG/PNG/GIF/WebP 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleAvatarChange = async (file) => {
  try {
    // 先进行文件验证
    if (!beforeAvatarUpload(file.raw)) {
      return
    }

    // 设置上传状态
    avatarUploading.value = true

    // 调用API上传头像
    const result = await albumService.uploadAvatar(file.raw)

    if (result.success) {
      // 更新头像显示
      profileUser.value.avatar = `http://localhost:3000${result.data.avatar_url}`
      profileUser.value.avatar_url = result.data.avatar_url
      
      ElMessage.success(result.message || '头像上传成功')
    } else {
      ElMessage.error(result.message || '头像上传失败')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    ElMessage.error('头像上传失败')
  } finally {
    avatarUploading.value = false
  }
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
    
    const result = await albumService.updateProfile(profileForm)
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
  profileForm.nickname = profileUser.value?.nickname || profileUser.value?.display_name || ''
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
    
    let result
    if (isFollowing.value) {
      result = await albumService.unfollowUser(targetUserId.value)
    } else {
      result = await albumService.followUser(targetUserId.value)
    }
    
    if (result.success) {
      isFollowing.value = !isFollowing.value
      ElMessage.success(result.message || (isFollowing.value ? '关注成功' : '取消关注成功'))
      
      // 更新关注数量
      if (isFollowing.value) {
        profileUser.value.followersCount = (profileUser.value.followersCount || 0) + 1
      } else {
        profileUser.value.followersCount = Math.max((profileUser.value.followersCount || 0) - 1, 0)
      }
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

// 分享资料
const shareProfile = async () => {
  try {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    ElMessage.success('资料链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 开始聊天
const startChat = () => {
  ElMessage.info('私信功能开发中...')
}

// ===== 工具方法 =====

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatJoinDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).getFullYear() + '年'
}

const formatRelativeTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) return Math.floor(num / 1000) / 10 + 'w'
  if (num >= 1000) return Math.floor(num / 100) / 10 + 'k'
  return num.toString()
}

const getActivityIcon = (type) => {
  const icons = {
    upload: Upload,
    like: StarFilled,
    comment: ChatDotRound,
    follow: User
  }
  return icons[type] || Upload
}

// ===== 数据监听 =====

// 监听路由变化
watch(() => route.params.userId, () => {
  initializeData()
}, { immediate: false })

// 监听关注者对话框打开
watch(showFollowersDialog, (show) => {
  if (show && followers.value.length === 0) {
    fetchFollowers()
  }
})

// 监听关注列表对话框打开
watch(showFollowingDialog, (show) => {
  if (show && followingList.value.length === 0) {
    fetchFollowing()
  }
})

// ===== 初始化 =====

const initializeData = async () => {
  await Promise.all([
    fetchUserProfile(),
    fetchUserAlbums(),
    fetchUserActivities()
  ])
  
  // 获取月度统计数据（仅自己的资料）
  if (isOwnProfile.value) {
    // 这里可以调用统计API获取真实数据
    monthlyStats.views = Math.floor(Math.random() * 10000) + 1000
    monthlyStats.likes = Math.floor(Math.random() * 1000) + 100
    monthlyStats.followers = Math.floor(Math.random() * 100) + 10
    monthlyStats.uploads = albums.value.length
  }
}

onMounted(async () => {
  if (!userStore.initialized) {
    await userStore.initializeAuth()
  }
  await initializeData()
})
</script>

<style scoped>
.profile-container {
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

.profile-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.avatar-uploader {
  position: relative;
  cursor: pointer;
}

.avatar-container {
  position: relative;
}

.profile-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
  color: white;
}

.avatar-overlay.uploading {
  opacity: 1;
  background: rgba(0, 0, 0, 0.8);
}

.avatar-uploader:hover .avatar-overlay:not(.uploading) {
  opacity: 1;
}

.camera-icon {
  font-size: 20px;
}

.loading-icon {
  font-size: 20px;
  animation: rotate 1s linear infinite;
}

.upload-text {
  font-size: 12px;
  margin-top: 4px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.status-dot {
  width: 16px;
  height: 16px;
  background: #52c41a;
  border-radius: 50%;
  border: 2px solid white;
}

.user-info {
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

.vip-badge {
  background: #fbbf24;
  color: #92400e;
  border: none;
}

.verified-badge {
  background: #10b981;
  color: white;
  border: none;
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
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 14px;
}

.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-tag {
  background: #f0f9ff;
  color: #0284c7;
  border: none;
}

.header-actions {
  display: flex;
  gap: 12px;
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
  cursor: pointer;
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
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
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 24px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.nav-tabs {
  display: flex;
  gap: 12px;
}

.content-container {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-height: 400px;
}

.tab-content {
  padding: 0;
}

.loading-container {
  padding: 40px 0;
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
  transition: transform 0.3s ease;
}

.album-card:hover .album-cover img {
  transform: scale(1.1);
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

.privacy-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
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
}

.view-more-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-more-card:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.view-more-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #667eea;
  font-weight: 600;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.activity-item:hover {
  background: #f3f4f6;
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

.stats-content {
  padding: 0;
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

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.loading-state {
  padding: 20px 0;
}

.followers-list, .following-list {
  max-height: 400px;
  overflow-y: auto;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.user-item:last-child {
  border-bottom: none;
}

.user-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #1f2937;
}

.user-info p {
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .profile-container {
    padding: 0 16px;
  }
  
  .page-header {
    padding: 24px;
  }
  
  .header-content {
    gap: 24px;
  }
  
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .profile-main {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
  
  .username {
    font-size: 24px;
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .stats-bar {
    justify-content: space-around;
  }
  
  .filter-bar {
    padding: 16px;
  }
  
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
  
  .nav-tabs {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .profile-container {
    padding: 0 12px;
  }
  
  .page-header {
    padding: 20px;
  }
  
  .header-content {
    gap: 16px;
  }
  
  .username {
    font-size: 22px;
  }
  
  .stats-bar {
    gap: 16px;
  }
  
  .albums-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

