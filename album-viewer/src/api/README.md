# API 服务模块

原本的 `albumService.js` 文件过大（918行），现已按功能模块拆分为以下几个文件：

## 文件结构

```
src/api/
├── config.js                    # API基础配置和通用工具
├── authService.js               # 认证服务模块
├── userService.js               # 用户相关API模块
├── socialService.js             # 社交动态模块
├── albumManagementService.js    # 相册管理模块
├── albumService.js              # 主入口文件（向后兼容）
└── README.md                    # 本说明文档
```

## 模块说明

### 1. config.js
- API基础配置常量
- 通用响应处理函数
- 通用错误处理函数

### 2. authService.js
- 用户注册、登录、登出
- 认证令牌管理
- 用户信息获取和更新
- 头像上传
- 月度统计数据

### 3. userService.js
- 用户详情获取
- 用户动态和收藏
- 关注/取消关注功能
- 关注列表和粉丝列表
- 用户统计数据

### 4. socialService.js
- 社交动态列表获取
- 动态创建和删除
- 点赞和收藏功能
- 评论管理
- 浏览量统计

### 5. albumManagementService.js
- 相册的创建、获取、更新、删除
- 相册详情获取
- 相册文件管理

### 6. albumService.js（主入口）
- 整合所有模块的功能
- 保持向后兼容性
- 提供统一的API接口

## 使用方式

### 直接使用主入口（推荐，保持兼容性）
```javascript
import albumService from '../api/albumService.js'

// 所有原有的API调用方式都保持不变
const result = await albumService.login(loginData)
const posts = await albumService.getSocialPosts()
const albums = await albumService.getAlbums()
```

### 使用具体模块（可选，更清晰的模块化）
```javascript
import authService from '../api/authService.js'
import socialService from '../api/socialService.js'
import albumManagementService from '../api/albumManagementService.js'

// 直接使用具体模块
const result = await authService.login(loginData)
const posts = await socialService.getSocialPosts()
const albums = await albumManagementService.getAlbums()
```

## 兼容性

- ✅ 所有现有的导入语句无需修改
- ✅ 所有现有的API调用方式保持不变
- ✅ 保持单例模式，状态共享正常
- ✅ 所有功能和接口完全兼容

## 优势

1. **代码组织更清晰**：按功能模块分类，便于维护
2. **减少单文件复杂度**：每个文件职责单一，更易理解
3. **提高开发效率**：可以并行开发不同模块
4. **便于测试**：可以单独测试各个模块
5. **向后兼容**：不影响现有代码的使用 