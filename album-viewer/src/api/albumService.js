// 相册API服务
import { ElMessage } from 'element-plus'

// API配置
const API_BASE_URL = 'http://localhost:3000/api' // 修正API基础路径，添加/api前缀
const MOCK_MODE = false // 是否使用模拟数据 - 修改为false使用真实后端

// 模拟社交动态数据
const mockSocialPosts = [
  {
    id: 1,
    authorId: 1,
    author: '摄影师小李',
    avatar: '',
    content: '今天去拍了一组美丽的风景照，大自然的鬼斧神工真的令人叹为观止！记录生活中的美好瞬间，每一张照片都承载着当时的心情和感动。🌅🏔️',
    images: [
      { id: 1, url: 'https://picsum.photos/800/600?random=1', title: '山川美景', description: '连绵不断的山峦' },
      { id: 2, url: 'https://picsum.photos/800/600?random=2', title: '湖光山色', description: '宁静的湖水倒映着蓝天' },
      { id: 3, url: 'https://picsum.photos/800/600?random=3', title: '日出时分', description: '东方既白，朝阳初升' }
    ],
    tags: ['风景', '摄影', '自然'],
    location: '黄山风景区',
    createdAt: new Date('2024-01-15T08:30:00'),
    likes: 128,
    comments: 23,
    shares: 15,
    views: 567,
    isLiked: false,
    isFavorited: false,
    latestComments: [
      { id: 1, author: '用户A', content: '拍得真好！构图很棒', createdAt: new Date('2024-01-15T10:00:00') },
      { id: 2, author: '用户B', content: '好想去这里旅游', createdAt: new Date('2024-01-15T11:30:00') }
    ]
  },
  {
    id: 2,
    authorId: 2,
    author: '城市探索者',
    avatar: '',
    content: '夜晚的都市总是有着独特的魅力，霓虹灯闪烁，车水马龙，这就是现代都市的节奏。🌃✨',
    images: [
      { id: 4, url: 'https://picsum.photos/800/600?random=4', title: '城市夜景', description: '繁华的都市夜景' },
      { id: 5, url: 'https://picsum.photos/800/600?random=5', title: '街道车流', description: '川流不息的车辆' }
    ],
    tags: ['城市', '夜景', '都市', '生活'],
    location: '上海外滩',
    createdAt: new Date('2024-01-12T20:15:00'),
    likes: 89,
    comments: 16,
    shares: 8,
    views: 234,
    isLiked: true,
    isFavorited: false,
    latestComments: [
      { id: 3, author: '夜拍爱好者', content: '城市夜景拍得很震撼！', createdAt: new Date('2024-01-12T21:00:00') }
    ]
  },
  {
    id: 3,
    authorId: 3,
    author: '旅行达人',
    avatar: '',
    content: '旅途中的点点滴滴，每一张照片都承载着美好的回忆。走过的路，看过的风景，遇见的人，都成为了人生中珍贵的财富。💫🎒',
    images: [
      { id: 6, url: 'https://picsum.photos/800/600?random=6', title: '古镇小巷', description: '古色古香的小巷' },
      { id: 7, url: 'https://picsum.photos/800/600?random=7', title: '海边日落', description: '美丽的海边日落' },
      { id: 8, url: 'https://picsum.photos/800/600?random=8', title: '当地美食', description: '地道的特色小吃' },
      { id: 9, url: 'https://picsum.photos/800/600?random=9', title: '民俗表演', description: '精彩的传统表演' }
    ],
    tags: ['旅行', '回忆', '生活', '美食'],
    location: '丽江古城',
    createdAt: new Date('2024-01-10T15:45:00'),
    likes: 156,
    comments: 41,
    shares: 32,
    views: 892,
    isLiked: false,
    isFavorited: true,
    latestComments: [
      { id: 4, author: '旅行小白', content: '好羡慕能去这么多地方旅行', createdAt: new Date('2024-01-10T16:20:00') },
      { id: 5, author: '美食爱好者', content: '那个小吃看起来很香', createdAt: new Date('2024-01-10T17:00:00') }
    ]
  },
  {
    id: 4,
    authorId: 4,
    author: '花卉爱好者',
    avatar: '',
    content: '春暖花开的季节终于到了！各种花朵竞相绽放，给世界带来了无限的色彩和生机。🌸🌺🌻',
    images: [
      { id: 10, url: 'https://picsum.photos/800/600?random=10', title: '樱花盛开', description: '粉色的樱花' }
    ],
    tags: ['花朵', '春天', '自然', '美好'],
    location: '植物园',
    createdAt: new Date('2024-01-08T09:20:00'),
    likes: 67,
    comments: 12,
    shares: 5,
    views: 345,
    isLiked: false,
    isFavorited: false,
    latestComments: [
      { id: 6, author: '园艺师', content: '樱花拍得很美！', createdAt: new Date('2024-01-08T10:00:00') }
    ]
  },
  {
    id: 5,
    authorId: 5,
    author: '美食博主',
    avatar: '',
    content: '今天尝试了一家新开的餐厅，环境很棒，菜品也很精致！每一道菜都像艺术品一样，色香味俱全。👨‍🍳🍽️',
    images: [
      { id: 11, url: 'https://picsum.photos/800/600?random=11', title: '精致摆盘', description: '艺术般的菜品' },
      { id: 12, url: 'https://picsum.photos/800/600?random=12', title: '餐厅环境', description: '优雅的用餐环境' }
    ],
    tags: ['美食', '餐厅', '生活', '品味'],
    location: '米其林餐厅',
    createdAt: new Date('2024-01-05T19:30:00'),
    likes: 92,
    comments: 28,
    shares: 12,
    views: 456,
    isLiked: false,
    isFavorited: false,
    latestComments: [
      { id: 7, author: '吃货小王', content: '看起来就很好吃的样子！', createdAt: new Date('2024-01-05T20:00:00') },
      { id: 8, author: '料理爱好者', content: '请问这家餐厅叫什么名字？', createdAt: new Date('2024-01-05T20:30:00') }
    ]
  }
]

