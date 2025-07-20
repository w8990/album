# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

这是一个现代化的相册分享系统（"智能文件管理系统"），采用 Vue.js 前端和 Node.js/Express 后端构建。系统支持用户认证、文件上传、相册管理以及点赞、评论、关注等社交功能。

## 架构设计

### 项目结构
```
album/
├── frontend/           # 主要的 Vue 3 + TypeScript 前端
├── backend/            # Node.js + Express + TypeScript 后端  
└── album-viewer/       # 备用的 Vue 3 前端（简化版本）
```

### 后端架构
- **框架**: Express.js + TypeScript
- **数据库**: MySQL 连接池
- **认证**: JWT 令牌 + bcryptjs 密码加密
- **文件存储**: 本地文件系统 + Multer 中间件
- **会话管理**: 数据库会话存储，自动清理过期会话

核心后端模块:
- `src/server.ts` - 服务器主入口
- `src/db/` - 数据库操作和架构管理
- `src/routes/` - API 路由处理器（认证、文件、相册、社交）
- `src/middleware/` - 认证和上传中间件

### 前端架构
- **框架**: Vue 3 Composition API + TypeScript
- **UI 库**: Element Plus
- **状态管理**: Pinia 状态库
- **路由**: Vue Router + 认证守卫
- **HTTP 客户端**: Axios + 请求/响应拦截器

核心前端模块:
- `src/stores/user.ts` - 用户认证状态管理
- `src/router/index.ts` - 路由定义 + 认证守卫
- `src/api/auth.ts` - 认证 API 调用
- `src/views/` - 页面组件

## 开发命令

### 后端开发
```bash
cd backend
npm install
npm run dev          # 启动开发服务器（热重载）
npm run build        # 编译 TypeScript 到 JavaScript
npm start           # 启动生产服务器
```

### 前端开发
```bash
cd frontend
npm install
npm run dev          # 启动开发服务器（端口 5173）
npm run build        # 生产环境构建
npm run preview      # 预览生产构建
```

### 相册查看器（备用前端）
```bash
cd album-viewer
npm install
npm run dev          # 启动开发服务器
npm run build        # 生产环境构建
```

## 数据库设置

系统使用 MySQL，启动时自动初始化数据库架构。主要表结构：
- `users` - 用户账户和认证信息
- `files` - 上传文件和元数据
- `albums` - 相册和隐私设置
- `likes`, `favorites`, `comments` - 社交功能
- `follows` - 用户关注关系
- `user_sessions` - JWT 会话管理

数据库初始化在 `backend/src/db/init.ts` 中进行，包括：
- 自动创建表结构
- 创建默认管理员/访客用户
- 创建默认相册
- 支持架构迁移

## 认证系统

系统采用基于 JWT 的认证机制：
- 登录/注册接口
- 基于令牌的会话管理
- 受保护页面的路由守卫
- 自动令牌刷新
- "记住我"功能（localStorage/sessionStorage）

认证流程：
1. 用户登录/注册 → 签发 JWT 令牌
2. 令牌存储在 localStorage（记住）或 sessionStorage
3. 前端自动在 API 请求中包含令牌
4. 后端在受保护路由上验证令牌

## 文件上传系统

文件上传通过以下方式处理：
- Multer 中间件处理 multipart/form-data
- 本地文件系统存储在 `backend/uploads/`
- 数据库元数据存储
- 支持图片和视频
- 文件大小限制（单文件最大 100MB，最多 10 个文件）

## 关键开发模式

### 错误处理
- 后端：全局错误中间件，特定错误代码
- 前端：try-catch 块，用户友好的错误消息
- 数据库：适当的外键约束和数据验证

### 状态管理
- 复杂状态使用 Pinia 状态库（用户认证等）
- 简单组件状态使用响应式 refs
- 在 localStorage/sessionStorage 中持久化认证状态

### API 通信
- RESTful API 设计，响应格式一致
- Axios 拦截器处理请求/响应
- 为本地开发配置 CORS

### 代码组织
- TypeScript 接口放在 `types/` 目录
- 模块化路由处理器放在 `routes/` 目录
- 可复用组件放在 `components/` 目录
- 工具函数放在 `utils/` 目录

## 开发注意事项

- 后端支持多个前端端口的 CORS（5173、5174、3000）
- 会话清理每小时自动运行一次
- 文件上传存储在 `backend/uploads/` 目录
- 系统包含两个前端实现（主要版本和 album-viewer）
- 数据库架构包含完整的索引以提升性能
- 认证令牌可以存储在 localStorage 或 sessionStorage
- 系统包含防止登录暴力破解攻击的保护

## 用户隔离与权限控制

系统实现了严格的用户隔离机制：

### 数据隔离
- 每个用户只能看到自己上传的文件和创建的相册
- 文件列表API (`/api/files`) 需要认证头，按user_id过滤
- 相册API (`/api/albums`) 需要认证，只返回当前用户的相册
- 未登录用户只能看到默认用户(ID=1)的公开内容

### 认证要求
- 文件上传必须登录 (`authenticateToken` 中间件)
- 相册管理需要认证
- 社交功能(点赞、评论)需要认证
- 文件搜索和列表查询需要携带JWT令牌

### 默认相册机制
- 每个用户需要有"默认相册"来正确统计 `album_id = null` 的文件
- 新用户注册时应自动创建默认相册
- 上传到默认相册的文件 `album_id` 为 `null`

## 文件上传注意事项

### 请求头配置
- 上传文件时不要设置 `Content-Type`，让浏览器自动设置 `multipart/form-data`
- 只需要添加 `Authorization: Bearer <token>` 认证头
- 避免使用 `getAuthHeaders()` 函数，因为它会设置错误的 `Content-Type`

### URL构建
- 后端返回的文件URL已经是完整的URL (包含 `http://localhost:3000`)
- 前端显示时直接使用 `file.url`，不要拼接 `API_BASE_URL`

## 数据库架构关键点

### 文件表 (files)
```sql
- user_id: 文件所有者，支持用户隔离
- album_id: 相册ID，NULL表示默认相册
- views: 浏览次数统计
- privacy_level: 当前表中不存在，使用user_id进行权限控制
```

### 相册统计查询
- 默认相册统计查询 `album_id IS NULL AND user_id = ?`
- 普通相册统计查询 `album_id = ? AND user_id = ?`
- 总大小字段返回字符串，前端需要 `parseInt()` 转换

## 测试和验证

进行更改时：
1. 运行 TypeScript 编译：`npm run build`（后端）
2. 检查数据库连接和迁移
3. 验证跨域请求的 CORS 设置
4. 测试认证流程（登录/登出/令牌刷新）
5. 验证文件上传功能和限制
6. 测试用户隔离：不同用户登录后只能看到自己的内容
7. 验证相册统计数据正确显示文件数量和大小

## 常见问题解决

### 相册显示"0个文件"
- 检查用户是否有"默认相册"
- 确认文件的 `user_id` 与当前登录用户匹配
- 验证相册统计查询是否正确

### 文件上传失败
- 检查是否携带有效的JWT认证头
- 确认Content-Type没有被错误设置
- 验证文件类型和大小限制

### 图片不显示
- 确认前端没有重复拼接API_BASE_URL
- 检查后端静态文件服务配置
- 验证文件路径和权限