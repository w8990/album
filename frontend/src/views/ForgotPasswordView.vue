<template>
  <div class="forgot-password-container">
    <div class="forgot-password-wrapper">
      <!-- 背景装饰 -->
      <div class="background-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>

      <!-- 忘记密码卡片 -->
      <div class="forgot-password-card">
        <div class="forgot-password-header">
          <div class="logo">
            <el-icon class="logo-icon" size="40">
              <Picture />
            </el-icon>
            <h1 class="logo-text">忘记密码</h1>
          </div>
          <p class="description-text">输入您的邮箱地址，我们将发送密码重置链接给您</p>
        </div>

        <el-form
          ref="forgotPasswordFormRef"
          :model="forgotPasswordForm"
          :rules="forgotPasswordRules"
          class="forgot-password-form"
          @submit.prevent="handleForgotPassword"
        >
          <el-form-item prop="email">
            <el-input
              v-model="forgotPasswordForm.email"
              placeholder="请输入您的邮箱地址"
              size="large"
              :prefix-icon="Message"
              clearable
              @keyup.enter="handleForgotPassword"
            />
          </el-form-item>

          <!-- 错误信息显示区域 -->
          <div v-if="errorMessage" class="error-message">
            <el-alert
              :title="errorMessage"
              type="error"
              :closable="false"
              show-icon
            />
          </div>

          <!-- 成功信息显示区域 -->
          <div v-if="successMessage" class="success-message">
            <el-alert
              :title="successMessage"
              type="success"
              :closable="false"
              show-icon
            />
            <!-- 开发环境下显示重置链接 -->
            <div v-if="resetUrl" class="dev-reset-link">
              <p style="margin-top: 16px; font-size: 14px; color: #666;">
                开发环境下的重置链接：
              </p>
              <el-link :href="resetUrl" target="_blank" type="primary">
                {{ resetUrl }}
              </el-link>
            </div>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="forgot-password-button"
              :loading="isLoading"
              @click="handleForgotPassword"
            >
              <span v-if="!isLoading">发送重置链接</span>
              <span v-else>发送中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 返回登录链接 -->
        <div class="back-to-login">
          <el-link type="primary" :underline="false" @click="goToLogin">
            <el-icon><ArrowLeft /></el-icon>
            返回登录
          </el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Picture, Message, ArrowLeft } from '@element-plus/icons-vue'
import { forgotPassword } from '../api/auth'

const router = useRouter()

// 表单引用
const forgotPasswordFormRef = ref<FormInstance>()

// 忘记密码表单数据
const forgotPasswordForm = reactive({
  email: ''
})

// 状态管理
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resetUrl = ref('')

// 表单验证规则
const forgotPasswordRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: '请输入正确的邮箱格式', 
      trigger: 'blur' 
    }
  ]
}

// 清除消息
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
  resetUrl.value = ''
}

// 处理忘记密码2

const handleForgotPassword = async () => {
  if (!forgotPasswordFormRef.value) return
  
  // 防止重复提交
  if (isLoading.value) return
  
  // 清除之前的消息
  clearMessages()
  
  const valid = await forgotPasswordFormRef.value.validate().catch(() => false)
  if (!valid) return

  isLoading.value = true

  try {
    const response = await forgotPassword(forgotPasswordForm.email)
    
    if (response.success) {
      successMessage.value = response.message || '密码重置邮件发送成功'
      
      // 开发环境下显示重置链接
      if (response.resetUrl) {
        resetUrl.value = response.resetUrl
      }
      
      ElMessage.success('密码重置邮件发送成功')
    } else {
      errorMessage.value = response.message || '发送失败，请稍后重试'
      ElMessage.error(response.message || '发送失败，请稍后重试')
    }
  } catch (error: any) {
    const message = error?.response?.data?.error || '网络错误，请稍后重试'
    errorMessage.value = message
    ElMessage.error(message)
  } finally {
    isLoading.value = false
  }
}

// 返回登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.forgot-password-wrapper {
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

.forgot-password-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.forgot-password-header {
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

.description-text {
  color: #666;
  font-size: 16px;
  margin: 0;
  line-height: 1.4;
}

.forgot-password-form {
  margin-bottom: 24px;
}

.forgot-password-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.forgot-password-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.forgot-password-form :deep(.el-input__wrapper:hover) {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.forgot-password-form :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.forgot-password-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s ease;
}

.forgot-password-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.back-to-login {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.back-to-login .el-link {
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 错误和成功信息样式 */
.error-message, .success-message {
  margin-bottom: 16px;
}

.error-message :deep(.el-alert), 
.success-message :deep(.el-alert) {
  border-radius: 8px;
}

.error-message :deep(.el-alert__title), 
.success-message :deep(.el-alert__title) {
  font-size: 14px;
  line-height: 1.4;
}

.dev-reset-link {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.dev-reset-link .el-link {
  word-break: break-all;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .forgot-password-container {
    padding: 10px;
  }
  
  .forgot-password-card {
    padding: 30px 20px;
  }
  
  .logo-text {
    font-size: 24px;
  }
  
  .description-text {
    font-size: 14px;
  }
}
</style>