// 模拟评论数据
const mockPostComments = {
  1: [
    {
      id: 1,
      postId: 1,
      author: '用户A',
      authorId: 101,
      content: '很棒的相册，拍得真好！构图和色彩都很棒，特别是第一张照片的光线处理很专业。',
      createdAt: new Date('2024-01-16T10:00:00'),
      likes: 5,
      isLiked: false
    },
    {
      id: 2,
      postId: 1,
      author: '用户B',
      authorId: 102,
      content: '构图很有感觉，学习了。请问用的什么相机拍的？',
      createdAt: new Date('2024-01-15T14:30:00'),
      likes: 3,
      isLiked: true
    },
    {
      id: 3,
      postId: 1,
      author: '摄影新手',
      authorId: 103,
      content: '太美了！我也想学摄影，有什么建议吗？',
      createdAt: new Date('2024-01-15T16:20:00'),
      likes: 2,
      isLiked: false
    }
  ],
  2: [
    {
      id: 4,
      postId: 2,
      author: '夜拍爱好者',
      authorId: 104,
      content: '城市夜景拍得很震撼，请问用的什么设备？三脚架是必须的吗？',
      createdAt: new Date('2024-01-12T21:00:00'),
      likes: 2,
      isLiked: false
    },
    {
      id: 5,
      postId: 2,
      author: '都市青年',
      authorId: 105,
      content: '每次看到这样的夜景都觉得城市很有魅力',
      createdAt: new Date('2024-01-12T22:15:00'),
      likes: 1,
      isLiked: false
    }
  ],
  3: [
    {
      id: 6,
      postId: 3,
      author: '旅行小白',
      authorId: 106,
      content: '好羡慕能去这么多地方旅行，每张照片都很有故事。请问有什么旅行攻略可以分享吗？',
      createdAt: new Date('2024-01-10T16:20:00'),
      likes: 8,
      isLiked: false
    },
    {
      id: 7,
      postId: 3,
      author: '美食爱好者',
      authorId: 107,
      content: '那个特色小吃看起来很香，是什么呀？',
      createdAt: new Date('2024-01-10T17:00:00'),
      likes: 3,
      isLiked: true
    }
  ]
}

