<template>
  <div class="social-feed">
    <!-- 发布动态栏 -->
    <div v-if="userAuth.isLoggedIn.value" class="post-composer">
      <div class="composer-header">
        <el-avatar :size="40">{{ userAuth.userInfo.username.charAt(0).toUpperCase() }}</el-avatar>
        <span class="username">{{ userAuth.userInfo.username }}</span>
      </div>
      <el-button type="primary" @click="showPublishDialog = true" class="publish-btn">
        <el-icon><Plus /></el-icon>
        分享新相册
      </el-button>
    </div>

    <!-- 筛选和搜索 -->
    <div class="feed-filters">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="推荐" name="recommend"></el-tab-pane>
        <el-tab-pane label="关注" name="following"></el-tab-pane>
        <el-tab-pane label="最新" name="newest"></el-tab-pane>
        <el-tab-pane label="热门" name="popular"></el-tab-pane>
      </el-tabs>
      
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户、话题..."
        class="search-input"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 动态流 -->
    <div class="feed-container" v-loading="loading">
      <div
        v-for="post in filteredPosts"
        :key="post.id"
        class="feed-item"
      >
        <!-- 用户头部信息 -->
        <div class="post-header">
          <div class="user-info">
            <el-avatar :size="45" @click="viewUserProfile(post.author)">
              {{ post.author.charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="user-details">
              <div class="username" @click="viewUserProfile(post.author)">{{ post.author }}</div>
              <div class="post-time">{{ formatTimeAgo(post.createdAt) }}</div>
              <div v-if="post.location" class="location">
                <el-icon><Location /></el-icon>
                {{ post.location }}
              </div>
            </div>
          </div>
          <el-dropdown>
            <el-icon class="more-btn"><MoreFilled /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="reportPost(post)">举报</el-dropdown-item>
                <el-dropdown-item v-if="post.authorId === userAuth.userInfo.userId" @click="deletePost(post)">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 相册内容 -->
        <div class="post-content">
          <div v-if="post.content" class="post-text">{{ post.content }}</div>
          
          <!-- 话题标签 -->
          <div v-if="post.tags && post.tags.length" class="post-tags">
            <el-tag
              v-for="tag in post.tags"
              :key="tag"
              size="small"
              @click="searchByTag(tag)"
              class="tag-item"
            >
              #{{ tag }}
            </el-tag>
          </div>

          <!-- 图片网格 -->
          <div class="images-grid" :class="getGridClass(post.images.length)">
            <div
              v-for="(image, index) in post.images.slice(0, 9)"
              :key="index"
              class="image-item"
              @click="openImageViewer(post, index)"
            >
              <el-image
                :src="image.url"
                :alt="image.title"
                fit="cover"
                class="feed-image"
                :preview-src-list="[]"
              />
              <!-- 显示更多图片数量 -->
              <div v-if="index === 8 && post.images.length > 9" class="more-images-overlay">
                +{{ post.images.length - 9 }}
              </div>
            </div>
          </div>
        </div>

        <!-- 互动数据 -->
        <div class="post-stats">
          <span v-if="post.likes > 0" class="stat-item" @click="showLikesList(post)">
            <el-icon><StarFilled /></el-icon>
            {{ post.likes }}人点赞
          </span>
          <span v-if="post.comments > 0" class="stat-item" @click="openComments(post)">
            <el-icon><ChatDotSquare /></el-icon>
            {{ post.comments }}条评论
          </span>
          <span v-if="post.shares > 0" class="stat-item">
            <el-icon><Share /></el-icon>
            {{ post.shares }}次分享
          </span>
        </div>

        <!-- 互动按钮 -->
        <div class="post-actions">
          <el-button
            text
            @click="toggleLike(post)"
            class="action-btn"
            :class="{ 'liked': post.isLiked }"
          >
            <el-icon><StarFilled /></el-icon>
            <span class="action-text">{{ post.isLiked ? '已赞' : '点赞' }}</span>
            <span v-if="post.likes > 0" class="action-count">({{ post.likes }})</span>
          </el-button>
          
          <el-button
            text
            @click="openComments(post)"
            class="action-btn"
          >
            <el-icon><ChatDotSquare /></el-icon>
            <span class="action-text">评论</span>
            <span v-if="post.comments > 0" class="action-count">({{ post.comments }})</span>
          </el-button>
          
          <el-button
            text
            @click="sharePost(post)"
            class="action-btn"
          >
            <el-icon><Share /></el-icon>
            <span class="action-text">分享</span>
            <span v-if="post.shares > 0" class="action-count">({{ post.shares }})</span>
          </el-button>

          <el-button
            text
            @click="toggleFavorite(post)"
            class="action-btn"
            :class="{ 'favorited': post.isFavorited }"
          >
            <el-icon><component :is="post.isFavorited ? 'StarFilled' : 'Star'" /></el-icon>
            <span class="action-text">{{ post.isFavorited ? '已收藏' : '收藏' }}</span>
          </el-button>
        </div>

        <!-- 评论预览 -->
        <div v-if="post.latestComments && post.latestComments.length" class="comments-preview">
          <div
            v-for="comment in post.latestComments.slice(0, 2)"
            :key="comment.id"
            class="comment-preview"
          >
            <span class="comment-author">{{ comment.author }}</span>
            <span class="comment-text">{{ comment.content }}</span>
          </div>
          <div v-if="post.comments > 2" class="view-all-comments" @click="openComments(post)">
            查看全部{{ post.comments }}条评论
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more">
        <el-button @click="loadMorePosts" :loading="loadingMore">
          加载更多
        </el-button>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && filteredPosts.length === 0" class="empty-state">
        <el-empty description="暂无动态">
          <el-button type="primary" @click="showPublishDialog = true" v-if="userAuth.isLoggedIn.value">
            发布第一条动态
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 发布相册对话框 -->
    <el-dialog
      v-model="showPublishDialog"
      title="分享新相册"
      width="600px"
      :fullscreen="isMobile"
    >
      <div class="publish-form">
        <el-form ref="publishFormRef" :model="publishForm" :rules="publishRules">
          <el-form-item>
            <el-input
              v-model="publishForm.content"
              type="textarea"
              :rows="4"
              placeholder="分享你的精彩瞬间..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item>
            <el-input
              v-model="publishForm.tags"
              placeholder="添加话题标签，用空格分隔 (如：旅行 美食 生活)"
            />
          </el-form-item>
          
          <el-form-item>
            <el-input
              v-model="publishForm.location"
              placeholder="添加位置 (可选)"
            />
          </el-form-item>
          
          <el-form-item label="上传图片">
            <el-upload
              ref="uploadRef"
              :file-list="publishForm.images"
              list-type="picture-card"
              :auto-upload="false"
              :on-change="handleImageChange"
              :on-remove="handleImageRemove"
              multiple
              accept="image/*"
              :limit="9"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">最多上传9张图片</div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPublishDialog = false">取消</el-button>
          <el-button type="primary" @click="publishPost" :disabled="!canPublish">
            发布
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 图片查看器 -->
    <el-dialog
      v-model="showImageViewer"
      width="90%"
      :fullscreen="isMobile"
      class="image-viewer-dialog"
    >
      <div v-if="currentPost" class="image-viewer">
        <!-- 用户信息 -->
        <div class="viewer-user-info">
          <el-avatar :size="40">{{ currentPost.author.charAt(0).toUpperCase() }}</el-avatar>
          <div class="user-details">
            <div class="username">{{ currentPost.author }}</div>
            <div class="post-time">{{ formatTimeAgo(currentPost.createdAt) }}</div>
            <div v-if="currentPost.location" class="location">
              <el-icon><Location /></el-icon>
              {{ currentPost.location }}
            </div>
          </div>
        </div>

        <el-carousel
          ref="carouselRef"
          :height="isMobile ? '300px' : '450px'"
          indicator-position="outside"
          arrow="always"
        >
          <el-carousel-item
            v-for="(image, index) in currentPost.images"
            :key="index"
          >
            <el-image
              :src="image.url"
              :alt="image.title"
              fit="contain"
              class="viewer-image"
            />
          </el-carousel-item>
        </el-carousel>

        <!-- 内容和标签 -->
        <div v-if="currentPost.content || (currentPost.tags && currentPost.tags.length)" class="viewer-content">
          <div v-if="currentPost.content" class="post-text">{{ currentPost.content }}</div>
          <div v-if="currentPost.tags && currentPost.tags.length" class="post-tags">
            <el-tag
              v-for="tag in currentPost.tags"
              :key="tag"
              size="small"
              class="tag-item"
            >
              #{{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 评论对话框 -->
    <el-dialog
      v-model="showComments"
      title="评论"
      width="600px"
      :fullscreen="isMobile"
    >
      <div class="comments-section">
        <!-- 发表评论 -->
        <div v-if="userAuth.isLoggedIn.value" class="comment-form">
          <div class="comment-input-wrapper">
            <el-avatar :size="32">{{ userAuth.userInfo.username.charAt(0).toUpperCase() }}</el-avatar>
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="2"
              placeholder="写下你的评论..."
              maxlength="500"
              show-word-limit
              class="comment-input"
            />
          </div>
          <div class="comment-actions">
            <el-button type="primary" @click="submitComment" :disabled="!newComment.trim()">
              发表
            </el-button>
          </div>
        </div>
        
        <div v-else class="login-prompt">
          <p>登录后参与讨论</p>
          <el-button type="primary" @click="$emit('show-login')">立即登录</el-button>
        </div>
        
        <!-- 评论列表 -->
        <div class="comments-list">
          <div
            v-for="comment in currentComments"
            :key="comment.id"
            class="comment-item"
          >
            <el-avatar :size="36">{{ comment.author.charAt(0).toUpperCase() }}</el-avatar>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.author }}</span>
                <span class="comment-time">{{ formatTimeAgo(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
              <div class="comment-actions">
                <el-button text @click="toggleCommentLike(comment)">
                  <el-icon :class="{ 'liked': comment.isLiked }"><StarFilled /></el-icon>
                  {{ comment.likes || 0 }}
                </el-button>
                <el-button text @click="replyToComment(comment)">回复</el-button>
              </div>
            </div>
          </div>
          
          <div v-if="currentComments.length === 0" class="no-comments">
            <el-empty description="暂无评论" :image-size="60" />
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 分享对话框 -->
    <el-dialog v-model="showShareDialog" title="分享动态" width="400px">
      <div class="share-options">
        <el-button type="primary" @click="copyLink" class="share-btn">
          <el-icon><Link /></el-icon>
          复制链接
        </el-button>
        <el-button type="success" @click="shareToWeChat" class="share-btn">
          <el-icon><ChatDotSquare /></el-icon>
          微信分享
        </el-button>
        <el-button type="info" @click="shareToWeibo" class="share-btn">
          <el-icon><Share /></el-icon>
          微博分享
        </el-button>
        <el-button type="warning" @click="shareToQQ" class="share-btn">
          <el-icon><ChatSquare /></el-icon>
          QQ分享
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  StarFilled,
  ChatDotSquare,
  Share,
  Star,
  Plus,
  Search,
  Location,
  MoreFilled,
  Link,
  ChatSquare,
  Camera,
  User
} from '@element-plus/icons-vue'
import albumService from '../api/albumService.js'

// 注入用户认证状态
const userAuth = inject('userAuth', {
  isLoggedIn: ref(false),
  userInfo: reactive({ username: '', userId: null }),
  login: () => {},
  logout: () => {}
})

// 响应式检测
const isMobile = ref(window.innerWidth <= 768)

// 数据状态
const loading = ref(false)
const loadingMore = ref(false)
const searchKeyword = ref('')
const activeTab = ref('recommend')
const hasMore = ref(true)
const currentPage = ref(1)

// 对话框状态
const showPublishDialog = ref(false)
const showImageViewer = ref(false)
const showComments = ref(false)
const showShareDialog = ref(false)

// 当前选中的内容
const currentPost = ref(null)
const currentComments = ref([])
const currentImageIndex = ref(0)

// 组件引用
const carouselRef = ref()

// 评论相关
const newComment = ref('')

// 发布表单
const publishFormRef = ref()
const publishForm = reactive({
  content: '',
  tags: '',
  location: '',
  images: []
})

const publishRules = {
  content: [
    { min: 1, message: '请输入分享内容', trigger: 'blur' }
  ]
}

// 动态数据
const posts = ref([])

// 计算属性
const canPublish = computed(() => {
  return publishForm.content.trim() || publishForm.images.length > 0
})

const filteredPosts = computed(() => {
  let result = [...posts.value]
  
  if (searchKeyword.value) {
    result = result.filter(post =>
      post.content.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      post.author.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchKeyword.value.toLowerCase())))
    )
  }
  
  return result
})

