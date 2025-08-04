# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个智能文件管理系统，使用Vue 3 + TypeScript前端和Node.js + Express后端，支持图片和视频文件的上传、预览、管理和相册功能。

## 开发命令

### 前端 (frontend/)
- `npm run dev` - 启动开发服务器 (端口 5173)
- `npm run build` - 构建生产版本 (使用 vue-tsc 进行类型检查)
- `npm run preview` - 预览构建结果

### 后端 (backend/)
- `npm run dev` - 启动开发服务器 (端口 3000，使用 ts-node-dev)
- `npm run build` - 编译 TypeScript 代码到 dist/ 目录
- `npm start` - 运行生产版本 (从 dist/index.js)

### 完整开发环境启动
```bash
# 后端服务 (端口 3000)
cd backend && npm run dev

# 前端服务 (端口 5173)
cd frontend && npm run dev
```

## 项目架构

### 前端架构 (Vue 3 + TypeScript)
- **技术栈**: Vue 3 + TypeScript + Element Plus + Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **主要页面**:
  - `Home.vue` / `HomeView.vue` - 主页面，文件管理功能
  - `Preview.vue` / `PreviewView.vue` - 文件预览页面
  - `UploadView.vue` - 文件上传页面

### 后端架构 (Node.js + Express)
- **主要文件**:
  - `index.ts` - Express 服务器主入口，包含所有 API 路由
  - `db.ts` - 数据库操作层，使用 MySQL2 连接池
- **API 结构**:
  - 文件上传: `/api/upload` (多文件), `/api/upload-single` (单文件)
  - 文件管理: `/api/files` (列表/搜索), `/api/files/:id` (详情), `/api/download/:id`
  - 相册管理: `/api/albums` 相关接口
  - 统计信息: `/api/stats`

### 数据库设计
- **files 表**: 存储文件元数据信息，包含相册关联
- **albums 表**: 存储相册信息
- 支持默认相册概念 (album_id 为 NULL)

## 核心功能

### 文件管理
- 支持图片和视频文件上传 (最大 100MB，最多同时 10 个文件)
- 分页列表展示，支持搜索和按类型筛选
- 批量操作 (选择、删除、移动到相册)
- 文件预览和下载

### 相册系统
- 创建、编辑、删除相册
- 文件在相册间移动
- 默认相册处理未分类文件

### 安全特性
- 严格的文件类型检查 (fileFilter)
- 文件大小和数量限制
- 物理文件和数据库记录一致性检查

## 重要配置

### 数据库配置 (backend/src/db.ts)
- 默认连接 localhost MySQL，数据库名 'album'
- 需要修改 password 字段为实际数据库密码

### 文件存储
- 上传文件存储在 `backend/uploads/` 目录
- 通过 Express 静态文件服务提供访问

### 跨域配置
- 前端开发服务器: http://localhost:5173
- 后端 API 服务器: http://localhost:3000
- CORS 已配置支持这两个域名

## 开发注意事项

### 数据库初始化
- 应用启动时会自动创建数据库和表结构
- 会自动创建"默认相册"用于未分类文件

### 文件处理
- 使用 multer 处理文件上传
- 文件名使用时间戳+随机数确保唯一性
- 上传失败时会自动清理已上传的文件

### 错误处理
- 全局错误处理中间件处理各种异常情况
- 详细的错误代码和消息便于前端处理

### API 规范
- RESTful API 设计
- 统一的响应格式和错误处理
- 支持分页、搜索、排序等查询参数