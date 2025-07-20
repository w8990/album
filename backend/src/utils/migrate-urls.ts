import { pool } from '../db/connection';
import { TABLE_NAME } from '../db/init';

/**
 * 将数据库中的绝对URL转换为相对URL
 * 这是一个一次性迁移脚本，用于修复硬编码的localhost:3000 URL
 */
export async function migrateUrlsToRelative() {
  try {
    console.log('开始迁移URL格式...');
    
    // 更新所有包含 localhost:3000 的URL为相对路径
    const [result] = await pool.query(
      `UPDATE ${TABLE_NAME} 
       SET url = REPLACE(url, 'http://localhost:3000', '') 
       WHERE url LIKE 'http://localhost:3000%'`
    );
    
    console.log(`已更新 ${(result as any).affectedRows} 条记录的URL格式`);
    
    // 检查更新结果
    const [files] = await pool.query(
      `SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE url LIKE 'http://localhost:3000%'`
    );
    
    const remainingCount = (files as any[])[0].count;
    if (remainingCount === 0) {
      console.log('✅ 所有URL已成功迁移为相对路径');
    } else {
      console.log(`⚠️  仍有 ${remainingCount} 个URL未能迁移`);
    }
    
    return true;
  } catch (error) {
    console.error('URL迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateUrlsToRelative()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}