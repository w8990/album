<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo" @click="goToHome">
          <el-icon size="28"><Camera /></el-icon>
          <span class="logo-text">相册分享</span>
        </div>
        
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户、相册..."
            :prefix-icon="Search"
            clearable
            size="large"
            @input="handleSearch"
          />
        </div>
        
        <!-- 用户头像和菜单 -->
        <UserAvatar />
      </div>
    </el-header>

    <!-- 主内容区域 -->
    <el-main class="app-main">
      <div class="main-content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import UserAvatar from './UserAvatar.vue'
import {
  Camera,
  Search
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const searchQuery = ref('')

// 跳转到首页
const goToHome = () => {
  router.push('/home')
}

// 搜索处理
const handleSearch = (value) => {
  // 这里可以实现搜索逻辑
  console.log('搜索:', value)
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.app-header {
  background: #fff;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e5e7eb;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #1f2937;
  font-weight: 700;
  font-size: 20px;
  cursor: pointer;
}

.logo-text {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.search-bar {
  flex: 1;
  max-width: 400px;
  margin: 0 40px;
}

.app-main {
  background: #f8fafc;
  overflow-y: auto;
  flex: 1;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-bar {
    margin: 0 20px;
    max-width: 200px;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .logo-text {
    display: none;
  }
}
</style> 