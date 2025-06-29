<template>
  <div class="settings-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><Setting /></el-icon>
            设置
          </h1>
          <p class="page-subtitle">管理你的账户和偏好设置</p>
        </div>
        
        <!-- 快捷操作 -->
        <div class="header-actions">
          <el-button @click="resetSettings" :icon="RefreshRight">
            重置设置
          </el-button>
          <el-button type="primary" @click="saveAllSettings" :icon="Check">
            保存所有设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 侧边导航 -->
      <div class="settings-nav">
        <el-menu
          :default-active="activeSection"
          class="nav-menu"
          @select="handleNavSelect"
        >
          <el-menu-item index="profile">
            <el-icon><User /></el-icon>
            <span>个人资料</span>
          </el-menu-item>
          
          <el-menu-item index="account">
            <el-icon><Lock /></el-icon>
            <span>账户安全</span>
          </el-menu-item>
          
          <el-menu-item index="privacy">
            <el-icon><View /></el-icon>
            <span>隐私设置</span>
          </el-menu-item>
          
          <el-menu-item index="notifications">
            <el-icon><Bell /></el-icon>
            <span>通知设置</span>
          </el-menu-item>
          
          <el-menu-item index="appearance">
            <el-icon><Sunny /></el-icon>
            <span>外观设置</span>
          </el-menu-item>
          
          <el-menu-item index="storage">
            <el-icon><FolderOpened /></el-icon>
            <span>存储管理</span>
          </el-menu-item>
          
          <el-menu-item index="advanced">
            <el-icon><Tools /></el-icon>
            <span>高级设置</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 设置面板 -->
      <div class="settings-panel">
        <!-- 个人资料 -->
        <div v-if="activeSection === 'profile'" class="setting-section">
          <div class="section-header">
            <h2>个人资料</h2>
            <p>管理你的个人信息和公开资料</p>
          </div>
          
          <div class="setting-cards">
            <el-card>
              <template #header>
                <span class="card-title">基本信息</span>
              </template>
              
              <el-form :model="profileSettings" label-width="100px">
                <el-form-item label="用户名">
                  <el-input v-model="profileSettings.username" disabled />
                  <div class="form-tip">用户名无法修改</div>
                </el-form-item>
                
                <el-form-item label="昵称">
                  <el-input v-model="profileSettings.nickname" placeholder="请输入昵称" />
                </el-form-item>
                
                <el-form-item label="邮箱">
                  <el-input v-model="profileSettings.email" placeholder="请输入邮箱" />
                  <div class="form-tip">用于账户安全和通知</div>
                </el-form-item>
                
                <el-form-item label="手机号">
                  <el-input v-model="profileSettings.phone" placeholder="请输入手机号" />
                </el-form-item>
                
                <el-form-item label="个人简介">
                  <el-input 
                    v-model="profileSettings.bio"
                    type="textarea"
                    :rows="4"
                    placeholder="介绍一下你自己..."
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveProfile">保存更改</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </div>

        <!-- 账户安全 -->
        <div v-if="activeSection === 'account'" class="setting-section">
          <div class="section-header">
            <h2>账户安全</h2>
            <p>保护你的账户安全，管理登录和密码</p>
          </div>
          
          <div class="setting-cards">
            <el-card>
              <template #header>
                <span class="card-title">密码管理</span>
              </template>
              
              <el-form :model="passwordForm" label-width="120px">
                <el-form-item label="当前密码">
                  <el-input 
                    v-model="passwordForm.currentPassword" 
                    type="password" 
                    placeholder="请输入当前密码"
                    show-password
                  />
                </el-form-item>
                
                <el-form-item label="新密码">
                  <el-input 
                    v-model="passwordForm.newPassword" 
                    type="password" 
                    placeholder="请输入新密码"
                    show-password
                  />
                </el-form-item>
                
                <el-form-item label="确认新密码">
                  <el-input 
                    v-model="passwordForm.confirmPassword" 
                    type="password" 
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="changePassword">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-card>
            
            <el-card>
              <template #header>
                <span class="card-title">两步验证</span>
              </template>
              
              <div class="two-factor-section">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>短信验证</h4>
                    <p>登录时需要手机短信验证码</p>
                  </div>
                  <el-switch v-model="securitySettings.smsAuth" />
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>邮箱验证</h4>
                    <p>登录时需要邮箱验证码</p>
                  </div>
                  <el-switch v-model="securitySettings.emailAuth" />
                </div>
              </div>
            </el-card>
            
            <el-card>
              <template #header>
                <span class="card-title">登录记录</span>
              </template>
              
              <div class="login-history">
                <div v-for="record in loginHistory" :key="record.id" class="login-record">
                  <div class="record-info">
                    <div class="record-device">
                      <el-icon><Monitor /></el-icon>
                      {{ record.device }}
                    </div>
                    <div class="record-location">{{ record.location }}</div>
                    <div class="record-time">{{ formatDate(record.time) }}</div>
                  </div>
                  <div class="record-status" :class="{ current: record.isCurrent }">
                    {{ record.isCurrent ? '当前设备' : '历史登录' }}
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 隐私设置 -->
        <div v-if="activeSection === 'privacy'" class="setting-section">
          <div class="section-header">
            <h2>隐私设置</h2>
            <p>控制谁可以看到你的信息和内容</p>
          </div>
          
          <div class="setting-cards">
            <el-card>
              <template #header>
                <span class="card-title">资料可见性</span>
              </template>
              
              <div class="privacy-settings">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>个人资料可见性</h4>
                    <p>控制谁可以查看你的个人资料</p>
                  </div>
                  <el-select v-model="privacySettings.profileVisibility">
                    <el-option label="所有人" value="public" />
                    <el-option label="仅关注者" value="followers" />
                    <el-option label="仅自己" value="private" />
                  </el-select>
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>相册默认隐私</h4>
                    <p>新创建相册的默认隐私设置</p>
                  </div>
                  <el-select v-model="privacySettings.defaultAlbumPrivacy">
                    <el-option label="公开" value="public" />
                    <el-option label="私密" value="private" />
                  </el-select>
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>允许他人关注</h4>
                    <p>其他用户是否可以关注你</p>
                  </div>
                  <el-switch v-model="privacySettings.allowFollow" />
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>显示在线状态</h4>
                    <p>是否向其他用户显示在线状态</p>
                  </div>
                  <el-switch v-model="privacySettings.showOnlineStatus" />
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 通知设置 -->
        <div v-if="activeSection === 'notifications'" class="setting-section">
          <div class="section-header">
            <h2>通知设置</h2>
            <p>管理你接收的通知类型和方式</p>
          </div>
          
          <div class="setting-cards">
            <el-card>
              <template #header>
                <span class="card-title">推送通知</span>
              </template>
              
              <div class="notification-settings">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>新粉丝通知</h4>
                    <p>有人关注你时接收通知</p>
                  </div>
                  <el-switch v-model="notificationSettings.newFollower" />
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>点赞通知</h4>
                    <p>有人点赞你的内容时接收通知</p>
                  </div>
                  <el-switch v-model="notificationSettings.likes" />
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>评论通知</h4>
                    <p>有人评论你的内容时接收通知</p>
                  </div>
                  <el-switch v-model="notificationSettings.comments" />
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>系统通知</h4>
                    <p>接收系统相关的重要通知</p>
                  </div>
                  <el-switch v-model="notificationSettings.system" />
                </div>
              </div>
            </el-card>
            
            <el-card>
              <template #header>
                <span class="card-title">邮件通知</span>
              </template>
              
              <div class="notification-settings">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>每周摘要</h4>
                    <p>每周发送活动摘要邮件</p>
                  </div>
                  <el-switch v-model="emailSettings.weeklyDigest" />
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>活动提醒</h4>
                    <p>重要活动和更新的邮件提醒</p>
                  </div>
                  <el-switch v-model="emailSettings.activityReminder" />
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 外观设置 -->
        <div v-if="activeSection === 'appearance'" class="setting-section">
          <div class="section-header">
            <h2>外观设置</h2>
            <p>个性化你的界面外观和体验</p>
          </div>
          
          <div class="setting-cards">
            <el-card>
              <template #header>
                <span class="card-title">主题设置</span>
              </template>
              
              <div class="appearance-settings">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>主题模式</h4>
                    <p>选择你喜欢的界面主题</p>
                  </div>
                  <el-radio-group v-model="appearanceSettings.theme">
                    <el-radio value="light">浅色</el-radio>
                    <el-radio value="dark">深色</el-radio>
                    <el-radio value="auto">跟随系统</el-radio>
                  </el-radio-group>
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>语言</h4>
                    <p>选择界面显示语言</p>
                  </div>
                  <el-select v-model="appearanceSettings.language">
                    <el-option label="简体中文" value="zh-CN" />
                    <el-option label="繁體中文" value="zh-TW" />
                    <el-option label="English" value="en-US" />
                  </el-select>
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>动画效果</h4>
                    <p>启用界面动画和过渡效果</p>
                  </div>
                  <el-switch v-model="appearanceSettings.animations" />
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 存储管理 -->
        <div v-if="activeSection === 'storage'" class="setting-section">
          <div class="section-header">
            <h2>存储管理</h2>
            <p>查看和管理你的存储空间使用情况</p>
          </div>
          
          <div class="setting-cards">
            <el-card>
              <template #header>
                <span class="card-title">存储使用情况</span>
              </template>
              
              <div class="storage-overview">
                <div class="storage-chart">
                  <el-progress 
                    type="circle" 
                    :percentage="storageUsage.percentage"
                    :width="120"
                    :stroke-width="8"
                  >
                    <span class="storage-text">
                      {{ storageUsage.used }} / {{ storageUsage.total }}
                    </span>
                  </el-progress>
                </div>
                
                <div class="storage-details">
                  <div class="storage-item">
                    <span class="storage-label">照片</span>
                    <span class="storage-value">{{ storageUsage.photos }}</span>
                  </div>
                  <div class="storage-item">
                    <span class="storage-label">视频</span>
                    <span class="storage-value">{{ storageUsage.videos }}</span>
                  </div>
                  <div class="storage-item">
                    <span class="storage-label">其他</span>
                    <span class="storage-value">{{ storageUsage.others }}</span>
                  </div>
                </div>
              </div>
              
              <div class="storage-actions">
                <el-button @click="cleanCache">清理缓存</el-button>
                <el-button type="primary">升级存储</el-button>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 高级设置 -->
        <div v-if="activeSection === 'advanced'" class="setting-section">
          <div class="section-header">
            <h2>高级设置</h2>
            <p>数据管理和账户操作</p>
          </div>
          
          <div class="setting-cards">
            <el-card>
              <template #header>
                <span class="card-title">数据管理</span>
              </template>
              
              <div class="advanced-settings">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>导出数据</h4>
                    <p>下载你的所有数据副本</p>
                  </div>
                  <el-button @click="exportData">导出数据</el-button>
                </div>
                
                <div class="setting-item dangerous">
                  <div class="setting-info">
                    <h4>删除账户</h4>
                    <p>永久删除你的账户和所有数据</p>
                  </div>
                  <el-button type="danger" @click="deleteAccount">删除账户</el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../stores/user.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting,
  User,
  Lock,
  View,
  Bell,
  Sunny,
  FolderOpened,
  Tools,
  Monitor,
  RefreshRight,
  Check
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const activeSection = ref('profile')

