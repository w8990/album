<template>
  <div class="user-avatar-container">
    <!-- 未登录状态 -->
    <div v-if="!userStore.isAuthenticated" class="auth-buttons">
      <el-button type="primary" size="small" @click="goToLogin">
        <el-icon class="mr-1"><User /></el-icon>
        登录
      </el-button>
      <el-button size="small" @click="goToRegister">
        注册
      </el-button>
    </div>

    <!-- 已登录状态 -->
    <div v-else class="user-menu">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar 
            :size="36" 
            :src="getAvatarUrl(userStore.user?.avatar_url)" 
            class="user-avatar"
          >
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="username">{{ userStore.user?.display_name }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人资料
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              账户设置
            </el-dropdown-item>
            <el-dropdown-item command="albums">
              <el-icon><Picture /></el-icon>
              我的相册
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { watch } from 'vue'
import { 
  User, ArrowDown, Setting, Picture, SwitchButton 
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { API_CONFIG } from '../config/api'

const router = useRouter()
const userStore = useUserStore()

// 获取头像URL
const getAvatarUrl = (avatarUrl?: string) => {
  if (!avatarUrl) return undefined
  
  // 如果已经是完整URL，直接返回
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl
  }
  
  // 如果是相对路径，拼接API base URL
  return `${API_CONFIG.BASE_URL}${avatarUrl}`
}

// 监听用户信息变化，用于调试
watch(() => userStore.user?.avatar_url, (newAvatarUrl) => {
  console.log('UserAvatar组件监听到头像变化:', newAvatarUrl)
}, { immediate: true })

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'albums':
      // TODO: 跳转到我的相册页面
      ElMessage.info('我的相册功能正在开发中')
      break
    case 'logout':
      await handleLogout()
      break
  }
}

// 处理登出
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '您确定要退出登录吗？',
      '确认退出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      ElMessage.error('退出登录失败')
    }
  }
}
</script>

<style scoped>
.user-avatar-container {
  display: flex;
  align-items: center;
  height: 100%;
}

.auth-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.user-menu {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.user-info:hover .user-avatar {
  border-color: rgba(255, 255, 255, 0.6);
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: #666;
  transition: transform 0.3s ease;
}

.user-info:hover .dropdown-icon {
  transform: translateY(1px);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .username {
    color: #fff;
  }
  
  .user-info {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .user-info:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .username {
    display: none;
  }
  
  .auth-buttons {
    gap: 4px;
  }
  
  .auth-buttons .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style> 