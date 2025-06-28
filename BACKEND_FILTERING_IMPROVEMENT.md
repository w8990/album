# 后端筛选优化说明

## 问题描述

原先的实现存在以下问题：
1. **前端筛选**：所有文件数据都传输到前端，然后在前端进行筛选
2. **性能问题**：当文件数量很大时，会导致不必要的数据传输和前端计算负担
3. **筛选逻辑复杂**：前端需要处理复杂的相册筛选逻辑，容易出错
4. **用户体验差**：大量数据传输导致加载缓慢

## 解决方案

### 1. 后端数据库筛选

**修改后端数据库查询函数：**

#### `getFileList` 函数优化
```typescript
export async function getFileList(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  albumId?: number | 'default' | null; // 新增相册筛选参数
}) {
  // 处理相册筛选
  if (albumId === 'default') {
    // 默认相册：album_id 为 NULL
    whereClause = 'WHERE album_id IS NULL';
  } else if (albumId !== undefined && albumId !== null) {
    // 指定相册
    whereClause = 'WHERE album_id = ?';
    queryParams.push(albumId);
  }
  // 如果 albumId 为 null 或 undefined，则不添加筛选条件，显示所有文件
}
```

#### `searchFiles` 函数优化
```typescript
export async function searchFiles(options: {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  albumId?: number | 'default' | null; // 新增相册筛选参数
}) {
  // 相册筛选
  if (albumId === 'default') {
    whereConditions.push('album_id IS NULL');
  } else if (albumId !== undefined && albumId !== null) {
    whereConditions.push('album_id = ?');
    queryParams.push(albumId);
  }
}
```

### 2. API 接口优化

**修改文件列表 API：**

```typescript
app.get('/api/files', async (req, res) => {
  const albumIdParam = req.query.album_id as string;

  // 处理相册ID参数
  let albumId: number | 'default' | null | undefined = undefined;
  if (albumIdParam !== undefined) {
    if (albumIdParam === '' || albumIdParam === 'null') {
      albumId = null; // 显示所有文件
    } else if (albumIdParam === 'default') {
      albumId = 'default'; // 默认相册（album_id 为 NULL）
    } else {
      const parsedAlbumId = parseInt(albumIdParam);
      if (!isNaN(parsedAlbumId)) {
        albumId = parsedAlbumId; // 指定相册ID
      }
    }
  }
});
```

### 3. 前端重构

**移除前端筛选逻辑：**
- 删除 `filteredFiles` 计算属性
- 直接使用 `files` 数组显示数据
- 将筛选逻辑移到 API 调用中

**新增响应式数据加载：**
```typescript
const loadFiles = async (params?: {
  albumId?: number | 'default' | null;
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  // 添加查询参数
  if (params?.albumId !== undefined) {
    if (params.albumId === 'default') {
      queryParams.append('album_id', 'default');
    } else if (params.albumId === null) {
      queryParams.append('album_id', '');
    } else {
      queryParams.append('album_id', params.albumId.toString());
    }
  }
  
  // 其他参数...
}
```

**事件处理函数优化：**
```typescript
// 相册选择
const selectAlbum = async (album: any) => {
  // 根据选择的相册加载文件
  if (selectedAlbum.value) {
    const albumId = selectedAlbum.value.name === '默认相册' ? 'default' : selectedAlbum.value.id;
    await loadFiles({ albumId });
  } else {
    await loadFiles(); // 显示所有文件
  }
}

// 搜索处理
const handleSearch = async () => {
  await loadFiles({
    search: searchQuery.value || undefined,
    type: filterType.value || undefined,
    albumId: getSelectedAlbumId()
  });
}
```

## 优化效果

### 1. 性能提升
- **减少数据传输**：只传输符合条件的文件数据
- **降低前端负担**：移除复杂的前端筛选计算
- **提高响应速度**：数据库查询比前端筛选更高效

### 2. 架构改进
- **职责分离**：后端负责数据筛选，前端负责展示
- **扩展性更好**：后端筛选支持更复杂的查询条件
- **维护性提升**：筛选逻辑集中在后端，便于维护

### 3. 用户体验优化
- **加载速度更快**：减少不必要的数据传输
- **响应更及时**：实时筛选结果
- **内存占用更少**：前端只保存当前显示的数据

### 4. 默认相册处理
- **特殊处理**：默认相册对应 `album_id IS NULL` 的查询
- **兼容性好**：支持现有数据中 `album_id` 为 `null` 的文件
- **逻辑清晰**：明确区分默认相册和其他相册的筛选逻辑

## API 使用示例

```bash
# 获取所有文件
GET /api/files

# 获取默认相册的文件
GET /api/files?album_id=default

# 获取指定相册的文件
GET /api/files?album_id=123

# 组合筛选：搜索 + 类型 + 相册
GET /api/files?search=photo&type=image&album_id=123
```

## 总结

通过将筛选逻辑从前端移动到后端，我们实现了：
1. **更好的性能**：减少数据传输和前端计算
2. **更清晰的架构**：前后端职责分离
3. **更好的用户体验**：更快的响应速度
4. **更强的扩展性**：支持更复杂的查询需求

这种设计模式更符合现代 Web 应用的最佳实践，也为后续功能扩展（如分页、排序、高级筛选等）奠定了良好的基础。 