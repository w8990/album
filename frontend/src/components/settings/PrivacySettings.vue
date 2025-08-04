<template>
  <div class="privacy-settings">
    <div class="settings-section">
      <h3>隐私控制</h3>
      <div class="privacy-options">
        <div class="option-item">
          <div class="option-header">
            <h4>默认相册隐私</h4>
            <p>设置新创建相册的默认隐私级别</p>
          </div>
          <el-select 
            v-model="privacySettings.defaultAlbumPrivacy" 
            @change="updatePrivacySetting('defaultAlbumPrivacy', $event)"
            class="privacy-select"
          >
            <el-option label="公开" value="public" />
            <el-option label="仅好友" value="friends" />
            <el-option label="私密" value="private" />
          </el-select>
        </div>

        <div class="option-item">
          <div class="option-header">
            <h4>默认文件隐私</h4>
            <p>设置新上传文件的默认隐私级别</p>
          </div>
          <el-select 
            v-model="privacySettings.defaultFilePrivacy" 
            @change="updatePrivacySetting('defaultFilePrivacy', $event)"
            class="privacy-select"
          >
            <el-option label="公开" value="public" />
            <el-option label="仅好友" value="friends" />
            <el-option label="私密" value="private" />
          </el-select>
        </div>

        <div class="option-item">
          <div class="option-header">
            <h4>个人资料可见性</h4>
            <p>控制其他用户是否能查看你的个人资料</p>
          </div>
          <el-switch
            v-model="privacySettings.profileVisible"
            @change="updatePrivacySetting('profileVisible', $event)"
            active-text="公开"
            inactive-text="私密"
          />
        </div>

        <div class="option-item">
          <div class="option-header">
            <h4>允许关注</h4>
            <p>允许其他用户关注你</p>
          </div>
          <el-switch
            v-model="privacySettings.allowFollow"
            @change="updatePrivacySetting('allowFollow', $event)"
            active-text="允许"
            inactive-text="禁止"
          />
        </div>

        <div class="option-item">
          <div class="option-header">
            <h4>显示在线状态</h4>
            <p>让其他用户知道你当前在线</p>
          </div>
          <el-switch
            v-model="privacySettings.showOnlineStatus"
            @change="updatePrivacySetting('showOnlineStatus', $event)"
            active-text="显示"
            inactive-text="隐藏"
          />
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>数据管理</h3>
      <div class="data-options">
        <div class="option-item">
          <div class="option-header">
            <h4>数据导出</h4>
            <p>导出你的个人数据，包括相册、文件等信息</p>
          </div>
          <el-button 
            @click="exportData"
            :loading="exporting"
            type="primary"
            plain
          >
            {{ exporting ? '导出中...' : '导出数据' }}
          </el-button>
        </div>

        <div class="option-item danger">
          <div class="option-header">
            <h4>删除账户</h4>
            <p>永久删除你的账户和所有相关数据，此操作不可恢复</p>
          </div>
          <el-button 
            @click="confirmDeleteAccount"
            type="danger"
            plain
          >
            删除账户
          </el-button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>隐私说明</h3>
      <div class="privacy-info">
        <div class="info-item">
          <h4>公开</h4>
          <p>所有用户都可以查看</p>
        </div>
        
        <div class="info-item">
          <h4>仅好友</h4>
          <p>只有你的关注者和好友可以查看</p>
        </div>
        
        <div class="info-item">
          <h4>私密</h4>
          <p>只有你自己可以查看</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const exporting = ref(false)

const privacySettings = reactive({
  defaultAlbumPrivacy: 'public',
  defaultFilePrivacy: 'public',
  profileVisible: true,
  allowFollow: true,
  showOnlineStatus: true
})

const loadPrivacySettings = () => {
  // 这里应该从后端加载用户的隐私设置
  // 暂时使用默认值
  const savedSettings = localStorage.getItem('privacySettings')
  if (savedSettings) {
    Object.assign(privacySettings, JSON.parse(savedSettings))
  }
}

const updatePrivacySetting = (key: string, value: any) => {
  // 这里应该调用后端API更新设置
  console.log(`更新隐私设置: ${key} = ${value}`)
  
  // 暂时保存到本地存储
  localStorage.setItem('privacySettings', JSON.stringify(privacySettings))
  
  ElMessage.success('隐私设置已更新')
}

const exportData = async () => {
  try {
    exporting.value = true
    
    // 这里应该调用后端API导出数据
    await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟导出过程
    
    ElMessage.success('数据导出成功，请检查下载文件夹')
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('数据导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

const confirmDeleteAccount = async () => {
  try {
    await ElMessageBox.confirm(
      '删除账户将永久移除所有数据，包括相册、文件、评论等。此操作不可恢复，确定要继续吗？',
      '删除账户确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // 二次确认
    const { value } = await ElMessageBox.prompt(
      '请输入 "删除我的账户" 来确认此操作',
      '删除账户确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        inputPattern: /^删除我的账户$/,
        inputErrorMessage: '请准确输入 "删除我的账户"',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    if (value === '删除我的账户') {
      // 这里应该调用后端API删除账户
      console.log('删除账户请求')
      ElMessage.success('账户删除请求已提交，我们会在24小时内处理')
    }
  } catch (error) {
    console.log('用户取消删除账户')
  }
}

onMounted(() => {
  loadPrivacySettings()
})
</script>

<style scoped>
.privacy-settings {
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

.privacy-options,
.data-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.option-item.danger {
  border-color: #fbc4c4;
  background: #fef0f0;
}

.option-header {
  flex: 1;
}

.option-header h4 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.option-header p {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.privacy-select {
  width: 120px;
}

.privacy-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.info-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.info-item h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.info-item p {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .option-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .privacy-select {
    width: 100%;
    max-width: 200px;
  }
  
  .privacy-info {
    grid-template-columns: 1fr;
  }
}
</style>