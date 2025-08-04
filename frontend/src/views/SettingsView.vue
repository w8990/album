<template>
  <div class="settings-container">
    <div class="header">
      <el-button 
        type="text" 
        @click="$router.go(-1)"
        class="back-button"
      >
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>账户设置</h1>
    </div>

    <div class="settings-content">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane label="账户安全" name="security">
          <AccountSecurity />
        </el-tab-pane>
        <el-tab-pane label="隐私设置" name="privacy">
          <PrivacySettings />
        </el-tab-pane>
        <el-tab-pane label="系统设置" name="system">
          <SystemSettings />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import AccountSecurity from '../components/settings/AccountSecurity.vue'
import PrivacySettings from '../components/settings/PrivacySettings.vue'
import SystemSettings from '../components/settings/SystemSettings.vue'

const activeTab = ref('security')
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  gap: 15px;
}

.back-button {
  color: #666;
  font-size: 14px;
}

.back-button:hover {
  color: #409eff;
}

h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 500;
}

.settings-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

:deep(.settings-tabs) {
  .el-tabs__header {
    margin: 0;
    background: #f8f9fa;
    padding: 0 20px;
  }

  .el-tabs__nav-wrap::after {
    display: none;
  }

  .el-tabs__item {
    height: 56px;
    line-height: 56px;
    font-size: 14px;
    font-weight: 500;
  }

  .el-tabs__content {
    padding: 30px;
  }

  .el-tab-pane {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .settings-container {
    padding: 10px;
  }
  
  .settings-content {
    border-radius: 0;
    box-shadow: none;
  }
  
  :deep(.settings-tabs) {
    .el-tabs__content {
      padding: 20px 15px;
    }
  }
}
</style>