require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า EJS เป็น Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ตั้งค่า Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ตั้งค่า Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'circular_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS ใน production
        maxAge: 8 * 60 * 60 * 1000 // 8 ชั่วโมง
    }
}));

// กำหนด Charset UTF-8 เฉพาะ HTML response
app.use((req, res, next) => {
    const originalRender = res.render.bind(res);
    res.render = function(view, options, callback) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return originalRender(view, options, callback);
    };
    next();
});

// ตั้งค่า Static Files
const staticOpts = {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js'))  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
};
app.use('/assets',              express.static(path.join(__dirname, 'assets'),              staticOpts));
app.use('/image',               express.static(path.join(__dirname, 'image'),               staticOpts));
app.use('/uploads',             express.static(path.join(__dirname, 'uploads')));
app.use('/node_modules',        express.static(path.join(__dirname, 'node_modules'),        staticOpts));
app.use('/index_main',          express.static(path.join(__dirname, 'index_main'),          staticOpts));
app.use('/admincscit/Main_JS',  express.static(path.join(__dirname, 'admincscit/Main_JS'),  staticOpts));
app.use('/admincscit/assets',   express.static(path.join(__dirname, 'admincscit/assets'),   staticOpts));

// ============ ROUTES ============

// หน้าหลัก (public)
app.get('/', (req, res) => {
    res.render('index');
});

// Admin Login
app.get('/admin/login', (req, res) => {
    if (req.session.ad_id) return res.redirect('/admin/dashboard');
    res.render('admin/login');
});

// Admin Dashboard
const dbPool = require('./config/database');
app.get('/admin/dashboard', async (req, res) => {
    if (!req.session.ad_id) return res.redirect('/admin/login');
    try {
        let ad_permiss = req.session.ad_permiss;
        if (!ad_permiss) {
            const { rows } = await dbPool.query('SELECT a_permiss FROM admin WHERE a_id = $1', [req.session.ad_id]);
            ad_permiss = rows.length > 0 ? rows[0].a_permiss : 'admin';
            req.session.ad_permiss = ad_permiss;
        }
        res.render('admin/dashboard', {
            ad_name:    req.session.ad_name    || 'Admin',
            ad_permiss: ad_permiss
        });
    } catch (e) {
        console.error('Dashboard error:', e.message);
        res.render('admin/dashboard', {
            ad_name:    req.session.ad_name || 'Admin',
            ad_permiss: req.session.ad_permiss || 'admin'
        });
    }
});

// Logout
app.post('/admin/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
});

// ============ API ROUTES ============
const apiRoutes   = require('./routes/api');
const adminRoutes = require('./routes/admin');
const chatRoutes  = require('./routes/chat');

// หน้า Chatbot (ต้องอยู่ก่อน 404)
app.get('/chat', (req, res) => res.render('chat'));

app.use('/service/api/chat',      chatRoutes);  // ต้องอยู่ก่อน /service/api
app.use('/service/api',           apiRoutes);
app.use('/admincscit/service',    adminRoutes);

// ============ 404 HANDLER ============
app.use((req, res) => {
    res.status(404).send(`
        <html><head><title>404 - ไม่พบหน้านี้</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px;">
            <h1 style="color:#de0508;">404</h1>
            <p>ไม่พบหน้าที่คุณต้องการ: <code>${req.path}</code></p>
            <a href="/">กลับหน้าหลัก</a>
        </body></html>
    `);
});

// ============ GLOBAL ERROR HANDLER ============
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack || err.message);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`\n🚀 Circular System is running!`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Admin:    http://localhost:${PORT}/admin/login`);
    console.log(`   Mode:     ${process.env.NODE_ENV || 'development'}\n`);
});
