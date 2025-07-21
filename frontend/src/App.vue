<script setup lang="ts">
import { Picture, House, View, User } from '@element-plus/icons-vue'
import UserAvatar from './components/UserAvatar.vue'
</script>

<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon class="logo-icon" size="24">
            <Picture />
          </el-icon>
          <span class="logo-text">相册分享</span>
        </div>
        
        <!-- 导航菜单 -->
        <nav class="nav-menu">
          <router-link to="/" class="nav-link">
            <el-icon><House /></el-icon>
            首页
          </router-link>
          <router-link to="/preview" class="nav-link">
            <el-icon><View /></el-icon>
            预览
          </router-link>
          <router-link to="/profile" class="nav-link">
            <el-icon><User /></el-icon>
            个人资料
          </router-link>
        </nav>

        <!-- 用户头像/登录按钮 -->
        <div class="header-right">
          <UserAvatar />
        </div>
      </div>
    </el-header>
    
    <el-main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>

    <el-footer class="footer">
      <div class="footer-content">
        <p>© 2024 相册分享系统. All rights reserved.</p>
      </div>
    </el-footer>
  </el-container>
</template>

<style scoped>
.layout-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
}

.header {
  padding: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  position: fixed;
  width: 100%;
  z-index: 1000;
  height: 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  color: #667eea;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #606266;
  font-weight: 500;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.15);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
}

.main-content {
  flex: 1;
  padding-top: 80px;
  padding-bottom: 20px;
  min-height: calc(100vh - 120px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.footer {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 20px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }
  
  .nav-menu {
    display: none;
  }
  
  .logo-text {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 12px;
  }
  
  .logo-text {
    font-size: 16px;
  }
}
</style>
