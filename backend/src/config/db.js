
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import { env } from './env.js';

const isTiDB = process.env.DB_SSL === 'true';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'KevsBroom',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ...(isTiDB && {
    ssl: {
      ca: fs.readFileSync(process.env.DB_SSL_CA, 'utf8'),
      rejectUnauthorized: true
    }
  }),
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true
});

export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function checkDatabase() {
  await pool.query('SELECT 1');
}
