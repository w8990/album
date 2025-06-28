# 📡 后端集成说明

## 🔄 当前配置状态

✅ **已连接真实后端** - 应用现在从您的 `photo-gallery-server` 获取数据

## 🖥️ 服务状态

### 后端服务 (photo-gallery-server)
- **端口**: `3000`
- **状态**: 🟢 运行中
- **API地址**: `http://localhost:3000`

### 前端服务 (album-viewer)
- **端口**: `5173` 
- **状态**: 🟢 运行中
- **访问地址**: `http://localhost:5173`

## 🔗 API集成详情

### ✅ 已集成的功能
1. **📷 获取照片列表** - 从 `/photos` API获取数据
2. **📤 上传照片** - 通过 `/photos/upload` 发布新动态
3. **🖼️ 显示图片** - 使用 `/photos/image/:id` 显示图片

### 🔄 混合模式功能（前端模拟 + 后端数据）
由于您的后端是基础的照片管理API，以下社交功能使用前端模拟：
- ❤️ **点赞功能** - 模拟数据，本地状态管理
- ⭐ **收藏功能** - 模拟数据，本地状态管理  
- 💬 **评论系统** - 模拟数据，本地存储
- 👤 **用户认证** - 简单的前端模拟登录
- 📊 **互动统计** - 随机生成的点赞/评论数

## 📊 数据流说明

### 真实后端数据
```
photo-gallery-server (MySQL数据库)
         ↓
    /photos API
         ↓
   转换为社交动态格式
         ↓
    前端展示层
```

### 数据转换逻辑
```javascript
后端photos数据 → 社交动态格式
{
  id: photo.id,
  author: "摄影师",                    // 默认作者名
  content: photo.title,               // 照片标题作为内容
  images: [photo.url],               // 照片URL
  likes: Math.random() * 100,        // 随机点赞数
  comments: Math.random() * 20,      // 随机评论数
  createdAt: photo.date             // 创建时间
}
```

## 🚀 使用体验

### 1. 浏览真实数据
- 访问 `http://localhost:5173`
- 查看从数据库获取的真实照片
- 每张照片都是实际存储在服务器上的文件

### 2. 上传新照片  
- 点击"分享新相册"
- 上传图片文件（支持 jpg, png, gif等格式）
- 照片会保存到后端数据库并立即显示

### 3. 社交互动
- 点赞、评论、收藏等功能正常工作
- 数据在前端本地管理，刷新后重置

## ⚙️ 技术配置

### API配置更改
```javascript
// 修改前
const API_BASE_URL = 'http://localhost:3000/api'
const MOCK_MODE = true

// 修改后  
const API_BASE_URL = 'http://localhost:3000'
const MOCK_MODE = false
```

### 主要适配接口
1. **GET /photos** → `getSocialPosts()`
2. **POST /photos/upload** → `createPost()`
3. **GET /photos/image/:id** → 图片显示

## 🔮 扩展建议

如果您希望完整的社交媒体功能，建议扩展后端API：

### 建议添加的API端点
```
POST /posts/:id/like      - 点赞功能
POST /posts/:id/favorite  - 收藏功能  
GET  /posts/:id/comments  - 获取评论
POST /posts/:id/comments  - 添加评论
POST /auth/login          - 用户登录
GET  /users/:id/profile   - 用户资料
```

### 数据库表扩展建议
```sql
-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50),
  avatar_url VARCHAR(255)
);

-- 点赞表  
CREATE TABLE likes (
  user_id INT,
  photo_id INT,
  created_at TIMESTAMP
);

-- 评论表
CREATE TABLE comments (
  id INT PRIMARY KEY,
  user_id INT,
  photo_id INT,
  content TEXT,
  created_at TIMESTAMP
);
```

## 🎯 当前优势

✅ **真实数据存储** - 照片实际保存在服务器
✅ **完整上传功能** - 支持图片上传和数据库存储  
✅ **分页加载** - 支持大量数据的分页显示
✅ **流畅体验** - 社交功能通过前端模拟保证体验
✅ **易于扩展** - 架构支持后续功能扩展

## 🔧 故障排除

### 如果遇到连接问题
1. 确认后端服务运行在 `http://localhost:3000`
2. 检查数据库连接状态
3. 查看浏览器控制台错误信息

### 如果上传失败
1. 检查图片格式（支持 jpg, png, gif, webp等）
2. 确认图片大小不超过20MB
3. 检查服务器存储路径权限

---

🎉 **现在您的应用已经成功连接到真实后端，享受真实数据驱动的社交相册体验！** 