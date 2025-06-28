<script setup>
import { ref, reactive, provide } from 'vue'
import { ElMessage } from 'element-plus'
import AlbumGallery from './components/AlbumGallery.vue'
import albumService from './api/albumService.js'

// 登录状态
const isLoggedIn = ref(false)
const userInfo = reactive({
  username: '',
  userId: null,
  avatar: ''
})

// 登录表单
const showLoginDialog = ref(false)
const loginFormRef = ref()
const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  const loading = ElMessage.loading('正在登录...')
  
  try {
    const valid = await loginFormRef.value.validate()
    if (valid) {
      const response = await albumService.login(loginForm.username, loginForm.password)
      
      if (response.success) {
        isLoggedIn.value = true
        userInfo.username = response.data.username
        userInfo.userId = response.data.userId
        userInfo.avatar = response.data.avatar
        
        // 存储登录信息到本地存储
        localStorage.setItem('userToken', response.data.token)
        localStorage.setItem('userInfo', JSON.stringify({
          username: response.data.username,
          userId: response.data.userId,
          avatar: response.data.avatar
        }))
        
        showLoginDialog.value = false
        ElMessage.success('登录成功')
        
        // 清空表单
        loginForm.username = ''
        loginForm.password = ''
      } else {
        ElMessage.error(response.message || '登录失败')
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请重试')
  } finally {
    loading.close()
  }
}

// 退出登录
const logout = () => {
  isLoggedIn.value = false
  userInfo.username = ''
  userInfo.userId = null
  userInfo.avatar = ''
  
  // 清除本地存储
  localStorage.removeItem('userToken')
  localStorage.removeItem('userInfo')
  
  ElMessage.success('已退出登录')
}

// 关闭对话框
const handleClose = (done) => {
  loginForm.username = ''
  loginForm.password = ''
  done()
}

// 检查本地存储的登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('userToken')
  const userInfoStr = localStorage.getItem('userInfo')
  
  if (token && userInfoStr) {
    try {
      const savedUserInfo = JSON.parse(userInfoStr)
      isLoggedIn.value = true
      userInfo.username = savedUserInfo.username
      userInfo.userId = savedUserInfo.userId
      userInfo.avatar = savedUserInfo.avatar
    } catch (error) {
      console.error('解析用户信息失败:', error)
      // 清除无效的本地存储
      localStorage.removeItem('userToken')
      localStorage.removeItem('userInfo')
    }
  }
}

// 提供登录状态给子组件
provide('userAuth', {
  isLoggedIn,
  userInfo,
  login: handleLogin,
  logout
})

// 组件挂载时检查登录状态
import { onMounted } from 'vue'
onMounted(() => {
  checkLoginStatus()
})
</script>

<template>
  <div id="app">
    <!-- 头部导航 -->
    <el-header height="60px" class="app-header">
      <div class="header-content">
        <div class="logo">
          <el-icon size="24"><Camera /></el-icon>
          <span class="logo-text">相册分享</span>
        </div>
        <div class="user-actions">
          <el-button v-if="!isLoggedIn" type="primary" @click="showLoginDialog = true">
            登录
          </el-button>
          <el-dropdown v-else>
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userInfo.username }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主内容区域 -->
    <el-main class="main-content">
      <AlbumGallery />
    </el-main>

    <!-- 登录对话框 -->
    <el-dialog
      v-model="showLoginDialog"
      title="用户登录"
      width="400px"
      :before-close="handleClose"
    >
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLoginDialog = false">取消</el-button>
          <el-button type="primary" @click="handleLogin">登录</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: #f5f5f5;
}

.app-header {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
}

.user-actions {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #606266;
}

.main-content {
  margin-top: 60px;
  padding: 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }
  
  .logo-text {
    font-size: 18px;
  }
  
  .main-content {
    padding: 16px;
  }
}
</style>