// 加载动态数据
const loadPosts = async (page = 1) => {
  if (page === 1) {
    loading.value = true
    posts.value = []
  } else {
    loadingMore.value = true
  }
  
  try {
    const response = await albumService.getSocialPosts({
      page,
      tab: activeTab.value,
      search: searchKeyword.value
    })
    
    if (response.success) {
      if (page === 1) {
        posts.value = response.data.posts
      } else {
        posts.value.push(...response.data.posts)
      }
      hasMore.value = response.data.hasMore
      currentPage.value = page
    } else {
      ElMessage.error(response.message || '加载失败')
    }
  } catch (error) {
    console.error('加载动态失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 标签页切换
const handleTabChange = async (tab) => {
  currentPage.value = 1
  await loadPosts(1)
}

// 搜索处理
const handleSearch = async () => {
  currentPage.value = 1
  await loadPosts(1)
}

// 加载更多
const loadMorePosts = async () => {
  if (hasMore.value && !loadingMore.value) {
    await loadPosts(currentPage.value + 1)
  }
}

// 发布新动态
const publishPost = async () => {
  if (!publishFormRef.value) return
  
  try {
    const valid = await publishFormRef.value.validate()
    if (valid && canPublish.value) {
      const loading = ElMessage.loading('发布中...')
      
      const response = await albumService.createPost({
        content: publishForm.content,
        tags: publishForm.tags.split(' ').filter(tag => tag.trim()),
        location: publishForm.location,
        images: publishForm.images.map(img => ({
          url: URL.createObjectURL(img.raw),
          title: img.name
        }))
      })
      
      if (response.success) {
        ElMessage.success('发布成功')
        showPublishDialog.value = false
        
        // 重置表单
        publishForm.content = ''
        publishForm.tags = ''
        publishForm.location = ''
        publishForm.images = []
        
        // 刷新动态
        await loadPosts(1)
      } else {
        ElMessage.error(response.message || '发布失败')
      }
      
      loading.close()
    }
  } catch (error) {
    console.error('发布失败:', error)
    ElMessage.error('发布失败')
  }
}

// 图片上传处理
const handleImageChange = (file, fileList) => {
  publishForm.images = fileList
}

const handleImageRemove = (file, fileList) => {
  publishForm.images = fileList
}

// 获取图片网格样式
const getGridClass = (imageCount) => {
  if (imageCount === 1) return 'grid-single'
  if (imageCount === 2) return 'grid-two'
  if (imageCount === 3) return 'grid-three'
  if (imageCount === 4) return 'grid-four'
  return 'grid-multiple'
}

// 打开图片查看器
const openImageViewer = (post, index = 0) => {
  currentPost.value = post
  currentImageIndex.value = index
  showImageViewer.value = true
  
  nextTick(() => {
    if (carouselRef.value) {
      carouselRef.value.setActiveItem(index)
    }
  })
}

// 点赞功能
const toggleLike = async (post) => {
  if (!userAuth.isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    const response = await albumService.togglePostLike(post.id, post.isLiked)
    if (response.success) {
      post.isLiked = response.data.isLiked
      post.likes = response.data.likes
      ElMessage.success(post.isLiked ? '点赞成功' : '取消点赞')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 收藏功能
const toggleFavorite = async (post) => {
  if (!userAuth.isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    const response = await albumService.togglePostFavorite(post.id, post.isFavorited)
    if (response.success) {
      post.isFavorited = response.data.isFavorited
      ElMessage.success(post.isFavorited ? '收藏成功' : '取消收藏')
    }
  } catch (error) {
    console.error('收藏失败:', error)
    ElMessage.error('操作失败')
  }
}

// 打开评论
const openComments = async (post) => {
  currentPost.value = post
  await loadComments(post.id)
  showComments.value = true
}

// 加载评论
const loadComments = async (postId) => {
  try {
    const response = await albumService.getPostComments(postId)
    if (response.success) {
      currentComments.value = response.data
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
  }
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    const response = await albumService.addPostComment(currentPost.value.id, newComment.value)
    if (response.success) {
      currentComments.value.unshift(response.data)
      currentPost.value.comments++
      newComment.value = ''
      ElMessage.success('评论成功')
    }
  } catch (error) {
    console.error('评论失败:', error)
    ElMessage.error('评论失败')
  }
}

// 分享功能
const sharePost = (post) => {
  currentPost.value = post
  showShareDialog.value = true
}

const copyLink = async () => {
  const link = `${window.location.origin}/post/${currentPost.value.id}`
  try {
    await navigator.clipboard.writeText(link)
    // 增加分享次数
    currentPost.value.shares = (currentPost.value.shares || 0) + 1
    ElMessage.success('链接已复制')
    showShareDialog.value = false
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

const shareToWeChat = () => {
  // 增加分享次数
  currentPost.value.shares = (currentPost.value.shares || 0) + 1
  ElMessage.info('请在微信中打开分享')
  showShareDialog.value = false
}

const shareToWeibo = () => {
  const url = `${window.location.origin}/post/${currentPost.value.id}`
  const text = `${currentPost.value.content} - 来自相册分享`
  // 增加分享次数
  currentPost.value.shares = (currentPost.value.shares || 0) + 1
  window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`)
  showShareDialog.value = false
}

const shareToQQ = () => {
  // 增加分享次数
  currentPost.value.shares = (currentPost.value.shares || 0) + 1
  ElMessage.info('QQ分享功能开发中')
  showShareDialog.value = false
}

// 显示点赞列表 - 模拟功能
const showLikesList = (post) => {
  ElMessage.info(`${post.likes}人点赞了这条动态`)
}

// 举报动态 - 模拟功能
const reportPost = (post) => {
  ElMessage.info('举报功能开发中')
}

// 删除动态 - 模拟功能
const deletePost = (post) => {
  ElMessage.confirm('确定要删除这条动态吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 从列表中移除
    const index = posts.value.findIndex(p => p.id === post.id)
    if (index > -1) {
      posts.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 工具函数
const formatTimeAgo = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(date).toLocaleDateString('zh-CN')
}

const searchByTag = (tag) => {
  searchKeyword.value = tag
  handleSearch()
}

const viewUserProfile = (username) => {
  ElMessage.info(`查看 ${username} 的主页`)
}

// 响应式处理
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

// 组件挂载
onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await loadPosts(1)
})
</script>

<style scoped>
.social-feed {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}

/* 发布栏 */
.post-composer {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.composer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.username {
  font-weight: 500;
  color: #303133;
}

.publish-btn {
  width: 100%;
  height: 40px;
}

/* 筛选栏 */
.feed-filters {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-input {
  margin-top: 16px;
}

/* 动态项 */
.feed-item {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
}

.user-info {
  display: flex;
  gap: 12px;
}

.user-details .username {
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  margin-bottom: 4px;
}

.user-details .username:hover {
  color: #409eff;
}

.post-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.location {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.more-btn {
  cursor: pointer;
  color: #909399;
  font-size: 18px;
}

/* 内容区 */
.post-content {
  padding: 0 16px;
}

.post-text {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #303133;
}

.post-tags {
  margin-bottom: 12px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 4px;
  cursor: pointer;
}

/* 图片网格 */
.images-grid {
  display: grid;
  gap: 2px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.grid-single {
  grid-template-columns: 1fr;
}

.grid-single .image-item {
  aspect-ratio: 16/9; /* 更适合宽屏显示 */
  max-height: 350px;
}

.grid-two {
  grid-template-columns: 1fr 1fr;
}

.grid-two .image-item {
  aspect-ratio: 1;
}

.grid-three {
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.grid-three .image-item:first-child {
  grid-row: 1 / -1;
  aspect-ratio: 4/5;
}

.grid-three .image-item:not(:first-child) {
  aspect-ratio: 1;
}

.grid-four {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.grid-four .image-item {
  aspect-ratio: 1;
}

.grid-multiple {
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
}

.grid-multiple .image-item:first-child {
  grid-row: 1 / -1;
  aspect-ratio: 4/5;
}

.grid-multiple .image-item:not(:first-child) {
  aspect-ratio: 1;
}

.image-item {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  background-color: #f5f5f5;
}

.feed-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-item:hover .feed-image {
  transform: scale(1.05);
}

.more-images-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

/* 统计信息 */
.post-stats {
  padding: 8px 16px;
  font-size: 14px;
  color: #606266;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 16px;
}

.stat-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  border-radius: 4px;
  transition: color 0.3s ease;
}

.stat-item:hover {
  color: #409eff;
}

.stat-item .el-icon {
  font-size: 14px;
}

/* 互动按钮 */
.post-actions {
  display: flex;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  flex: 1;
  margin: 0 4px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #f5f7fa;
  color: #409eff;
}

.action-btn.liked {
  color: #f56c6c;
}

.action-btn.liked:hover {
  color: #f56c6c;
  background: #fef0f0;
}

.action-btn.favorited {
  color: #e6a23c;
}

.action-btn.favorited:hover {
  color: #e6a23c;
  background: #fdf6ec;
}

.action-btn .el-icon {
  font-size: 16px;
}

.action-text {
  font-weight: 500;
}

.action-count {
  font-size: 12px;
  color: #909399;
  margin-left: 2px;
}

/* 评论预览 */
.comments-preview {
  padding: 0 16px 16px;
}

.comment-preview {
  margin-bottom: 8px;
  font-size: 14px;
}

.comment-author {
  font-weight: 500;
  color: #303133;
  margin-right: 8px;
}

.comment-text {
  color: #606266;
}

.view-all-comments {
  color: #909399;
  font-size: 14px;
  cursor: pointer;
}

.view-all-comments:hover {
  color: #409eff;
}

/* 对话框样式 */
.publish-form .upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.comment-input-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-input {
  flex: 1;
}

.comment-actions {
  text-align: right;
}

.comments-list {
  max-height: 400px;
  overflow-y: auto;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 500;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  color: #606266;
  margin: 8px 0;
  line-height: 1.5;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.comment-actions .el-button {
  padding: 0;
  color: #909399;
}

.comment-actions .liked {
  color: #f56c6c;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.load-more {
  text-align: center;
  padding: 20px;
}

/* 分享选项 */
.share-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-btn {
  width: 100%;
  justify-content: flex-start;
  gap: 8px;
}

/* 超大屏幕适配 */
@media (min-width: 1600px) {
  .social-feed {
    max-width: 1400px;
    padding: 0 40px;
  }
  
  .post-composer,
  .feed-filters,
  .feed-item {
    padding: 24px;
  }
  
  .grid-single .image-item {
    max-height: 450px;
  }
}

/* 大屏幕适配 */
@media (min-width: 1200px) and (max-width: 1599px) {
  .social-feed {
    max-width: 1200px;
    padding: 0 32px;
  }
  
  .post-composer,
  .feed-filters,
  .feed-item {
    padding: 20px;
  }
  
  .grid-single .image-item {
    max-height: 400px;
  }
}

/* 中等屏幕适配 */
@media (min-width: 768px) and (max-width: 1199px) {
  .social-feed {
    max-width: 900px;
    padding: 0 24px;
  }
  
  .post-composer,
  .feed-filters,
  .feed-item {
    padding: 18px;
  }
}

/* 移动端适配 */
@media (max-width: 767px) {
  .social-feed {
    max-width: 100%;
    padding: 0 8px;
  }
  
  .post-composer,
  .feed-filters,
  .feed-item {
    border-radius: 8px;
    margin-bottom: 12px;
  }
  
  .feed-filters {
    padding: 12px;
  }
  
  .search-input {
    margin-top: 12px;
  }
  
  .images-grid.grid-multiple {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
  }
  
  .grid-three {
    grid-template-columns: 1fr 1fr;
  }
  
  .grid-three .image-item:first-child {
    grid-column: 1 / -1;
    grid-row: 1;
    aspect-ratio: 16/9;
  }
  
  .grid-three .image-item:not(:first-child) {
    aspect-ratio: 1;
  }
  
  .grid-multiple .image-item:first-child {
    grid-column: 1 / -1;
    grid-row: 1;
    aspect-ratio: 16/9;
  }
  
  .action-btn {
    font-size: 12px;
    padding: 6px 8px;
    gap: 4px;
  }
  
  .action-btn .el-icon {
    font-size: 14px;
  }
  
  .action-text {
    font-size: 12px;
  }
  
  .action-count {
    font-size: 11px;
  }
  
  .post-header {
    padding: 12px;
  }
  
  .post-content {
    padding: 0 12px;
  }
  
  .post-stats {
    padding: 8px 12px;
  }
  
  .comments-preview {
    padding: 0 12px 12px;
  }
}

@media (max-width: 480px) {
  .social-feed {
    padding: 0 4px;
  }
  
  .images-grid.grid-two,
  .images-grid.grid-three,
  .images-grid.grid-four,
  .images-grid.grid-multiple {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .grid-single .image-item {
    aspect-ratio: 16/9;
  }
  
  .images-grid:not(.grid-single) .image-item {
    aspect-ratio: 4/3;
  }
  
  .action-btn {
    font-size: 12px;
    padding: 6px 8px;
  }
  
  /* 移动端图片查看器优化 */
  .viewer-user-info {
    padding: 12px 0;
  }
  
  .viewer-user-info .username {
    font-size: 14px;
  }
  
  .viewer-content {
    padding: 12px 0;
  }
  
  .viewer-content .post-text {
    font-size: 14px;
  }
}

/* 图片查看器样式 */
.image-viewer {
  text-align: center;
}

.viewer-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.viewer-user-info .user-details {
  text-align: left;
}

.viewer-user-info .username {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.viewer-user-info .post-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.viewer-user-info .location {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.viewer-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.viewer-content {
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
  text-align: left;
}

.viewer-content .post-text {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #303133;
}

.viewer-content .post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.viewer-content .tag-item {
  cursor: default;
}
</style>