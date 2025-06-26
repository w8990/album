# 智能文件管理系统

<div align="center">

![Project Logo](https://via.placeholder.com/400x100/667eea/ffffff?text=智能文件管理系统)

**安全、高效、智能的文件上传与管理解决方案**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.0+-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## ✨ 功能特色

### 🎨 现代化界面设计
- **渐变背景**：美观的渐变色彩设计
- **响应式布局**：完美适配桌面端、平板、手机
- **流畅动画**：丰富的过渡动画和交互效果
- **暗色主题**：支持明暗主题切换（规划中）

### 📁 强大的文件管理
- **多格式支持**：图片(JPG/PNG/GIF/WebP)、视频(MP4/WebM/AVI等)
- **批量上传**：支持拖拽上传，最多10个文件同时上传
- **智能搜索**：按文件名快速搜索
- **分类筛选**：按文件类型（图片/视频）筛选
- **多视图模式**：网格视图和列表视图自由切换

### 🖼️ 高级预览功能
- **图片预览**：缩放、旋转、全屏预览
- **视频播放**：在线播放，显示时长和分辨率
- **快捷操作**：下载、分享、删除等一键操作
- **相关推荐**：智能推荐同类型文件

### 🔧 批量操作
- **批量选择**：支持全选/取消全选
- **批量删除**：一键删除多个文件
- **操作反馈**：详细的操作结果反馈

### 📊 统计分析
- **存储统计**：文件数量、总大小统计
- **类型分析**：按文件类型统计
- **上传趋势**：最近上传活动分析

### 🛡️ 安全性保障
- **文件类型验证**：严格的文件类型检查
- **大小限制**：单文件最大100MB
- **错误处理**：完善的错误处理机制
- **数据完整性**：自动检查文件完整性

## 🚀 技术栈

### 前端技术
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Element Plus** - 基于Vue 3的组件库
- **Vue Router** - Vue.js官方路由管理器
- **Vite** - 下一代前端构建工具

### 后端技术
- **Node.js** - JavaScript运行时环境
- **Express** - 快速、极简的Web框架
- **TypeScript** - 类型安全的服务端开发
- **MySQL** - 关系型数据库
- **Multer** - 文件上传中间件

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Git** - 版本控制
- **npm/yarn** - 包管理器

## 📦 快速开始

### 环境要求
- Node.js 18.0+
- MySQL 8.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd album
```

2. **安装前端依赖**
```bash
cd frontend
npm install
```

3. **安装后端依赖**
```bash
cd ../backend
npm install
```

4. **配置数据库**
```bash
# 修改 backend/src/db.ts 中的数据库配置
mysql -u root -p
CREATE DATABASE album;
```

5. **启动开发环境**
```bash
# 启动后端服务 (端口 3000)
cd backend
npm run dev

# 启动前端服务 (端口 5173)
cd ../frontend
npm run dev
```

6. **访问应用**
打开浏览器访问：http://localhost:5173

## 📚 API 文档

### 文件上传
```http
POST /api/upload
Content-Type: multipart/form-data

# 单文件上传
POST /api/upload-single
Content-Type: multipart/form-data
```

### 文件列表
```http
GET /api/files?page=1&limit=20&search=keyword&type=image&sortBy=created_at&sortOrder=DESC
```

### 文件详情
```http
GET /api/files/:id
```

### 文件下载
```http
GET /api/download/:id
```

### 删除文件
```http
DELETE /api/files/:id

# 批量删除
DELETE /api/files/batch
Content-Type: application/json
{
  "ids": [1, 2, 3]
}
```

### 统计信息
```http
GET /api/stats
```

### 健康检查
```http
GET /api/health
```

## 🎯 项目结构

```
album/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── views/           # 页面组件
│   │   │   ├── Home.vue     # 主页（文件管理）
│   │   │   └── Preview.vue  # 文件预览页
│   │   ├── router/          # 路由配置
│   │   ├── config/          # 配置文件
│   │   └── style.css        # 全局样式
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── index.ts         # 服务器入口
│   │   └── db.ts            # 数据库操作
│   ├── uploads/             # 文件存储目录
│   └── package.json
└── README.md                # 项目文档
```

## 🎨 界面预览

### 主页面
- **Hero区域**：渐变背景、统计信息、快速操作
- **文件管理**：搜索、筛选、视图切换、批量操作
- **上传对话框**：拖拽上传、队列管理、进度显示

### 预览页面
- **图片预览**：缩放、旋转、全屏控制
- **视频播放**：在线播放、时长显示
- **文件信息**：详细的文件元数据
- **相关文件**：智能推荐同类文件

## 🔧 配置说明

### 环境变量
```bash
# 后端配置
PORT=3000                    # 服务器端口
DB_HOST=localhost           # 数据库主机
DB_PORT=3306               # 数据库端口
DB_USER=root               # 数据库用户名
DB_PASSWORD=your_password  # 数据库密码
DB_NAME=album              # 数据库名称

# 前端配置
VITE_API_BASE_URL=http://localhost:3000  # API基础地址
```

### 上传限制
- 单文件最大大小：100MB
- 同时上传文件数：10个
- 支持的图片格式：JPEG, JPG, PNG, GIF, WebP
- 支持的视频格式：MP4, WebM, AVI, MOV, WMV

## 🚧 开发计划

### v2.0 计划功能
- [ ] 用户认证系统
- [ ] 文件夹管理
- [ ] 文件标签系统
- [ ] 图片在线编辑
- [ ] 视频缩略图生成
- [ ] 云存储支持
- [ ] API访问控制
- [ ] 文件版本管理

### v1.1 近期更新
- [x] 响应式设计优化
- [x] 批量操作功能
- [x] 搜索和筛选
- [x] 文件统计分析
- [x] 错误处理优化
- [x] 预览功能增强

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目地址：[GitHub Repository](https://github.com/your-username/album)
- 问题反馈：[Issues](https://github.com/your-username/album/issues)
- 功能建议：[Discussions](https://github.com/your-username/album/discussions)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐ Star！**

Made with ❤️ by [Your Name]

</div> 