// 个人资料设置
const profileSettings = reactive({
  username: 'user123',
  nickname: '摄影爱好者',
  email: 'user@example.com',
  phone: '138****8888',
  bio: '热爱摄影，记录生活美好瞬间'
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 安全设置
const securitySettings = reactive({
  smsAuth: false,
  emailAuth: true
})

// 隐私设置
const privacySettings = reactive({
  profileVisibility: 'public',
  defaultAlbumPrivacy: 'public',
  allowFollow: true,
  showOnlineStatus: true
})

// 通知设置
const notificationSettings = reactive({
  newFollower: true,
  likes: true,
  comments: true,
  system: true
})

// 邮件设置
const emailSettings = reactive({
  weeklyDigest: true,
  activityReminder: false
})

// 外观设置
const appearanceSettings = reactive({
  theme: 'light',
  language: 'zh-CN',
  animations: true
})

// 存储使用情况
const storageUsage = reactive({
  used: '2.1 GB',
  total: '5 GB',
  percentage: 42,
  photos: '1.8 GB',
  videos: '200 MB',
  others: '100 MB'
})

// 登录记录
const loginHistory = ref([
  {
    id: 1,
    device: 'Chrome 在 Windows',
    location: '北京, 中国',
    time: '2024-03-15T10:30:00Z',
    isCurrent: true
  },
  {
    id: 2,
    device: 'Safari 在 iPhone',
    location: '北京, 中国',
    time: '2024-03-14T15:20:00Z',
    isCurrent: false
  }
])

// 导航选择
const handleNavSelect = (index) => {
  activeSection.value = index
}

// 保存个人资料
const saveProfile = () => {
  ElMessage.success('个人资料已保存')
}

// 修改密码
const changePassword = () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  ElMessage.success('密码修改成功')
  Object.assign(passwordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
}

// 清理缓存
const cleanCache = async () => {
  try {
    // 模拟清理缓存操作
    const loading = ElMessage.loading('正在清理缓存...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    loading.close()
    ElMessage.success('缓存清理成功')
    
    // 更新存储使用情况
    storageUsage.used = '1.9 GB'
    storageUsage.percentage = 38
    storageUsage.others = '50 MB'
  } catch (error) {
    ElMessage.error('缓存清理失败')
  }
}

// 导出数据
const exportData = async () => {
  try {
    const result = await ElMessageBox.confirm(
      '导出数据可能需要一些时间，确定要继续吗？',
      '确认导出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    if (result === 'confirm') {
      const loading = ElMessage.loading('正在准备导出数据...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      loading.close()
      ElMessage.success('数据导出已开始，完成后将发送下载链接到您的邮箱')
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 删除账户
const deleteAccount = async () => {
  try {
    const result = await ElMessageBox.prompt(
      '此操作不可逆转！请输入 "DELETE" 确认删除账户',
      '危险操作',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          if (value !== 'DELETE') {
            return '请输入 "DELETE" 确认操作'
          }
          return true
        },
        type: 'error'
      }
    )
    
    if (result.value === 'DELETE') {
      ElMessage.error('账户删除功能暂未开放，请联系客服')
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 保存所有设置
const saveAllSettings = async () => {
  try {
    const loading = ElMessage.loading('保存设置中...')
    
    // 模拟保存操作
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    loading.close()
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存设置失败')
  }
}

// 重置设置
const resetSettings = async () => {
  try {
    const result = await ElMessageBox.confirm(
      '确定要重置所有设置为默认值吗？',
      '重置设置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      // 重置所有设置
      Object.assign(privacySettings, {
        profileVisibility: 'public',
        defaultAlbumPrivacy: 'public',
        allowFollow: true,
        showOnlineStatus: true
      })
      
      Object.assign(notificationSettings, {
        newFollower: true,
        likes: true,
        comments: true,
        system: true
      })
      
      Object.assign(emailSettings, {
        weeklyDigest: true,
        activityReminder: false
      })
      
      Object.assign(appearanceSettings, {
        theme: 'light',
        language: 'zh-CN',
        animations: true
      })
      
      ElMessage.success('设置已重置为默认值')
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 主题切换
const handleThemeChange = (theme) => {
  appearanceSettings.theme = theme
  // 这里可以实现实际的主题切换逻辑
  document.documentElement.setAttribute('data-theme', theme)
  ElMessage.success(`已切换到${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '自动'}主题`)
}

// 语言切换
const handleLanguageChange = (language) => {
  appearanceSettings.language = language
  ElMessage.success('语言设置已更新，刷新页面后生效')
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取用户设置
const loadUserSettings = async () => {
  try {
    // 从userStore或API获取用户设置
    if (userStore.user) {
      profileSettings.username = userStore.user.username || 'user123'
      profileSettings.nickname = userStore.user.nickname || userStore.user.display_name || '摄影爱好者'
      profileSettings.email = userStore.user.email || 'user@example.com'
      profileSettings.bio = userStore.user.bio || '热爱摄影，记录生活美好瞬间'
    }
  } catch (error) {
    console.error('加载用户设置失败:', error)
  }
}

// 实时保存开关设置
const handleSettingChange = (settingType, key, value) => {
  console.log(`设置更新: ${settingType}.${key} = ${value}`)
  // 这里可以实现实时保存到后端
  ElMessage.success('设置已更新')
}

onMounted(() => {
  loadUserSettings()
})
</script>

<style scoped>
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-left h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
}

.settings-content {
  display: flex;
  gap: 24px;
}

.settings-nav {
  width: 280px;
  flex-shrink: 0;
}

.nav-menu {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
}

.nav-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  border-radius: 8px;
  margin: 8px 12px;
  color: #6b7280;
  font-weight: 500;
}

.nav-menu .el-menu-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.settings-panel {
  flex: 1;
}

.setting-section {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  padding: 32px 32px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.section-header p {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
}

.setting-cards {
  padding: 24px;
}

.setting-cards .el-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: none;
}

.setting-cards .el-card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #f3f4f6;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.dangerous {
  border-color: #fecaca;
  background: #fef2f2;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.setting-info h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.setting-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.login-history {
  max-height: 300px;
  overflow-y: auto;
}

.login-record {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

.login-record:last-child {
  border-bottom: none;
}

.record-info {
  flex: 1;
}

.record-device {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.record-location {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 2px;
}

.record-time {
  font-size: 12px;
  color: #9ca3af;
}

.record-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  background: #f3f4f6;
  color: #6b7280;
}

.record-status.current {
  background: #dcfce7;
  color: #16a34a;
}

.storage-overview {
  display: flex;
  gap: 32px;
  align-items: center;
  margin-bottom: 24px;
}

.storage-chart {
  flex-shrink: 0;
}

.storage-text {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.storage-details {
  flex: 1;
}

.storage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.storage-label {
  color: #6b7280;
}

.storage-value {
  font-weight: 600;
  color: #1f2937;
}

.storage-actions {
  display: flex;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-content {
    flex-direction: column;
  }
  
  .settings-nav {
    width: 100%;
  }
  
  .nav-menu {
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .nav-menu .el-menu-item {
    flex-shrink: 0;
    margin: 8px 4px;
  }
  
  .section-header {
    padding: 24px 20px 16px;
  }
  
  .setting-cards {
    padding: 16px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .storage-overview {
    flex-direction: column;
    text-align: center;
  }
}
</style> 