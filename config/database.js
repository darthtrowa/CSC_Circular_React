require('dotenv').config();
const { Pool } = require('pg');

// สร้าง Connection Pool สำหรับใช้งานฐานข้อมูล PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1956wine',
    database: process.env.DB_NAME || 'circular',
    port: parseInt(process.env.DB_PORT || '5432'),
    max: parseInt(process.env.DB_MAX_CONN || '10'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: 5000,
});

// ตรวจสอบการเชื่อมต่อเมื่อเริ่มระบบ
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ PostgreSQL Connection Error:', err.message);
    } else {
        console.log('✅ PostgreSQL connected successfully to database:', process.env.DB_NAME || 'circular');
        release();
    }
});

module.exports = pool;
