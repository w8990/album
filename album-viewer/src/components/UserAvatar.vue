<template>
  <div class="user-avatar-container">
    <!-- 未登录状态 -->
    <div v-if="!userStore.isAuthenticated" class="auth-buttons">
      <el-button 
        type="primary" 
        size="small" 
        @click="goToLogin"
        class="login-btn"
      >
        登录
      </el-button>
      <el-button 
        size="small" 
        @click="goToRegister"
        class="register-btn"
      >
        注册
      </el-button>
    </div>

    <!-- 已登录状态 -->
    <el-dropdown v-else placement="bottom-end" @command="handleCommand">
      <div class="user-info">
        <el-avatar 
          :size="36" 
          :src="userStore.user?.avatar" 
          class="user-avatar"
        >
          <el-icon><User /></el-icon>
        </el-avatar>
        <div class="user-details">
          <span class="username">{{ userStore.user?.display_name || userStore.user?.username }}</span>
          <span class="user-role">{{ getUserRole() }}</span>
        </div>
        <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
      </div>
      
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="home">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-dropdown-item>
          <el-dropdown-item command="profile" divided>
            <el-icon><User /></el-icon>
            <span>个人资料</span>
          </el-dropdown-item>
          <el-dropdown-item command="albums">
            <el-icon><Picture /></el-icon>
            <span>我的相册</span>
          </el-dropdown-item>
          <el-dropdown-item command="favorites">
            <el-icon><Star /></el-icon>
            <span>我的收藏</span>
          </el-dropdown-item>
          <el-dropdown-item command="settings" divided>
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </el-dropdown-item>
          <el-dropdown-item command="logout" class="logout-item">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 加载状态 -->
    <div v-if="userStore.isLoading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, ArrowDown, Picture, Star, Setting, SwitchButton, Loading, House 
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user.js'

const router = useRouter()
const userStore = useUserStore()

// 获取用户角色显示文本
const getUserRole = () => {
  const user = userStore.user
  if (!user) return ''
  
  if (user.role === 'admin') return '管理员'
  if (user.role === 'moderator') return '版主'
  return '用户'
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 跳转到注册页面  
const goToRegister = () => {
  router.push('/register')
}

// 处理下拉菜单命令
const handleCommand = async (command) => {
  switch (command) {
    case 'home':
      router.push('/')
      break
    case 'profile':
      router.push('/profile')
      break
    case 'albums':
      router.push('/my-albums')
      break
    case 'favorites':
      router.push('/favorites')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      await handleLogout()
      break
  }
}

// 处理退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '确认退出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (error) {
    // 用户取消退出
  }
}
</script>

<style scoped>
.user-avatar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-buttons {
  display: flex;
  gap: 8px;
}

.login-btn {
  background: linear-gradient(135deg, #409eff, #667eea);
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.register-btn {
  border: 1px solid #409eff;
  color: #409eff;
  background: transparent;
  transition: all 0.3s ease;
}

.register-btn:hover {
  background: #409eff;
  color: white;
  transform: translateY(-1px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(64, 158, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-info:hover {
  background: rgba(64, 158, 255, 0.2);
  transform: translateY(-1px);
}

.user-avatar {
  border: 2px solid #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

.dropdown-icon {
  color: #409eff;
  font-size: 12px;
  transition: transform 0.3s ease;
}

.user-info:hover .dropdown-icon {
  transform: rotate(180deg);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.loading-state .el-icon {
  color: #409eff;
  font-size: 18px;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

:deep(.el-dropdown-menu__item:hover) {
  background: #f0f9ff;
  color: #409eff;
}

:deep(.el-dropdown-menu__item.logout-item) {
  color: #f56c6c;
}

:deep(.el-dropdown-menu__item.logout-item:hover) {
  background: #fef0f0;
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-details {
    display: none;
  }
  
  .user-info {
    padding: 6px 8px;
  }
  
  .auth-buttons {
    gap: 6px;
  }
  
  .auth-buttons .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .register-btn {
    display: none;
  }
}
</style> 