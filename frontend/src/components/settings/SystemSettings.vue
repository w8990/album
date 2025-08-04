<template>
  <div class="system-settings">
    <!-- 通知设置 -->
    <div class="settings-section">
      <h3>通知设置</h3>
      <div class="settings-options">
        <div class="option-item">
          <div class="option-header">
            <h4>邮件通知</h4>
            <p>接收系统通知和重要提醒邮件</p>
          </div>
          <el-switch
            v-model="systemSettings.emailNotifications"
            @change="updateSetting('emailNotifications', $event)"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>

        <div class="option-item">
          <div class="option-header">
            <h4>浏览器通知</h4>
            <p>在浏览器中显示实时通知</p>
          </div>
          <el-switch
            v-model="systemSettings.browserNotifications"
            @change="updateSetting('browserNotifications', $event)"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </div>
    </div>

    <!-- 界面设置 -->
    <div class="settings-section">
      <h3>界面设置</h3>
      <div class="settings-options">
        <div class="option-item">
          <div class="option-header">
            <h4>主题模式</h4>
            <p>选择您喜欢的界面主题</p>
          </div>
          <el-select 
            v-model="systemSettings.theme" 
            @change="updateSetting('theme', $event)"
            class="setting-select"
          >
            <el-option label="浅色模式" value="light" />
            <el-option label="深色模式" value="dark" />
            <el-option label="跟随系统" value="auto" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="settings-section">
      <h3>数据管理</h3>
      <div class="data-options">
        <div class="option-item">
          <div class="option-header">
            <h4>清理缓存</h4>
            <p>清理浏览器缓存和临时数据，提升性能</p>
          </div>
          <el-button 
            @click="clearCache"
            :loading="clearing"
            type="primary"
            plain
          >
            {{ clearing ? '清理中...' : '清理缓存' }}
          </el-button>
        </div>

        <div class="option-item">
          <div class="option-header">
            <h4>导出数据</h4>
            <p>导出您的个人数据，包括相册、文件等信息</p>
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
            <p>永久删除您的账户和所有相关数据，此操作不可恢复</p>
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

    <!-- 关于 -->
    <div class="settings-section">
      <h3>关于</h3>
      <div class="about-info">
        <div class="info-item">
          <h4>相册分享系统</h4>
          <p>版本 1.0.0</p>
        </div>
        
        <div class="info-item">
          <h4>技术栈</h4>
          <p>Vue 3 + TypeScript + Element Plus</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const exporting = ref(false)
const clearing = ref(false)

const systemSettings = reactive({
  emailNotifications: true,
  browserNotifications: false,
  theme: 'light'
})

const updateSetting = (key: string, value: any) => {
  console.log(`更新系统设置: ${key} = ${value}`)
  
  // 保存到本地存储
  localStorage.setItem('systemSettings', JSON.stringify(systemSettings))
  
  ElMessage.success('设置已更新')
}

const clearCache = async () => {
  try {
    clearing.value = true
    
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('缓存清理完成')
  } catch (error) {
    console.error('清理缓存失败:', error)
    ElMessage.error('缓存清理失败，请重试')
  } finally {
    clearing.value = false
  }
}

const exportData = async () => {
  try {
    exporting.value = true
    
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
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
        type: 'warning'
      }
    )
    
    ElMessage.success('账户删除请求已提交，我们会在24小时内处理')
  } catch (error) {
    console.log('用户取消删除账户')
  }
}

onMounted(() => {
  // 加载保存的设置
  const savedSettings = localStorage.getItem('systemSettings')
  if (savedSettings) {
    Object.assign(systemSettings, JSON.parse(savedSettings))
  }
})
</script>

<style scoped>
.system-settings {
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

.settings-options,
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

.setting-select {
  width: 150px;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  
  .setting-select {
    width: 100%;
    max-width: 200px;
  }
}
</style>