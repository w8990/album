<template>
  <div class="account-security">
    <!-- 密码修改 -->
    <div class="settings-section">
      <h3>修改密码</h3>
      <p class="section-description">
        为了账户安全，请定期更换密码。新密码应包含字母、数字，长度至少6位。
      </p>
      
      <el-form 
        :model="passwordForm" 
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="120px"
        class="password-form"
      >
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
        
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleChangePassword"
            :loading="changing"
          >
            {{ changing ? '修改中...' : '修改密码' }}
          </el-button>
          <el-button @click="resetPasswordForm" :disabled="changing">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 账户信息 -->
    <div class="settings-section">
      <h3>账户信息</h3>
      <div class="account-info" v-if="userStore.user">
        <div class="info-row">
          <span class="label">用户名：</span>
          <span class="value">{{ userStore.user.username }}</span>
          <el-tag size="small" type="info">不可修改</el-tag>
        </div>
        <div class="info-row">
          <span class="label">注册邮箱：</span>
          <span class="value">{{ userStore.user.email }}</span>
          <el-button type="text" size="small" @click="goToProfile">去个人资料页面修改</el-button>
        </div>
        <div class="info-row">
          <span class="label">上次登录时间：</span>
          <span class="value">{{ formatTime(userStore.user.last_login_at) }}</span>
        </div>
        <div class="info-row">
          <span class="label">账户创建时间：</span>
          <span class="value">{{ formatTime(userStore.user.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- 安全提示 -->
    <div class="settings-section">
      <h3>安全建议</h3>
      <div class="security-tips">
        <div class="tip-item">
          <div class="tip-content">
            <h4>使用强密码</h4>
            <p>包含大小写字母、数字和特殊符号，长度至少8位</p>
          </div>
        </div>
        
        <div class="tip-item">
          <div class="tip-content">
            <h4>定期更换密码</h4>
            <p>建议每3-6个月更换一次密码</p>
          </div>
        </div>
        
        <div class="tip-item">
          <div class="tip-content">
            <h4>保护账户安全</h4>
            <p>不要在公共场所或不安全的网络环境下登录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { changePassword } from '../../api/auth'

const router = useRouter()
const userStore = useUserStore()
const passwordFormRef = ref<FormInstance>()
const changing = ref(false)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
    { max: 50, message: '密码长度不能超过50个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.clearValidate()
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return
    
    changing.value = true
    
    const response = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (response.success) {
      ElMessage.success('密码修改成功')
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
          userStore.logout().then(() => {
            window.location.href = '/login'
          })
        }).catch(() => {
          // 用户选择稍后登录
        })
      }, 1000)
    } else {
      ElMessage.error(response.error || '修改密码失败')
    }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.response?.data?.error || '修改密码失败，请重试')
  } finally {
    changing.value = false
  }
}

const formatTime = (time: string | null) => {
  if (!time) return '暂无记录'
  return new Date(time).toLocaleString('zh-CN')
}

const goToProfile = () => {
  router.push('/profile')
}
</script>

<style scoped>
.account-security {
  max-width: 600px;
}

.settings-section {
  margin-bottom: 40px;
}

.settings-section h3 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.section-description {
  margin: 0 0 20px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.password-form {
  margin-top: 20px;
}

.password-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

.account-info {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #606266;
  font-size: 14px;
  min-width: 120px;
}

.value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.security-tips {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.tip-content h4 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.tip-content p {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .label {
    min-width: auto;
  }
}
</style>