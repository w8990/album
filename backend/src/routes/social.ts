import express from 'express';
import { 
  getFileListWithSocial,
  getFileWithSocialInfo,
  toggleLikeWithUserId,
  toggleFavoriteWithUserId,
  getFileComments,
  addCommentWithUserId,
  deleteCommentWithUserId
} from '../db';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// 获取社交动态列表
router.get('/files', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    const search = req.query.search as string;
    
    const userId = req.user?.id;
    const result = await getFileListWithSocial({
      page,
      limit,
      sortBy,
      sortOrder,
      albumId: null, // 社交动态不限制相册
      userId: userId?.toString()
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取社交动态失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取社交动态失败' 
    });
  }
});

// 获取单个文件的详细信息（包含社交数据）
router.get('/files/:id', optionalAuth, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    const fileInfo = await getFileWithSocialInfo(fileId, userId?.toString());
    
    if (!fileInfo) {
      return res.status(404).json({ 
        success: false, 
        error: '文件不存在' 
      });
    }

    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    console.error('获取文件详情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取文件详情失败' 
    });
  }
});

// 点赞/取消点赞
router.post('/files/:id/like', authenticateToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '请先登录' 
      });
    }

    const result = await toggleLikeWithUserId(fileId, userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '点赞操作失败' 
    });
  }
});

// 收藏/取消收藏
router.post('/files/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '请先登录' 
      });
    }

    const result = await toggleFavoriteWithUserId(fileId, userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '收藏操作失败' 
    });
  }
});

// 获取文件评论列表
router.get('/files/:id/comments', optionalAuth, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await getFileComments(fileId, { page, limit });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取评论失败' 
    });
  }
});

// 添加评论
router.post('/files/:id/comments', authenticateToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '请先登录' 
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: '评论内容不能为空' 
      });
    }

    const result = await addCommentWithUserId(fileId, userId, content.trim());
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '添加评论失败' 
    });
  }
});

// 删除评论
router.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '请先登录' 
      });
    }

    const success = await deleteCommentWithUserId(commentId, userId);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: '评论不存在或无权删除' 
      });
    }

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    if (error instanceof Error && error.message === '无权删除该评论') {
      res.status(403).json({ 
        success: false, 
        error: '无权删除该评论' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: '删除评论失败' 
      });
    }
  }
});

export default router; 