// 模拟数据
const mockAlbums = [
  {
    id: 1,
    title: '美丽的风景',
    description: '记录生活中的美好瞬间，自然风光让人心旷神怡。在这个快节奏的时代，我们需要停下脚步，欣赏大自然的美丽。',
    coverImage: 'https://picsum.photos/300/400?random=1',
    author: '摄影师小李',
    authorId: 1,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    imageCount: 15,
    likes: 128,
    favorites: 45,
    comments: 23,
    views: 567,
    tags: ['风景', '自然', '摄影'],
    isLiked: false,
    isFavorited: false,
    isPublic: true,
    images: [
      { 
        id: 1,
        url: 'https://picsum.photos/800/600?random=1', 
        title: '山川美景',
        description: '连绵不断的山峦',
        takenAt: new Date('2024-01-10')
      },
      { 
        id: 2,
        url: 'https://picsum.photos/800/600?random=2', 
        title: '湖光山色',
        description: '宁静的湖水倒映着蓝天',
        takenAt: new Date('2024-01-11')
      },
      { 
        id: 3,
        url: 'https://picsum.photos/800/600?random=3', 
        title: '日出时分',
        description: '东方既白，朝阳初升',
        takenAt: new Date('2024-01-12')
      }
    ]
  },
  {
    id: 2,
    title: '城市夜景',
    description: '华灯初上的城市，展现现代都市的繁华与美丽。霓虹灯闪烁，车水马龙，这就是现代都市的魅力所在。',
    coverImage: 'https://picsum.photos/300/500?random=4',
    author: '城市探索者',
    authorId: 2,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    imageCount: 20,
    likes: 89,
    favorites: 32,
    comments: 16,
    views: 234,
    tags: ['城市', '夜景', '都市'],
    isLiked: true,
    isFavorited: false,
    isPublic: true,
    images: [
      { 
        id: 4,
        url: 'https://picsum.photos/800/600?random=4', 
        title: '城市夜景',
        description: '繁华的都市夜景',
        takenAt: new Date('2024-01-08')
      },
      { 
        id: 5,
        url: 'https://picsum.photos/800/600?random=5', 
        title: '街道车流',
        description: '川流不息的车辆',
        takenAt: new Date('2024-01-09')
      }
    ]
  },
  {
    id: 3,
    title: '旅行记忆',
    description: '旅途中的点点滴滴，每一张照片都承载着美好的回忆。走过的路，看过的风景，遇见的人，都成为了珍贵的回忆。',
    coverImage: 'https://picsum.photos/300/350?random=6',
    author: '旅行达人',
    authorId: 3,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    imageCount: 32,
    likes: 156,
    favorites: 78,
    comments: 41,
    views: 892,
    tags: ['旅行', '回忆', '生活'],
    isLiked: false,
    isFavorited: true,
    isPublic: true,
    images: [
      { 
        id: 6,
        url: 'https://picsum.photos/800/600?random=6', 
        title: '古镇小巷',
        description: '古色古香的小巷',
        takenAt: new Date('2024-01-03')
      },
      { 
        id: 7,
        url: 'https://picsum.photos/800/600?random=7', 
        title: '海边日落',
        description: '美丽的海边日落',
        takenAt: new Date('2024-01-04')
      }
    ]
  },
  {
    id: 4,
    title: '春天的花朵',
    description: '春暖花开的季节，各种花朵竞相绽放，给世界带来了无限的色彩和生机。',
    coverImage: 'https://picsum.photos/300/450?random=8',
    author: '花卉爱好者',
    authorId: 4,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    imageCount: 18,
    likes: 67,
    favorites: 23,
    comments: 12,
    views: 345,
    tags: ['花朵', '春天', '自然'],
    isLiked: false,
    isFavorited: false,
    isPublic: true,
    images: [
      { 
        id: 8,
        url: 'https://picsum.photos/800/600?random=8', 
        title: '樱花盛开',
        description: '粉色的樱花',
        takenAt: new Date('2024-01-18')
      },
      { 
        id: 9,
        url: 'https://picsum.photos/800/600?random=9', 
        title: '郁金香',
        description: '色彩斑斓的郁金香',
        takenAt: new Date('2024-01-19')
      }
    ]
  }
]

const mockComments = {
  1: [
    {
      id: 1,
      albumId: 1,
      author: '用户A',
      authorId: 101,
      content: '很棒的相册，拍得真好！构图和色彩都很棒。',
      createdAt: new Date('2024-01-16'),
      likes: 5,
      isLiked: false
    },
    {
      id: 2,
      albumId: 1,
      author: '用户B',
      authorId: 102,
      content: '构图很有感觉，学习了。特别是第一张照片的光线处理很专业。',
      createdAt: new Date('2024-01-15'),
      likes: 3,
      isLiked: true
    }
  ],
  2: [
    {
      id: 3,
      albumId: 2,
      author: '夜拍爱好者',
      authorId: 103,
      content: '城市夜景拍得很震撼，请问用的什么相机？',
      createdAt: new Date('2024-01-11'),
      likes: 2,
      isLiked: false
    }
  ],
  3: [
    {
      id: 4,
      albumId: 3,
      author: '旅行小白',
      authorId: 104,
      content: '好羡慕能去这么多地方旅行，每张照片都很有故事。',
      createdAt: new Date('2024-01-06'),
      likes: 8,
      isLiked: false
    }
  ]
}

