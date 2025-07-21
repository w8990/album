<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="avatar-section">
        <el-avatar :size="120" :src="getAvatarUrl(userInfo?.avatar_url)" icon="User">
          {{ userInfo?.display_name?.charAt(0) }}
        </el-avatar>
        <div class="avatar-upload-wrapper">
          <el-upload
            :action="`${API_BASE_URL}/api/auth/upload-avatar`"
            :headers="{ Authorization: `Bearer ${userStore.token}` }"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :on-error="handleAvatarError"
            :before-upload="beforeAvatarUpload"
            :on-progress="handleAvatarProgress"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            name="avatar"
          >
            <el-button 
              type="primary" 
              size="small" 
              class="upload-avatar-btn"
              :loading="avatarUploading"
            >
              {{ avatarUploading ? '上传中...' : '更换头像' }}
            </el-button>
          </el-upload>
          <p class="upload-tip">支持JPG、PNG、GIF、WebP格式，文件大小不超过2MB</p>
        </div>
      </div>
      
      <div class="user-info">
        <h2>{{ userInfo?.display_name }}</h2>
        <p class="username">@{{ userInfo?.username }}</p>
        <p class="bio">{{ userInfo?.bio || '这个人很神秘，什么都没留下' }}</p>
        <div class="user-meta">
          <span v-if="userInfo?.location">
            <el-icon><LocationFilled /></el-icon>
            {{ userInfo.location }}
          </span>
          <span v-if="userInfo?.website">
            <el-icon><Link /></el-icon>
            <a :href="userInfo.website" target="_blank">{{ userInfo.website }}</a>
          </span>
          <span>
            <el-icon><Calendar /></el-icon>
            加入于 {{ formatDate(userInfo?.created_at) }}
          </span>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ stats?.albums_count || 0 }}</div>
          <div class="stat-label">相册</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats?.files_count || 0 }}</div>
          <div class="stat-label">文件</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats?.likes_count || 0 }}</div>
          <div class="stat-label">获赞</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats?.followers_count || 0 }}</div>
          <div class="stat-label">粉丝</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats?.following_count || 0 }}</div>
          <div class="stat-label">关注</div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="编辑资料" name="edit">
          <div class="edit-profile-form">
            <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
              <el-form-item label="显示名称" prop="display_name">
                <el-input v-model="editForm.display_name" placeholder="请输入显示名称" />
              </el-form-item>
              
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="editForm.email" placeholder="请输入邮箱" />
              </el-form-item>
              
              <el-form-item label="个人简介" prop="bio">
                <el-input
                  v-model="editForm.bio"
                  type="textarea"
                  :rows="3"
                  placeholder="介绍一下自己吧"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
              
              <el-form-item label="所在地" prop="location">
                <el-input v-model="editForm.location" placeholder="请输入所在地" />
              </el-form-item>
              
              <el-form-item label="个人网站" prop="website">
                <el-input v-model="editForm.website" placeholder="请输入个人网站URL" />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="updateProfile" :loading="updating">
                  {{ updating ? '保存中...' : '保存更改' }}
                </el-button>
                <el-button @click="resetForm" :disabled="updating">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <div class="change-password-form">
            <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
              <el-form-item label="当前密码" prop="currentPassword">
                <el-input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  show-password
                />
              </el-form-item>
              
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="请输入新密码"
                  show-password
                />
                <div class="password-hint">
                  密码要求：6-50个字符，必须包含字母和数字
                </div>
              </el-form-item>
              
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="changePassword" :loading="changingPassword">
                  {{ changingPassword ? '修改中...' : '修改密码' }}
                </el-button>
                <el-button @click="resetPasswordForm" :disabled="changingPassword">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type UploadProps } from 'element-plus'
import { LocationFilled, Link, Calendar } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { authApi } from '../api/auth'
import { API_CONFIG } from '../config/api'
import type { User, UserStats } from '../types/user'

const userStore = useUserStore()
const API_BASE_URL = API_CONFIG.BASE_URL

const activeTab = ref('edit')
const userInfo = ref<User | null>(null)
const stats = ref<UserStats | null>(null)
const updating = ref(false)
const changingPassword = ref(false)
const avatarUploading = ref(false)

const editFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const editForm = reactive({
  display_name: '',
  email: '',
  bio: '',
  location: '',
  website: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const editRules = {
  display_name: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '个人简介不能超过200个字符', trigger: 'blur' }
  ],
  location: [
    { max: 100, message: '所在地不能超过100个字符', trigger: 'blur' }
  ],
  website: [
    { 
      validator: (rule: any, value: string, callback: Function) => {
        if (!value) {
          callback() // 空值时跳过验证
          return
        }
        // 简单的URL格式验证
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
        if (!urlRegex.test(value)) {
          callback(new Error('请输入正确的网站地址'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
    { max: 50, message: '密码长度不能超过50个字符', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (!value) {
          callback()
          return
        }
        // 检查密码复杂度：至少包含字母和数字
        const hasLetter = /[a-zA-Z]/.test(value)
        const hasNumber = /\d/.test(value)
        if (!hasLetter || !hasNumber) {
          callback(new Error('密码必须包含字母和数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 获取头像URL
const getAvatarUrl = (avatarUrl?: string) => {
  if (!avatarUrl) return undefined
  
  // 如果已经是完整URL，直接返回
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl
  }
  
  // 如果是相对路径，拼接API base URL
  return `${API_BASE_URL}${avatarUrl}`
}

const loadUserData = async () => {
  try {
    const response = await authApi.getCurrentUser()
    console.log('用户数据响应:', response)
    
    if (response.success) {
      userInfo.value = response.data.user
      stats.value = response.data.stats
      
      console.log('用户统计数据:', stats.value)
      
      Object.assign(editForm, {
        display_name: response.data.user.display_name || '',
        email: response.data.user.email || '',
        bio: response.data.user.bio || '',
        location: response.data.user.location || '',
        website: response.data.user.website || ''
      })
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

const updateProfile = async () => {
  if (!editFormRef.value) return
  
  try {
    const valid = await editFormRef.value.validate()
    if (!valid) return
    
    updating.value = true
    console.log('提交的表单数据:', editForm)
    
    const response = await authApi.updateProfile(editForm)
    console.log('更新响应:', response)
    
    if (response.success) {
      ElMessage({
        message: '个人资料更新成功',
        type: 'success',
        duration: 3000,
        showClose: true
      })
      userInfo.value = response.data.user
      // 更新全局用户状态
      userStore.updateUser(response.data.user)
      
      // 短暂高亮显示成功状态
      setTimeout(() => {
        console.log('资料更新完成')
      }, 1000)
    } else {
      ElMessage.error(response.error || '更新失败')
    }
  } catch (error: any) {
    console.error('更新个人资料失败:', error)
    ElMessage.error(error.response?.data?.error || '更新失败')
  } finally {
    updating.value = false
  }
}

const resetForm = () => {
  if (userInfo.value) {
    Object.assign(editForm, {
      display_name: userInfo.value.display_name || '',
      email: userInfo.value.email || '',
      bio: userInfo.value.bio || '',
      location: userInfo.value.location || '',
      website: userInfo.value.website || ''
    })
    
    // 清除表单验证状态
    editFormRef.value?.clearValidate()
    
    ElMessage({
      message: '表单已重置为原始数据',
      type: 'info',
      duration: 2000
    })
  }
}

const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return
    
    changingPassword.value = true
    console.log('提交密码修改请求...')
    
    const response = await authApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    
    console.log('密码修改响应:', response)
    
    if (response.success) {
      ElMessage({
        message: '密码修改成功，建议重新登录以确保安全',
        type: 'success',
        duration: 4000,
        showClose: true
      })
      resetPasswordForm()
      
      // 建议用户重新登录
      setTimeout(() => {
        ElMessageBox.confirm(
          '密码已修改成功，建议重新登录以确保账户安全。是否现在重新登录？',
          '密码修改成功',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '稍后登录',
            type: 'warning'
          }
        ).then(() => {
          // 用户选择重新登录
          userStore.logout().then(() => {
            window.location.href = '/login'
          })
        }).catch(() => {
          // 用户选择稍后登录，什么都不做
        })
      }, 1500)
    } else {
      ElMessage.error(response.error || '修改密码失败')
    }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    
    // 解析具体的错误信息
    let errorMsg = '修改密码失败'
    if (error.response?.data?.error) {
      errorMsg = error.response.data.error
    } else if (error.response?.status === 500) {
      errorMsg = '服务器内部错误，请稍后重试'
    } else if (error.message) {
      errorMsg = error.message
    }
    
    ElMessage.error(errorMsg)
  } finally {
    changingPassword.value = false
  }
}

const resetPasswordForm = () => {
  Object.assign(passwordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  passwordFormRef.value?.clearValidate()
  
  ElMessage({
    message: '密码表单已重置',
    type: 'info',
    duration: 2000
  })
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('头像只支持图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像文件大小不能超过 2MB!')
    return false
  }
  
  avatarUploading.value = true
  return true
}

const handleAvatarProgress = (evt: any) => {
  // 可以在这里显示上传进度
  console.log('上传进度:', evt.percent)
}

const handleAvatarSuccess = (response: any) => {
  avatarUploading.value = false
  
  if (response.success) {
    ElMessage.success('头像上传成功')
    
    // 更新本地用户信息
    userInfo.value = response.data.user
    
    // 更新全局用户状态，这会触发所有使用userStore的组件更新
    userStore.updateUser(response.data.user)
    
    console.log('头像更新成功:', response.data.user.avatar_url)
  } else {
    ElMessage.error(response.error || '头像上传失败')
  }
}

const handleAvatarError = (error: any) => {
  avatarUploading.value = false
  console.error('头像上传失败:', error)
  
  // 解析错误信息
  let errorMessage = '头像上传失败'
  if (error.response?.data?.error) {
    errorMessage = error.response.data.error
  } else if (error.message) {
    errorMessage = error.message
  }
  
  ElMessage.error(errorMessage)
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  position: relative;
}

.avatar-section .el-avatar {
  border: 3px solid rgba(64, 158, 255, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-section .el-avatar:hover {
  border-color: rgba(64, 158, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.upload-avatar-btn {
  margin-top: 10px;
  border-radius: 20px;
  padding: 8px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.upload-avatar-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.upload-avatar-btn:active {
  transform: translateY(0);
}

.avatar-upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-tip {
  margin: 0;
  font-size: 12px;
  color: #909399;
  text-align: center;
  line-height: 1.4;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.username {
  margin: 0 0 12px 0;
  color: #909399;
  font-size: 16px;
}

.bio {
  margin: 0 0 16px 0;
  color: #606266;
  line-height: 1.6;
  font-size: 16px;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.user-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-meta a {
  color: #409eff;
  text-decoration: none;
}

.user-meta a:hover {
  text-decoration: underline;
}

.stats-section {
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 30px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.content-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.edit-profile-form,
.change-password-form {
  padding: 30px;
  max-width: 600px;
}

.password-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: #f8f9fa;
  padding: 0 30px;
}

:deep(.el-tabs__content) {
  padding: 0;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .user-meta {
    justify-content: center;
  }
  
  .edit-profile-form,
  .change-password-form {
    padding: 20px;
  }
}
</style>