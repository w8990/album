<template>
  <div class="home-container">
    <!-- 头部导航 -->
    <el-header height="60px" class="app-header">
      <div class="header-content">
        <div class="logo">
          <el-icon size="24"><Camera /></el-icon>
          <span class="logo-text">相册分享</span>
        </div>
        <UserAvatar />
      </div>
    </el-header>

    <!-- 主内容区域 -->
    <el-main class="main-content">
      <AlbumGallery />
    </el-main>
  </div>
</template>

<script setup>
import { Camera } from '@element-plus/icons-vue'
import AlbumGallery from '../components/AlbumGallery.vue'
import UserAvatar from '../components/UserAvatar.vue'
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.app-header {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-weight: 600;
  font-size: 18px;
}

.logo-text {
  background: linear-gradient(135deg, #409eff, #667eea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }
  
  .main-content {
    padding: 15px;
  }
  
  .logo-text {
    display: none;
  }
}
</style> 