// 模拟API延迟
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// API服务类
class AlbumService {
  // 获取社交动态列表 - 从后端files API适配
  async getSocialPosts(params = {}) {
    const { page = 1, limit = 10, tab = 'recommend', search = '' } = params
    
    if (MOCK_MODE) {
      await delay(300)
      
      let posts = [...mockSocialPosts]
      
      // 搜索过滤
      if (search) {
        posts = posts.filter(post =>
          post.content.toLowerCase().includes(search.toLowerCase()) ||
          post.author.toLowerCase().includes(search.toLowerCase()) ||
          (post.tags && post.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
        )
      }
      
      // 根据标签页排序
      switch (tab) {
        case 'newest':
          posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          break
        case 'popular':
          posts.sort((a, b) => b.likes - a.likes)
          break
        case 'recommend':
          // 推荐算法：综合考虑点赞、评论、分享和时间
          posts.sort((a, b) => {
            const scoreA = a.likes * 1 + a.comments * 2 + a.shares * 3
            const scoreB = b.likes * 1 + b.comments * 2 + b.shares * 3
            return scoreB - scoreA
          })
          break
        case 'following':
          // 模拟关注的用户动态（这里随机选择）
          posts = posts.filter(post => Math.random() > 0.3)
          break
      }
      
      // 分页
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedPosts = posts.slice(startIndex, endIndex)
      
      return {
        success: true,
        data: {
          posts: paginatedPosts,
          total: posts.length,
          page,
          limit,
          hasMore: endIndex < posts.length
        }
      }
    }
    
    // 真实API调用 - 适配后端files API
    try {
      const queryParams = new URLSearchParams({
        page,
        limit
      })
      
      const response = await fetch(`${API_BASE_URL}/files?${queryParams}`)
      const data = await response.json()
      
      if (data && data.files) {
        // 将files数据转换为社交动态格式
        const posts = data.files.map(file => ({
          id: file.id,
          authorId: 1,
          author: '摄影师', // 后端没有用户系统，使用默认作者
          avatar: '',
          content: file.originalname || '分享一张精彩的照片',
          images: [{
            id: file.id,
            url: `http://localhost:3000${file.url}`,
            title: file.originalname,
            description: file.originalname
          }],
          tags: ['摄影', '生活'],
          location: '',
          createdAt: new Date(file.created_at),
          likes: Math.floor(Math.random() * 100), // 模拟点赞数
          comments: Math.floor(Math.random() * 20),
          shares: Math.floor(Math.random() * 10),
          views: Math.floor(Math.random() * 500),
          isLiked: false,
          isFavorited: false,
          latestComments: []
        }))
        
        return {
          success: true,
          data: {
            posts,
            total: data.total,
            page: data.page,
            limit: data.limit,
            hasMore: data.hasMore
          }
        }
      } else {
        throw new Error('API响应格式错误')
      }
    } catch (error) {
      console.error('获取动态列表失败:', error)
      return { success: false, message: '获取动态列表失败: ' + error.message }
    }
  }

  // 创建新动态 - 适配后端upload API
  async createPost(postData) {
    if (MOCK_MODE) {
      await delay(800)
      
      const newPost = {
        id: Date.now(),
        authorId: 999,
        author: '当前用户',
        avatar: '',
        content: postData.content,
        images: postData.images || [],
        tags: postData.tags || [],
        location: postData.location || '',
        createdAt: new Date(),
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        isLiked: false,
        isFavorited: false,
        latestComments: []
      }
      
      mockSocialPosts.unshift(newPost)
      
      return { success: true, data: newPost }
    }
    
    try {
      // 后端支持多文件上传
      if (!postData.images || postData.images.length === 0) {
        throw new Error('请选择要上传的图片')
      }
      
      const formData = new FormData()
      
      // 添加所有图片文件
      postData.images.forEach((image, index) => {
        if (image.raw) {
          formData.append('files', image.raw)
        }
      })
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success && data.success.length > 0) {
        // 转换为社交动态格式
        const newPost = {
          id: data.success[0].id,
          authorId: 999,
          author: '当前用户',
          avatar: '',
          content: postData.content,
          images: data.success.map(file => ({
            id: file.id,
            url: `http://localhost:3000${file.url}`,
            title: file.originalname,
            description: file.originalname
          })),
          tags: postData.tags || [],
          location: postData.location || '',
          createdAt: new Date(),
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          isLiked: false,
          isFavorited: false,
          latestComments: []
        }
        
        return { success: true, data: newPost }
      } else {
        throw new Error(data.error || data.message || '上传失败')
      }
    } catch (error) {
      console.error('创建动态失败:', error)
      return { success: false, message: '创建动态失败: ' + error.message }
    }
  }

