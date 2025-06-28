import mysql from 'mysql2/promise';

const DB_NAME = 'album';

// 数据库连接配置
export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '899022', // 请修改为您的数据库密码
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export { DB_NAME }; 