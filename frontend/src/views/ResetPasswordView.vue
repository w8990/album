<template>
  <div class="reset-password-container">
    <div class="reset-password-wrapper">
      <!-- 背景装饰 -->
      <div class="background-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>

      <!-- 重置密码卡片 -->
      <div class="reset-password-card">
        <div class="reset-password-header">
          <div class="logo">
            <el-icon class="logo-icon" size="40">
              <Picture />
            </el-icon>
            <h1 class="logo-text">重置密码</h1>
          </div>
          <p class="description-text">请输入您的新密码</p>
        </div>

        <el-form
          ref="resetPasswordFormRef"
          :model="resetPasswordForm"
          :rules="resetPasswordRules"
          class="reset-password-form"
          @submit.prevent="handleResetPassword"
        >
          <el-form-item prop="newPassword">
            <el-input
              v-model="resetPasswordForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="resetPasswordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleResetPassword"
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
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="reset-password-button"
              :loading="isLoading"
              :disabled="!token || resetSuccess"
              @click="handleResetPassword"
            >
              <span v-if="!isLoading">重置密码</span>
              <span v-else>重置中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 操作链接 -->
        <div class="action-links">
          <el-link 
            v-if="resetSuccess" 
            type="primary" 
            :underline="false" 
            @click="goToLogin"
          >
            <el-icon><Check /></el-icon>
            前往登录
          </el-link>
          <el-link 
            v-else 
            type="primary" 
            :underline="false" 
            @click="goToLogin"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回登录
          </el-link>
        </div>

        <!-- 令牌状态提示 -->
        <div v-if="!token" class="token-status">
          <el-alert
            title="重置链接无效或已过期"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Picture, Lock, ArrowLeft, Check } from '@element-plus/icons-vue'
import { resetPassword } from '../api/auth'

const router = useRouter()
const route = useRoute()

// 从URL获取重置令牌
const token = ref(route.query.token as string || '')

// 表单引用
const resetPasswordFormRef = ref<FormInstance>()

// 重置密码表单数据
const resetPasswordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

// 状态管理
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resetSuccess = ref(false)

// 表单验证规则
const resetPasswordRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 清除消息
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

// 处理重置密码
const handleResetPassword = async () => {
  if (!resetPasswordFormRef.value) return
  if (!token.value) {
    ElMessage.error('重置令牌无效')
    return
  }
  
  // 防止重复提交
  if (isLoading.value) return
  
  // 清除之前的消息
  clearMessages()
  
  const valid = await resetPasswordFormRef.value.validate().catch(() => false)
  if (!valid) return

  isLoading.value = true

  try {
    const response = await resetPassword(token.value, resetPasswordForm.newPassword)
    
    if (response.success) {
      successMessage.value = response.message || '密码重置成功'
      resetSuccess.value = true
      ElMessage.success('密码重置成功，请使用新密码登录')
      
      // 3秒后自动跳转到登录页
      setTimeout(() => {
        goToLogin()
      }, 3000)
    } else {
      errorMessage.value = response.message || '重置失败，请稍后重试'
      ElMessage.error(response.message || '重置失败，请稍后重试')
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

// 组件挂载时检查令牌
onMounted(() => {
  if (!token.value) {
    ElMessage.warning('重置链接无效或已过期')
  }
})
</script>

<style scoped>
.reset-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.reset-password-wrapper {
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

.reset-password-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.reset-password-header {
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

.reset-password-form {
  margin-bottom: 24px;
}

.reset-password-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.reset-password-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.reset-password-form :deep(.el-input__wrapper:hover) {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.reset-password-form :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.reset-password-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s ease;
}

.reset-password-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.reset-password-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-links {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.action-links .el-link {
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.token-status {
  margin-top: 16px;
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

.token-status :deep(.el-alert) {
  border-radius: 8px;
}

.token-status :deep(.el-alert__title) {
  font-size: 14px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .reset-password-container {
    padding: 10px;
  }
  
  .reset-password-card {
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