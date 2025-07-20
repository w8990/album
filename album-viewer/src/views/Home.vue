<template>
  <div class="home-container">
    <!-- 动态流 -->
    <div class="main-content">
      <div class="feed-section">
        <!-- 动态列表 -->
        <div class="feed-list">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="4" animated v-for="i in 3" :key="i" class="feed-skeleton" />
          </div>

          <!-- 动态内容 -->
          <div v-else>
            <div 
              v-for="post in feedPosts" 
              :key="post.id"
              class="feed-item"
            >
              <!-- 用户信息 -->
              <div class="post-header">
                <el-avatar 
                  :size="50" 
                  :src="post.author.avatar"
                  @click="goToProfile(post.author.id)"
                  class="clickable-avatar"
                />
                <div class="author-info">
                  <h4 @click="goToProfile(post.author.id)" class="author-name">
                    {{ post.author.nickname }}
                  </h4>
                  <p class="post-time">{{ formatRelativeTime(post.createdAt) }}</p>
                </div>
                <div class="post-menu">
                  <el-dropdown>
                    <el-icon class="more-icon"><MoreFilled /></el-icon>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="sharePost(post)">分享</el-dropdown-item>
                        <el-dropdown-item @click="reportPost(post)">举报</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>

              <!-- 文字内容 -->
              <div v-if="post.content" class="post-content">
                {{ post.content }}
              </div>

              <!-- 相册内容 -->
              <div v-if="post.album" class="post-album">
                <div class="album-header">
                  <h4>{{ post.album.title }}</h4>
                  <span class="photo-count">{{ post.album.photoCount }} 张照片</span>
                </div>
                
                <div class="album-preview" @click="goToAlbum(post.album.id)">
                  <div class="album-grid">
                    <img 
                      v-for="(photo, index) in post.album.previewPhotos.slice(0, 4)"
                      :key="index"
                      :src="photo"
                      :alt="`预览图 ${index + 1}`"
                      class="preview-photo"
                      :class="{ 'small': post.album.previewPhotos.length > 1 }"
                    />
                    <div 
                      v-if="post.album.photoCount > 4"
                      class="more-photos"
                    >
                      +{{ post.album.photoCount - 4 }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 单张照片 -->
              <div v-if="post.singlePhoto" class="post-photo">
                <img 
                  :src="post.singlePhoto.url" 
                  :alt="post.singlePhoto.title"
                  @click="previewPhoto(post.singlePhoto)"
                  class="single-photo"
                />
              </div>

              <!-- 互动区域 -->
              <div class="post-actions">
                <div class="action-buttons">
                  <el-button 
                    :type="post.isLiked ? 'primary' : 'default'"
                    :icon="post.isLiked ? StarFilled : Star"
                    @click="toggleLike(post)"
                    class="action-btn"
                  >
                    {{ post.likesCount }}
                  </el-button>
                  
                  <el-button 
                    :icon="ChatDotRound"
                    @click="showComments(post)"
                    class="action-btn"
                  >
                    {{ post.commentsCount }}
                  </el-button>
                  
                  <el-button 
                    :icon="Share"
                    @click="sharePost(post)"
                    class="action-btn"
                  >
                    分享
                  </el-button>
                  
                  <el-button 
                    :icon="Collection"
                    @click="collectPost(post)"
                    class="action-btn"
                  >
                    收藏
                  </el-button>
                </div>
              </div>

              <!-- 评论区域 -->
              <div v-if="post.showComments" class="comments-section">
                <!-- 评论列表 -->
                <div class="comments-list">
                  <div 
                    v-for="comment in post.comments.slice(0, 3)" 
                    :key="comment.id"
                    class="comment-item"
                  >
                    <el-avatar :size="32" :src="comment.author.avatar" />
                    <div class="comment-content">
                      <div class="comment-text">
                        <span class="comment-author">{{ comment.author.nickname }}: </span>
                        {{ comment.content }}
                      </div>
                      <div class="comment-time">{{ formatRelativeTime(comment.createdAt) }}</div>
                    </div>
                  </div>
                  
                  <div v-if="post.commentsCount > 3" class="view-more-comments">
                    <el-button text @click="viewAllComments(post)">
                      查看全部 {{ post.commentsCount }} 条评论
                    </el-button>
                  </div>
                </div>

                <!-- 评论输入 -->
                <div v-if="userStore.isAuthenticated" class="comment-input">
                  <el-avatar :size="32" :src="userStore.user?.avatar" />
                  <el-input
                    v-model="post.newComment"
                    placeholder="写评论..."
                    @keyup.enter="addComment(post)"
                    class="comment-field"
                  >
                    <template #suffix>
                      <el-button 
                        text 
                        @click="addComment(post)"
                        :disabled="!post.newComment?.trim()"
                      >
                        发送
                      </el-button>
                    </template>
                  </el-input>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载更多 -->
          <div class="load-more">
            <el-button 
              v-if="hasMore && !loading" 
              @click="loadMorePosts"
              :loading="loadingMore"
            >
              加载更多
            </el-button>
            <div v-if="!hasMore && feedPosts.length > 0" class="no-more">
              没有更多内容了
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 照片预览对话框 -->
    <el-dialog v-model="showPhotoPreview" :title="currentPhoto?.title" width="80%">
      <div v-if="currentPhoto" class="photo-preview">
        <img :src="currentPhoto.url" :alt="currentPhoto.title" class="preview-image" />
      </div>
    </el-dialog>

    <!-- 评论详情对话框 -->
    <el-dialog v-model="showCommentsDialog" title="评论详情" width="600px">
      <div v-if="currentPost" class="comments-detail">
        <div 
          v-for="comment in currentPost.allComments" 
          :key="comment.id"
          class="comment-detail-item"
        >
          <el-avatar :size="40" :src="comment.author.avatar" />
          <div class="comment-detail-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author.nickname }}</span>
              <span class="comment-time">{{ formatRelativeTime(comment.createdAt) }}</span>
            </div>
            <div class="comment-text">{{ comment.content }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { ElMessage } from 'element-plus'
import {
  MoreFilled,
  Star,
  StarFilled,
  ChatDotRound,
  Share,
  Collection
} from '@element-plus/icons-vue'
import albumService from '../api/albumService.js'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const feedPosts = ref([])
const showPhotoPreview = ref(false)
const showCommentsDialog = ref(false)
const currentPhoto = ref(null)
const currentPost = ref(null)

// 获取社交动态数据
const fetchFeedPosts = async (isLoadMore = false) => {
  try {
    if (!isLoadMore) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    // 调用真实API获取社交动态
    const page = isLoadMore ? Math.floor(feedPosts.value.length / 10) + 1 : 1
    const result = await albumService.getSocialPosts({ 
      page: page,
      limit: 10 
    })

    if (result.success && result.data.posts) {
      const newPosts = result.data.posts.map(post => ({
        id: post.id,
        author: {
          id: post.authorId,
          nickname: post.author,
          avatar: post.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`
        },
        content: post.content || '',
        album: null, // 暂时不支持相册动态
        singlePhoto: post.images && post.images.length > 0 ? {
          id: post.images[0].id,
          title: post.images[0].title || '照片',
          url: post.images[0].url
        } : null,
        likesCount: post.likes || 0,
        commentsCount: post.comments || 0,
        isLiked: post.isLiked || false,
        showComments: false,
        newComment: '',
        comments: (post.latestComments || []).map(comment => ({
          id: comment.id,
          author: {
            nickname: comment.author,
            avatar: comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`
          },
          content: comment.content,
          createdAt: new Date(comment.createdAt)
        })),
        createdAt: new Date(post.createdAt)
      }))

      if (isLoadMore) {
        feedPosts.value.push(...newPosts)
      } else {
        feedPosts.value = newPosts
      }

      // 检查是否还有更多数据
      hasMore.value = result.data.hasMore || false
    } else {
      // 如果API失败，显示空状态
      if (!isLoadMore) {
        feedPosts.value = []
      }
      ElMessage.warning(result.message || '暂无动态内容')
    }

  } catch (error) {
    console.error('获取动态失败:', error)
    
    // 如果是首次加载失败，显示错误信息
    if (!isLoadMore && feedPosts.value.length === 0) {
      ElMessage.error('获取动态失败，请检查网络连接')
      feedPosts.value = []
    } else if (isLoadMore) {
      ElMessage.warning('加载更多失败，请稍后重试')
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 事件处理
const goToProfile = (userId) => {
  router.push(`/profile/${userId}`)
}

const goToAlbum = (albumId) => {
  router.push(`/album/${albumId}`)
}

const toggleLike = async (post) => {
  try {
    const result = await albumService.togglePostLike(post.id)
    if (result.success) {
      post.isLiked = !post.isLiked
      post.likesCount += post.isLiked ? 1 : -1
    } else {
      ElMessage.error('操作失败')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

const showComments = (post) => {
  post.showComments = !post.showComments
}

const addComment = async (post) => {
  if (!post.newComment?.trim()) return
  
  try {
    const result = await albumService.addPostComment(post.id, post.newComment)

    if (result.success) {
      const newComment = {
        id: result.data.id,
        author: {
          nickname: userStore.user?.nickname || userStore.user?.username,
          avatar: userStore.user?.avatar
        },
        content: post.newComment,
        createdAt: new Date()
      }
      
      post.comments.unshift(newComment)
      post.commentsCount++
      post.newComment = ''
      ElMessage.success('评论成功')
    } else {
      ElMessage.error(result.message || '评论失败')
    }
  } catch (error) {
    console.error('评论失败:', error)
    ElMessage.error('评论失败')
  }
}

const previewPhoto = (photo) => {
  currentPhoto.value = photo
  showPhotoPreview.value = true
}

const sharePost = (post) => {
  // 复制分享链接
  const shareUrl = `${window.location.origin}/post/${post.id}`
  navigator.clipboard.writeText(shareUrl).then(() => {
    ElMessage.success('分享链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const collectPost = async (post) => {
  try {
    const result = await albumService.togglePostFavorite(post.id)
    if (result.success) {
      ElMessage.success('已添加到收藏')
    } else {
      ElMessage.error(result.message || '收藏失败')
    }
  } catch (error) {
    console.error('收藏失败:', error)
    ElMessage.error('收藏失败')
  }
}

const loadMorePosts = () => {
  fetchFeedPosts(true)
}

const viewAllComments = async (post) => {
  try {
    const result = await albumService.getPostComments(post.id)
    if (result.success) {
      currentPost.value = {
        ...post,
        allComments: result.data.map(comment => ({
          id: comment.id,
          author: {
            nickname: comment.author,
            avatar: comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`
          },
          content: comment.content,
          createdAt: new Date(comment.createdAt)
        }))
      }
      showCommentsDialog.value = true
    } else {
      ElMessage.error('获取评论失败')
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    ElMessage.error('获取评论失败')
  }
}

const reportPost = (post) => {
  ElMessage.info('举报功能开发中...')
}

// 工具方法
const formatRelativeTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 组件挂载
onMounted(async () => {
  // 初始化用户状态（不阻塞页面加载）
  if (!userStore.initialized) {
    userStore.initializeAuth().catch(error => {
      console.warn('用户状态初始化失败:', error)
    })
  }
  
  // 获取动态数据
  await fetchFeedPosts()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #fafafa;
}

.main-content {
  max-width: 560px;
  margin: 0 auto;
  padding: 16px;
}

/* 动态流 */
.feed-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feed-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.04);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.clickable-avatar {
  cursor: pointer;
}

.author-info {
  flex: 1;
}

.author-name {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
}

.author-name:hover {
  color: #007aff;
}

.post-time {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #8e8e93;
}

.more-icon {
  cursor: pointer;
  color: #c7c7cc;
  font-size: 16px;
}

.post-content {
  font-size: 15px;
  line-height: 1.5;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.post-album {
  margin-bottom: 16px;
}

.album-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.album-header h4 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.photo-count {
  color: #6b7280;
  font-size: 14px;
}

.album-preview {
  cursor: pointer;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.preview-photo {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.preview-photo.small {
  height: 150px;
}

.more-photos {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.post-photo {
  margin-bottom: 16px;
}

.single-photo {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
}

.post-actions {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
  margin-top: 8px;
}

.action-buttons {
  display: flex;
  gap: 20px;
}

.action-btn {
  border: none;
  background: none;
  color: #8e8e93;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  color: #007aff;
  background: rgba(0, 122, 255, 0.08);
}

.comments-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.comment-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-content {
  flex: 1;
}

.comment-text {
  font-size: 13px;
  color: #1a1a1a;
  line-height: 1.4;
}

.comment-author {
  font-weight: 500;
  color: #1a1a1a;
}

.comment-time {
  font-size: 11px;
  color: #8e8e93;
  margin-top: 2px;
}

.comment-input {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}

.comment-field {
  flex: 1;
}

.view-more-comments {
  text-align: center;
  margin-top: 12px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feed-skeleton {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.04);
}

.load-more {
  text-align: center;
  padding: 16px;
}

.no-more {
  color: #8e8e93;
  font-size: 13px;
}

.photo-preview {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.comments-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.comment-detail-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.comment-detail-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-header .comment-author {
  font-weight: 600;
  color: #1f2937;
}

.comment-header .comment-time {
  font-size: 12px;
  color: #9ca3af;
}

.comment-detail-item .comment-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 12px;
  }
  
  .album-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-photo {
    height: 220px;
  }
  
  .action-buttons {
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 8px;
  }
  
  .feed-item {
    padding: 12px;
    border-radius: 8px;
  }
  
  .post-header {
    margin-bottom: 10px;
  }
  
  .album-header h4 {
    font-size: 15px;
  }
  
  .preview-photo {
    height: 180px;
  }
  
  .action-buttons {
    gap: 12px;
  }
  
  .comment-item {
    gap: 8px;
  }
}
</style> 