  // 点赞动态 - 模拟功能（后端不支持）
  async togglePostLike(postId, isLiked) {
    if (MOCK_MODE) {
      await delay(200)
      const post = mockSocialPosts.find(p => p.id === parseInt(postId))
      if (post) {
        post.isLiked = !isLiked
        post.likes += isLiked ? -1 : 1
        return { success: true, data: { isLiked: post.isLiked, likes: post.likes } }
      }
      return { success: false, message: '动态不存在' }
    }
    
    // 后端不支持点赞功能，返回模拟结果
    await delay(200)
    const newIsLiked = !isLiked
    const newLikes = Math.floor(Math.random() * 100) + (newIsLiked ? 1 : -1)
    
    return { 
      success: true, 
      data: { 
        isLiked: newIsLiked, 
        likes: Math.max(0, newLikes) 
      } 
    }
  }

  // 收藏动态 - 模拟功能（后端不支持）
  async togglePostFavorite(postId, isFavorited) {
    if (MOCK_MODE) {
      await delay(200)
      const post = mockSocialPosts.find(p => p.id === parseInt(postId))
      if (post) {
        post.isFavorited = !isFavorited
        return { success: true, data: { isFavorited: post.isFavorited } }
      }
      return { success: false, message: '动态不存在' }
    }
    
    // 后端不支持收藏功能，返回模拟结果
    await delay(200)
    return { 
      success: true, 
      data: { 
        isFavorited: !isFavorited 
      } 
    }
  }

  // 获取动态评论 - 模拟功能（后端不支持）
  async getPostComments(postId) {
    if (MOCK_MODE) {
      await delay(200)
      const comments = mockPostComments[postId] || []
      return { success: true, data: comments }
    }
    
    // 后端不支持评论功能，返回模拟数据
    await delay(200)
    const comments = mockPostComments[postId] || []
    return { success: true, data: comments }
  }

  // 添加动态评论 - 模拟功能（后端不支持）
  async addPostComment(postId, content) {
    if (MOCK_MODE) {
      await delay(300)
      const newComment = {
        id: Date.now(),
        postId: parseInt(postId),
        author: '当前用户',
        authorId: 999,
        content,
        createdAt: new Date(),
        likes: 0,
        isLiked: false
      }
      
      if (!mockPostComments[postId]) {
        mockPostComments[postId] = []
      }
      mockPostComments[postId].unshift(newComment)
      
      return { success: true, data: newComment }
    }
    
    // 后端不支持评论功能，返回模拟结果
    await delay(300)
    const newComment = {
      id: Date.now(),
      postId: parseInt(postId),
      author: '当前用户',
      authorId: 999,
      content,
      createdAt: new Date(),
      likes: 0,
      isLiked: false
    }
    
    if (!mockPostComments[postId]) {
      mockPostComments[postId] = []
    }
    mockPostComments[postId].unshift(newComment)
    
    return { success: true, data: newComment }
  }

  // 获取相册列表 - 使用photos API
  async getAlbums(params = {}) {
    return this.getSocialPosts(params)
  }
  
  // 获取单个相册详情
  async getAlbumById(id) {
    if (MOCK_MODE) {
      await delay(200)
      const album = mockAlbums.find(a => a.id === parseInt(id))
      if (album) {
        return { success: true, data: album }
      } else {
        return { success: false, message: '相册不存在' }
      }
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/photos/image/${id}`)
      if (response.ok) {
        return { 
          success: true, 
          data: {
            id,
            title: '照片详情',
            images: [{
              id,
              url: `${API_BASE_URL}/photos/image/${id}`,
              title: '照片'
            }]
          }
        }
      } else {
        return { success: false, message: '相册不存在' }
      }
    } catch (error) {
      console.error('获取相册详情失败:', error)
      return { success: false, message: '获取相册详情失败' }
    }
  }
  
  // 其他API方法保持不变，都使用模拟数据
  async toggleLike(albumId, isLiked) { return this.togglePostLike(albumId, isLiked) }
  async toggleFavorite(albumId, isFavorited) { return this.togglePostFavorite(albumId, isFavorited) }
  async getComments(albumId) { return this.getPostComments(albumId) }
  async addComment(albumId, content) { return this.addPostComment(albumId, content) }
  
  // 用户登录 - 模拟功能
  async login(username, password) {
    await delay(500)
    if (username && password) {
      return {
        success: true,
        data: {
          userId: 999,
          username,
          avatar: '',
          token: 'mock-token-' + Date.now()
        }
      }
    }
    return { success: false, message: '用户名或密码错误' }
  }
  
  // 增加浏览量 - 模拟功能
  async incrementViews(albumId) {
    return { success: true }
  }
}

// 导出单例
export default new AlbumService() 