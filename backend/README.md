# 相册管理系统后端 - 模块化重构

## 项目结构

```
backend/src/
├── db/                    # 数据库操作模块
│   ├── connection.ts      # 数据库连接配置
│   ├── init.ts           # 数据库初始化
│   ├── users.ts          # 用户相关操作
│   ├── files.ts          # 文件相关操作
│   ├── albums.ts         # 相册相关操作
│   ├── social.ts         # 社交功能操作
│   ├── sessions.ts       # 会话管理操作
│   └── index.ts          # 统一导出
├── routes/               # 路由模块
│   ├── auth.ts          # 认证路由
│   ├── files.ts         # 文件路由（待创建）
│   ├── albums.ts        # 相册路由（待创建）
│   ├── social.ts        # 社交功能路由（待创建）
│   └── users.ts         # 用户路由（待创建）
├── middleware/          # 中间件
│   ├── auth.ts         # 认证中间件
│   └── upload.ts       # 文件上传中间件
├── utils/              # 工具函数
│   └── session.ts      # 会话工具
├── types/              # 类型定义
│   └── index.ts        # TypeScript类型定义
├── server.ts           # 主应用入口
└── app.ts              # 原有的简单应用（保留）
```

## 模块说明

### 数据库模块 (`db/`)

#### `connection.ts`
- 数据库连接池配置
- 导出数据库连接实例

#### `init.ts`
- 数据库初始化
- 创建所有数据表
- 创建默认用户和相册

#### `users.ts`
- 用户CRUD操作
- 用户关注功能
- 用户统计信息

#### `files.ts`
- 文件CRUD操作
- 文件搜索和筛选
- 文件统计信息

#### `albums.ts`
- 相册CRUD操作
- 相册文件管理

#### `social.ts`
- 点赞、收藏、评论功能
- 社交统计信息
- 带社交信息的文件列表

#### `sessions.ts`
- 用户会话管理
- 会话验证和清理

### 路由模块 (`routes/`)

#### `auth.ts`
- 用户注册、登录、登出
- 用户信息获取和更新
- 完整的身份验证流程

### 中间件 (`middleware/`)

#### `auth.ts`
- 身份验证中间件
- 可选身份验证中间件

#### `upload.ts`
- 文件上传配置
- 文件类型验证
- 上传目录管理

### 工具函数 (`utils/`)

#### `session.ts`
- 会话令牌生成

### 类型定义 (`types/`)

#### `index.ts`
- TypeScript接口定义
- Express Request扩展

## 重构优势

1. **模块化**: 将大文件拆分为小模块，提高可维护性
2. **职责分离**: 每个模块负责特定功能
3. **代码复用**: 通过统一导出便于其他模块使用
4. **类型安全**: 完整的TypeScript类型定义
5. **易于扩展**: 新功能可以轻松添加新模块

## 下一步工作

需要继续创建以下路由模块：
- `routes/files.ts` - 文件管理路由
- `routes/albums.ts` - 相册管理路由
- `routes/social.ts` - 社交功能路由
- `routes/users.ts` - 用户管理路由

然后在 `server.ts` 中挂载这些路由。

## 使用方法

1. 启动服务器：
```bash
npm run dev
```

2. 访问健康检查：
```
GET http://localhost:3000/api/health
```

3. 用户注册：
```
POST http://localhost:3000/api/auth/register
```

4. 用户登录：
```
POST http://localhost:3000/api/auth/login
``` 