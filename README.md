# 文件上传预览系统

一个基于 Vue 3 + Express + MySQL 的文件上传和预览系统，支持图片和视频文件的管理。

## 功能特点

- 支持图片和视频文件上传
- 文件在线预览
- 批量上传和删除
- 文件列表管理
- 响应式设计

## 技术栈

### 前端
- Vue 3
- TypeScript
- Element Plus
- Vite

### 后端
- Express
- TypeScript
- MySQL
- Multer

## 项目结构

```
album/
├── frontend/          # 前端项目
│   ├── src/          # 源代码
│   ├── public/       # 静态资源
│   └── package.json  # 前端依赖配置
│
├── backend/          # 后端项目
│   ├── src/         # 源代码
│   ├── uploads/     # 上传文件存储目录
│   └── package.json # 后端依赖配置
│
└── README.md        # 项目说明
```

## 快速开始

### 环境要求

- Node.js >= 14
- MySQL >= 5.7

### 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd album
```

2. 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. 配置数据库
- 创建 MySQL 数据库
- 修改 `backend/src/db.ts` 中的数据库配置

4. 启动项目
```bash
# 启动后端服务
cd backend
npm start

# 启动前端服务
cd frontend
npm run dev
```

5. 访问应用
- 前端: http://localhost:5173
- 后端: http://localhost:3000

## 使用说明

1. 文件上传
   - 点击"快速上传"按钮
   - 支持拖拽上传或点击选择文件
   - 支持批量上传

2. 文件管理
   - 查看已上传文件列表
   - 预览文件
   - 删除文件
   - 批量删除

## 注意事项

- 默认文件大小限制为 100MB
- 仅支持图片和视频文件格式
- 请确保上传目录具有写入权限

## 许可证

MIT 