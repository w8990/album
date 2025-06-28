# 默认相册文件计数修复

## 问题描述

默认相册的右上角文件数量一直显示为 0，即使其中有文件。

## 问题原因

### 1. 数据结构分析
- 默认相册中的文件：`album_id` 字段为 `NULL`
- 其他相册中的文件：`album_id` 字段为对应的相册ID

### 2. 原始查询问题
原来的 `getAlbums` 函数使用了错误的 JOIN 查询：

```sql
SELECT 
  a.*,
  COUNT(f.id) as file_count,
  COALESCE(SUM(f.size), 0) as total_size,
  (SELECT url FROM files WHERE album_id = a.id AND mimetype LIKE 'image/%' ORDER BY created_at DESC LIMIT 1) as cover_url
FROM albums a
LEFT JOIN files f ON a.id = f.album_id  -- 问题在这里
GROUP BY a.id
```

**问题分析：**
- `LEFT JOIN files f ON a.id = f.album_id` 只会匹配 `album_id = a.id` 的文件
- 对于默认相册，文件的 `album_id` 是 `NULL`，不等于默认相册的 `id`
- 因此默认相册的 `file_count` 始终为 0

## 解决方案

### 1. 修复 `getAlbums` 函数

使用 `CASE` 语句根据相册名称采用不同的统计逻辑：

```sql
SELECT 
  a.*,
  CASE 
    WHEN a.name = '默认相册' THEN (SELECT COUNT(*) FROM files WHERE album_id IS NULL)
    ELSE (SELECT COUNT(*) FROM files WHERE album_id = a.id)
  END as file_count,
  CASE 
    WHEN a.name = '默认相册' THEN COALESCE((SELECT SUM(size) FROM files WHERE album_id IS NULL), 0)
    ELSE COALESCE((SELECT SUM(size) FROM files WHERE album_id = a.id), 0)
  END as total_size,
  CASE 
    WHEN a.name = '默认相册' THEN (SELECT url FROM files WHERE album_id IS NULL AND mimetype LIKE 'image/%' ORDER BY created_at DESC LIMIT 1)
    ELSE (SELECT url FROM files WHERE album_id = a.id AND mimetype LIKE 'image/%' ORDER BY created_at DESC LIMIT 1)
  END as cover_url
FROM albums a
ORDER BY a.created_at DESC
```

### 2. 修复 `getAlbumInfo` 函数

同样使用 `CASE` 语句处理默认相册：

```sql
SELECT 
  a.*,
  CASE 
    WHEN a.name = '默认相册' THEN (SELECT COUNT(*) FROM files WHERE album_id IS NULL)
    ELSE (SELECT COUNT(*) FROM files WHERE album_id = a.id)
  END as file_count,
  CASE 
    WHEN a.name = '默认相册' THEN COALESCE((SELECT SUM(size) FROM files WHERE album_id IS NULL), 0)
    ELSE COALESCE((SELECT SUM(size) FROM files WHERE album_id = a.id), 0)
  END as total_size
FROM albums a
WHERE a.id = ?
```

### 3. 修复 `getAlbumFiles` 函数

支持 `'default'` 参数来查询默认相册的文件：

```typescript
export async function getAlbumFiles(albumId: number | 'default', options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  let whereClause: string;
  let queryParams: any[];

  if (albumId === 'default') {
    // 默认相册：查询 album_id 为 NULL 的文件
    whereClause = 'WHERE album_id IS NULL';
    queryParams = [];
  } else {
    // 指定相册：查询 album_id 等于指定ID的文件
    whereClause = 'WHERE album_id = ?';
    queryParams = [albumId];
  }
  
  // ... 其余查询逻辑
}
```

### 4. 修复 API 接口

更新 `/api/albums/:id/files` 接口支持 `default` 参数：

```typescript
app.get('/api/albums/:id/files', async (req, res) => {
  const idParam = req.params.id;
  let albumId: number | 'default';
  
  if (idParam === 'default') {
    albumId = 'default';
  } else {
    const parsedId = parseInt(idParam);
    if (isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({ 
        error: '无效的相册ID',
        code: 'INVALID_ID'
      });
    }
    albumId = parsedId;
  }
  
  // ... 其余逻辑
});
```

## 修复效果

### 1. 正确的文件计数
- 默认相册现在能正确显示其中文件的数量
- 其他相册的计数不受影响

### 2. 正确的存储空间统计
- 默认相册能正确计算总文件大小
- 封面图片也能正确显示

### 3. API 一致性
- 所有相册相关的 API 都能正确处理默认相册
- 支持通过 `default` 参数访问默认相册

## 测试验证

### 1. 验证文件计数
```bash
# 获取所有相册（包含文件计数）
GET /api/albums

# 检查默认相册的 file_count 字段是否正确
```

### 2. 验证文件查询
```bash
# 获取默认相册的文件
GET /api/albums/default/files

# 应该返回所有 album_id 为 NULL 的文件
```

### 3. 验证统计信息
```bash
# 获取默认相册详细信息
GET /api/albums/{defaultAlbumId}

# 检查 file_count 和 total_size 是否正确
```

## 数据库查询优化

### 优化前（有问题）
```sql
-- 使用 JOIN，无法正确处理 NULL 值
LEFT JOIN files f ON a.id = f.album_id
```

### 优化后（正确）
```sql
-- 使用子查询，根据相册类型采用不同的查询条件
CASE 
  WHEN a.name = '默认相册' THEN (SELECT COUNT(*) FROM files WHERE album_id IS NULL)
  ELSE (SELECT COUNT(*) FROM files WHERE album_id = a.id)
END
```

## 总结

通过修复数据库查询逻辑，解决了默认相册文件计数显示为 0 的问题。关键在于：

1. **理解数据结构**：默认相册的文件 `album_id` 为 `NULL`
2. **修复查询逻辑**：使用 `CASE` 语句区分处理
3. **保持 API 一致性**：所有相关接口都支持默认相册
4. **向后兼容**：不影响现有数据和其他相册功能

这个修复确保了系统的数据完整性和用户界面的准确性。 