<template>
  <div class="login-container">
    <div class="login-wrapper">
      <!-- 背景装饰 -->
      <div class="background-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <el-icon class="logo-icon" size="40">
              <Camera />
            </el-icon>
            <h1 class="logo-text">相册分享</h1>
          </div>
          <p class="welcome-text">欢迎回来！登录您的账户</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="login">
            <el-input
              v-model="loginForm.login"
              placeholder="用户名或邮箱"
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="loginForm.remember">
                记住我
              </el-checkbox>
              <el-link type="primary" :underline="false">
                忘记密码？
              </el-link>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-button"
              :loading="userStore.isLoading"
              @click="handleLogin"
            >
              <span v-if="!userStore.isLoading">登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 分割线 -->
        <div class="divider">
          <span class="divider-text">或</span>
        </div>

        <!-- 社交登录按钮 -->
        <div class="social-login">
          <el-button class="social-button wechat" size="large">
            <el-icon class="social-icon">
              <ChatDotSquare />
            </el-icon>
            微信登录
          </el-button>
          <el-button class="social-button qq" size="large">
            <el-icon class="social-icon">
              <Avatar />
            </el-icon>
            QQ登录
          </el-button>
        </div>

        <!-- 注册链接 -->
        <div class="register-link">
          <span>还没有账户？</span>
          <el-link type="primary" :underline="false" @click="goToRegister">
            立即注册
          </el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Camera, User, Lock, ChatDotSquare, Avatar } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref()

// 登录表单数据
const loginForm = reactive({
  login: '',
  password: '',
  remember: false
})

// 表单验证规则
const loginRules = {
  login: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    const result = await userStore.login({
      login: loginForm.login,
      password: loginForm.password
    })
    
    if (result.success) {
      ElMessage.success(result.message)
      // 跳转到原来的页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('登录验证失败')
  }
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.circle-1 {
  width: 120px;
  height: 120px;
  top: -60px;
  right: -60px;
  animation: float 6s ease-in-out infinite;
}

.circle-2 {
  width: 80px;
  height: 80px;
  bottom: -40px;
  left: -40px;
  animation: float 4s ease-in-out infinite reverse;
}

.circle-3 {
  width: 60px;
  height: 60px;
  top: 50%;
  left: -30px;
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.logo-icon {
  color: #667eea;
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-text {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
}

.divider-text {
  background: white;
  padding: 0 16px;
  color: #999;
  font-size: 14px;
  position: relative;
  z-index: 1;
}

.social-login {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.social-button {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.social-button.wechat {
  background: #07c160;
  border-color: #07c160;
  color: white;
}

.social-button.wechat:hover {
  background: #06ad56;
  transform: translateY(-2px);
}

.social-button.qq {
  background: #12b7f5;
  border-color: #12b7f5;
  color: white;
}

.social-button.qq:hover {
  background: #0ea5e9;
  transform: translateY(-2px);
}

.social-icon {
  margin-right: 8px;
}

.register-link {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.register-link .el-link {
  margin-left: 8px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }
  
  .login-card {
    padding: 30px 20px;
  }
  
  .logo-text {
    font-size: 24px;
  }
  
  .social-login {
    flex-direction: column;
  }
}
</style> 