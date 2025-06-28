<template>
  <div class="home-redesign">
    <el-container>
      <el-main>
        <el-row justify="center">
          <el-col :xs="24" :sm="20" :md="16" :lg="12">
            <el-card class="intro-card">
              <div class="card-content-wrapper">
                <div class="text-content">
                  <h1>文件上传与预览系统</h1>
                  <p>一个简单易用的平台，让您轻松上传、预览和管理您的图片和视频文件。</p>
                  <el-divider></el-divider>
                  <div class="feature-highlight">
                    <p>主要功能：</p>
                    <ul>
                      <li>支持多种图片和视频格式上传</li>
                      <li>高清在线预览</li>
                      <li>便捷的文件列表查看与删除</li>
                    </ul>
                  </div>
                  <div class="action-area">
                    <el-button type="primary" size="large" @click="$router.push('/upload')">立即上传</el-button>
                    <el-button size="large" @click="$router.push('/preview')">查看文件</el-button>
                  </div>
                </div>
                <div class="illustration">
                  <!-- 这里可以放置一个简单的插图或者占位符 -->
                  <img src="/placeholder.svg" alt="Illustration" class="illustration-img">
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
// No script needed for this simple layout
</script>

<style scoped>
.home-redesign {
  min-height: calc(100vh - 60px); /* 减去导航栏高度 */
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.el-container {
  width: 100%;
}

.el-main {
  padding: 0 !important; /* Element Plus el-main default padding */
  display: flex;
  justify-content: center;
  align-items: center;
}

.intro-card {
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  background-color: #fff;
}

.card-content-wrapper {
  display: flex;
  flex-direction: column; /* Default to column layout */
  gap: 40px;
}

@media (min-width: 768px) {
  .card-content-wrapper {
    flex-direction: row; /* Row layout on larger screens */
    align-items: center;
    justify-content: space-between;
  }
}

.text-content {
  flex: 1;
}

.text-content h1 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 10px;
}

.text-content p {
  font-size: 18px;
  color: #606266;
  line-height: 1.6;
}

.feature-highlight ul {
  list-style: none;
  padding: 0;
  margin-top: 15px;
}

.feature-highlight li {
  font-size: 16px;
  color: #909399;
  margin-bottom: 8px;
  position: relative;
  padding-left: 20px;
}

.feature-highlight li::before {
  content: '•'; /* Using a simple bullet */
  color: #409EFF; /* Element Plus primary color */
  font-weight: bold;
  position: absolute;
  left: 0;
}

.action-area {
  margin-top: 30px;
  display: flex;
  gap: 20px;
}

@media (max-width: 600px) {
  .action-area {
    flex-direction: column;
    gap: 10px;
  }
  .action-area .el-button {
    width: 100%;
  }
}

.illustration {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.illustration-img {
  max-width: 100%;
  height: auto;
  display: block;
  /* 可以根据需要调整最大尺寸 */
  max-height: 300px; /* Example max height */
}
</style> 
