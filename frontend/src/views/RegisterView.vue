<template>
  <div class="register-container">
    <div class="register-wrapper">
      <!-- 背景装饰 -->
      <div class="background-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
        <div class="decoration-circle circle-4"></div>
      </div>

      <!-- 注册卡片 -->
      <div class="register-card">
        <div class="register-header">
          <div class="logo">
            <el-icon class="logo-icon" size="40">
              <Picture />
            </el-icon>
            <h1 class="logo-text">相册分享</h1>
          </div>
          <p class="welcome-text">创建您的专属账户</p>
        </div>

        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="register-form"
          label-position="top"
          @submit.prevent="handleRegister"
        >
          <!-- 基本信息 -->
          <div class="form-section">
            <h3 class="section-title">基本信息</h3>
            
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="用户名" prop="username">
                  <el-input
                    v-model="registerForm.username"
                    placeholder="请输入用户名"
                    :prefix-icon="User"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="显示名称" prop="display_name">
                  <el-input
                    v-model="registerForm.display_name"
                    placeholder="请输入显示名称"
                    :prefix-icon="Avatar"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="registerForm.email"
                type="email"
                placeholder="请输入邮箱地址"
                :prefix-icon="Message"
                clearable
              />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="密码" prop="password">
                  <el-input
                    v-model="registerForm.password"
                    type="password"
                    placeholder="请输入密码"
                    :prefix-icon="Lock"
                    show-password
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="registerForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入密码"
                    :prefix-icon="Lock"
                    show-password
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 个人信息 -->
          <div class="form-section">
            <h3 class="section-title">
              个人信息
              <span class="optional-text">（可选）</span>
            </h3>
            
            <el-form-item label="个人简介" prop="bio">
              <el-input
                v-model="registerForm.bio"
                type="textarea"
                :rows="3"
                placeholder="介绍一下自己吧..."
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="所在地区" prop="location">
                  <el-input
                    v-model="registerForm.location"
                    placeholder="如：北京市"
                    :prefix-icon="Location"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="个人网站" prop="website">
                  <el-input
                    v-model="registerForm.website"
                    placeholder="如：https://example.com"
                    :prefix-icon="Link"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 用户协议 -->
          <el-form-item prop="agreement">
            <el-checkbox v-model="agreement" class="agreement-checkbox">
              我已阅读并同意
              <el-link type="primary" :underline="false">《用户协议》</el-link>
              和
              <el-link type="primary" :underline="false">《隐私政策》</el-link>
            </el-checkbox>
          </el-form-item>

          <!-- 注册按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="register-button"
              :loading="userStore.isLoading"
              @click="handleRegister"
            >
              <span v-if="!userStore.isLoading">创建账户</span>
              <span v-else>注册中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 登录链接 -->
        <div class="login-link">
          <span>已有账户？</span>
          <el-link type="primary" :underline="false" @click="goToLogin">
            立即登录
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
import { 
  Picture, User, Avatar, Message, Lock, Location, Link
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import type { RegisterForm } from '../types/user'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const registerFormRef = ref<FormInstance>()

// 注册表单数据
const registerForm = reactive<RegisterForm>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  display_name: '',
  bio: '',
  location: '',
  website: ''
})

// 用户协议同意状态
const agreement = ref(false)

// 密码确认验证
const validateConfirmPassword = (rule: any, value: string, callback: Function) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 网站URL验证
const validateWebsite = (rule: any, value: string, callback: Function) => {
  if (value && !/^https?:\/\/.+/.test(value)) {
    callback(new Error('请输入有效的网站地址'))
  } else {
    callback()
  }
}

// 表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  display_name: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 2, max: 30, message: '显示名称长度为2-30个字符', trigger: 'blur' }
  ],
  website: [
    { validator: validateWebsite, trigger: 'blur' }
  ]
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  if (!agreement.value) {
    ElMessage.error('请先同意用户协议和隐私政策')
    return
  }
  
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return

  const result = await userStore.register(registerForm)
  
  if (result.success) {
    ElMessage.success(result.message || '注册成功')
    router.push('/')
  } else {
    ElMessage.error(result.message || '注册失败')
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
}

.register-wrapper {
  position: relative;
  width: 100%;
  max-width: 600px;
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
  width: 150px;
  height: 150px;
  top: -75px;
  right: -75px;
  animation: float 8s ease-in-out infinite;
}

.circle-2 {
  width: 100px;
  height: 100px;
  bottom: -50px;
  left: -50px;
  animation: float 6s ease-in-out infinite reverse;
}

.circle-3 {
  width: 80px;
  height: 80px;
  top: 30%;
  left: -40px;
  animation: float 7s ease-in-out infinite;
}

.circle-4 {
  width: 60px;
  height: 60px;
  top: 20%;
  right: -30px;
  animation: float 5s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
  max-height: 90vh;
  overflow-y: auto;
}

.register-header {
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
  color: #f093fb;
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-text {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.register-form {
  margin-bottom: 24px;
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.optional-text {
  font-size: 14px;
  color: #999;
  font-weight: 400;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.register-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #2c3e50;
}

.register-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.register-form :deep(.el-input__wrapper:hover) {
  border-color: #f093fb;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.2);
}

.register-form :deep(.el-input__wrapper.is-focus) {
  border-color: #f093fb;
  box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
}

.register-form :deep(.el-textarea__inner) {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.register-form :deep(.el-textarea__inner:hover) {
  border-color: #f093fb;
}

.register-form :deep(.el-textarea__inner:focus) {
  border-color: #f093fb;
  box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
}

.agreement-checkbox {
  color: #666;
  font-size: 14px;
}

.register-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  border: none;
  transition: all 0.3s ease;
}

.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(240, 147, 251, 0.3);
}

.login-link {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.login-link .el-link {
  margin-left: 8px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-container {
    padding: 10px;
  }
  
  .register-card {
    padding: 30px 20px;
  }
  
  .logo-text {
    font-size: 24px;
  }
  
  .register-form :deep(.el-row) {
    margin: 0;
  }
  
  .register-form :deep(.el-col) {
    margin-bottom: 0;
  }
}

@media (max-width: 480px) {
  .register-form :deep(.el-col) {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style> 