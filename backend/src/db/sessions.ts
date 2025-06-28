import { pool } from './connection';

// 创建用户会话
export async function createUserSession(userId: number, sessionToken: string, expiresAt: Date) {
  try {
    const [result] = await pool.query(
      'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
      [userId, sessionToken, expiresAt]
    );
    return (result as any).insertId;
  } catch (error) {
    console.error('创建用户会话失败:', error);
    throw error;
  }
}

// 验证用户会话
export async function validateUserSession(sessionToken: string) {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, u.id as user_id, u.username, u.display_name, u.avatar_url 
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > NOW() AND u.is_active = TRUE
    `, [sessionToken]);
    
    return (rows as any[])[0];
  } catch (error) {
    console.error('验证用户会话失败:', error);
    throw error;
  }
}

// 删除用户会话
export async function deleteUserSession(sessionToken: string) {
  try {
    const [result] = await pool.query(
      'DELETE FROM user_sessions WHERE session_token = ?',
      [sessionToken]
    );
    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('删除用户会话失败:', error);
    throw error;
  }
}

// 清理过期会话
export async function cleanExpiredSessions() {
  try {
    const [result] = await pool.query(
      'DELETE FROM user_sessions WHERE expires_at <= NOW()'
    );
    return (result as any).affectedRows;
  } catch (error) {
    console.error('清理过期会话失败:', error);
    throw error;
  }
} 