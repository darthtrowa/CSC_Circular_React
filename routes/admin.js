const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = 'L^opNlkilogmL';
const responseSuccess = (response, message = 'success') => ({ status: true, message, response });
const responseError = (message = 'error') => ({ status: false, message });

// ============ MULTER (PDF Upload) ============
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'mkk' + Date.now() + ext);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('กรุณาเลือกไฟล์ PDF เท่านั้น'));
    }
});

// ============ SESSION GUARD ============
const requireAdmin = (req, res, next) => {
    if (!req.session.ad_id) return res.status(401).json(responseError('กรุณาเข้าสู่ระบบ'));
    next();
};
const requireSuperAdmin = (req, res, next) => {
    if (!req.session.ad_id) return res.status(401).json(responseError('กรุณาเข้าสู่ระบบ'));
    if (req.session.ad_permiss !== 'superadmin') return res.status(403).json(responseError('Permission Not Allowed'));
    next();
};

// ============ AUTH: LOGIN ============
router.post('/auth/login.php', async (req, res) => {
    const { loginUsername, loginPassword, login_submit_hidden } = req.body;
    if (!loginUsername) return res.status(405).json(responseError('Username ไม่ได้กรอก!!!'));
    if (!loginPassword) return res.status(405).json(responseError('Password ไม่ได้กรอก!!!'));
    if (!login_submit_hidden) return res.status(405).json(responseError('มีการเข้าสู่ระบบผิดวิธี!!'));
    try {
        const { rows } = await db.query('SELECT * FROM admin WHERE a_username = $1', [loginUsername]);
        if (rows.length === 0) return res.status(405).json(responseError('มี Username หรือ Password ผิด'));
        const admin = rows[0];
        if (admin.a_status === 'false') return res.status(405).json(responseError('โปรไฟล์ของคุณถูกห้ามใช้!! โปรดติดต่อ Admin'));
        const dbHash = admin.a_password;
        // PHP stores 20-char random prefix before the $2y$ bcrypt hash
        const bcryptStart = dbHash.indexOf('$2');
        const rawHash = bcryptStart >= 0 ? dbHash.substring(bcryptStart) : dbHash;
        // PHP bcrypt uses $2y$, Node.js bcryptjs needs $2b$
        const normalizedHash = rawHash.replace(/^\$2y\$/, '$2b$');
        const isMatch = await bcrypt.compare(loginPassword, normalizedHash).catch(() => false);
        if (!isMatch) return res.status(405).json(responseError('มี Username หรือ Password ผิด'));
        req.session.ad_id = admin.a_id;
        req.session.ad_name = admin.a_name;
        req.session.ad_status = admin.a_status;
        req.session.ad_permiss = admin.a_permiss;
        await db.query('UPDATE admin SET a_last_login = NOW() WHERE a_id = $1', [admin.a_id]);
        return res.json(responseSuccess(admin.a_name, 'login success'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('Server Error'));
    }
});

// ============ DASHBOARD STATS ============
router.get('/dashboard/index.php', requireAdmin, async (req, res) => {
    try {
        const [all, use, adjust, notuse, pending, missing, none] = await Promise.all([
            db.query(`SELECT COUNT(*) AS c FROM c_information`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 2`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 4`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 5`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 12`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 11`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 1`),
        ]);
        return res.json(responseSuccess({
            count_all:      parseInt(all.rows[0].c),
            count_use:      parseInt(use.rows[0].c),
            count_adjust:   parseInt(adjust.rows[0].c),
            count_notuse:   parseInt(notuse.rows[0].c),
            count_pending:  parseInt(pending.rows[0].c),
            count_missing:  parseInt(missing.rows[0].c),
            count_none:     parseInt(none.rows[0].c),
        }));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('Server Error'));
    }
});

// ============ CIRCULAR: GET LIST (admin view with IDs) ============
router.get('/account/circular_add/main.php', requireSuperAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT 
                c_information.in_id,
                c_information.in_num_date,
                c_information.in_detail,
                c_information.in_detail_ag,
                c_information.in_file_mkk,
                c_information.in_etc,
                c_information.in_link,
                c_information.in_ordering,
                c_information.updated_at,
                c_information.created_at,
                c_information.updated_user,
                STRING_AGG(DISTINCT CONCAT(c_mati_kk.mkk_id, ':', c_mati_kk.mkk_name, ':', c_mati_kk.mkk_date, ':', c_mati_kk.mkk_ref), ',') AS mati_kk,
                STRING_AGG(DISTINCT CONCAT(c_mati_work.mw_id, ':', c_mati_work.mw_name, ':', c_mati_work.mw_date, ':', c_mati_work.mw_ref), ',') AS mati_work,
                STRING_AGG(DISTINCT CONCAT(c_results.results_id, ':', c_results.results_detail, ':', c_results.results_color), ',') AS results,
                STRING_AGG(DISTINCT CONCAT(c_year.year_id, ':', c_year.year_value), ',') AS year,
                STRING_AGG(DISTINCT CONCAT(c_status.status_id, ':', c_status.status_value), ',') AS status_a,
                STRING_AGG(DISTINCT CONCAT(c_categories.cat_id, ':', c_categories.cat_name, ':', c_categories.cat_ref), ',') AS categories,
                STRING_AGG(DISTINCT CONCAT(c_agency.ag_id, ':', c_agency.ag_name), ',') AS agency,
                STRING_AGG(DISTINCT CONCAT(ref_info.in_id, ':', ref_info.in_num_date, ':', ref_info.in_detail), ',') AS references_info
            FROM c_information
            LEFT JOIN c_information_categories ON c_information.in_id = c_information_categories.in_id
            LEFT JOIN c_categories ON c_information_categories.cat_id = c_categories.cat_id
            LEFT JOIN c_information_agency ON c_information.in_id = c_information_agency.in_id
            LEFT JOIN c_agency ON c_information_agency.ag_id = c_agency.ag_id
            LEFT JOIN c_year ON c_information.in_year_id = c_year.year_id
            LEFT JOIN c_status ON c_information.in_status_id = c_status.status_id
            LEFT JOIN c_mati_work ON c_information.in_mw_id = c_mati_work.mw_id
            LEFT JOIN c_mati_kk ON c_information.in_mkk_id = c_mati_kk.mkk_id
            LEFT JOIN c_results ON c_information.in_results_id = c_results.results_id
            LEFT JOIN c_information_information ON c_information.in_id = c_information_information.in_id
            LEFT JOIN c_information AS ref_info ON c_information_information.in_id_ref = ref_info.in_id
            GROUP BY c_information.in_id
            ORDER BY c_information.in_ordering ASC
        `;
        const { rows: information } = await db.query(sql);
        const parseField = (val, sep, fields) => {
            if (!val) return null;
            const first = val.split(',')[0];
            const parts = first.split(':');
            const obj = {};
            fields.forEach((f, i) => obj[f] = parts[i] || '');
            return obj;
        };
        const mapped = information.map(info => {
            info.mati_kk = parseField(info.mati_kk, ',', ['mkk_id','mkk_name','mkk_date','mkk_ref']);
            info.mati_work = parseField(info.mati_work, ',', ['mw_id','mw_name','mw_date','mw_ref']);
            info.results = parseField(info.results, ',', ['results_id','results_detail','results_color']);
            info.year = parseField(info.year, ',', ['year_id','year_value']);
            info.status_a = parseField(info.status_a, ',', ['status_id','status_value']);
            info.categories = info.categories ? info.categories.split(',').map(item => {
                const [id, name, ref] = item.split(':');
                return { cat_id: id, cat_name: name, cat_ref: ref };
            }) : [];
            info.agency = info.agency ? info.agency.split(',').map(item => {
                const [id, name] = item.split(':');
                return { ag_id: id, ag_name: name };
            }) : [];
            info.references_info = info.references_info ? info.references_info.split(',').map(item => {
                const parts = item.split(':');
                return parts.length >= 3 ? { in_id: parts[0], in_num_date: parts[1], in_detail: parts.slice(2).join(':') } : null;
            }).filter(Boolean) : [];
            return info;
        });

        const [year, results, mati_work, mati_kk, agency, categories, status] = await Promise.all([
            db.query('SELECT year_id, year_value FROM c_year ORDER BY year_ordering ASC'),
            db.query('SELECT results_id, results_detail FROM c_results ORDER BY results_ordering ASC'),
            db.query('SELECT mw_id, mw_name, mw_date, mw_ref FROM c_mati_work ORDER BY mw_ordering ASC'),
            db.query('SELECT mkk_id, mkk_name, mkk_date, mkk_ref FROM c_mati_kk ORDER BY mkk_ordering ASC'),
            db.query('SELECT ag_id, ag_name FROM c_agency ORDER BY agency_ordering ASC'),
            db.query('SELECT cat_id, cat_name FROM c_categories ORDER BY cat_ordering ASC'),
            db.query('SELECT status_id, status_value FROM c_status ORDER BY status_ordering ASC'),
        ]);

        const response = { information: mapped, year: year.rows, results: results.rows, mati_work: mati_work.rows, mati_kk: mati_kk.rows, agency: agency.rows, categories: categories.rows, status: status.rows };
        const token = jwt.sign({ iss:'circular', aud:'circular', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600, response }, JWT_SECRET);
        return res.json(responseSuccess(token));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('ไม่สามารถเรียกดูข้อมูลได้'));
    }
});

// ============ CIRCULAR: CREATE ============
router.post('/account/circular_add/create.php', requireSuperAdmin, upload.single('mkk_ref_upload_in'), async (req, res) => {
    try {
        const body = req.body;
        if (!body.submit_create_circular_hidden) return res.status(405).json(responseError('Submit Not Allowed!'));

        let in_file_mkk = '';
        if (body.mkk_ref_link_in && body.mkk_ref_link_in !== '') {
            in_file_mkk = body.mkk_ref_link_in.trim();
        } else if (req.file) {
            in_file_mkk = req.file.filename;
        } else if (body.mkk_ref_none_in === '-') {
            in_file_mkk = '-';
        } else {
            return res.status(405).json(responseError('เกิดข้อผิดพลาด!!'));
        }

        const in_etc = (body.in_etc && body.in_etc.trim() !== '') ? body.in_etc.trim() : '-';
        const in_link = (body.in_link && body.in_link !== '') ? body.in_link.trim() : (body.lkk_none === '-' ? '-' : '');
        if (!in_link) return res.status(405).json(responseError('เกิดข้อผิดพลาด!! (link)'));

        const maxRes = await db.query('SELECT MAX(in_ordering) AS max_order FROM c_information');
        const maxOrder = maxRes.rows[0].max_order;
        const newOrdering = maxOrder === null ? 1 : parseInt(maxOrder) + 1;

        const insertRes = await db.query(
            `INSERT INTO c_information (in_num_date, in_detail, in_detail_ag, in_etc, in_link, in_file_mkk, updated_user, in_mkk_id, in_mw_id, in_results_id, in_year_id, in_status_id, created_at, updated_at, in_ordering)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW(),$13) RETURNING in_id`,
            [body.in_num_date, body.in_detail, body.in_detail_ag, in_etc, in_link, in_file_mkk, req.session.ad_name, body.in_mkk_id, body.in_mw_id, body.in_results_id, body.in_year_id, body.in_status_id, newOrdering]
        );
        const in_id = insertRes.rows[0].in_id;

        const agIds = Array.isArray(body.ag_id) ? body.ag_id : (body.ag_id ? [body.ag_id] : []);
        const catIds = Array.isArray(body.cat_id) ? body.cat_id : (body.cat_id ? [body.cat_id] : []);
        if (!agIds.length || !catIds.length) return res.status(400).json(responseError('กรุณาเลือกผู้รับผิดชอบและหมวดหมู่'));

        for (const ag_id of agIds) await db.query('INSERT INTO c_information_agency (in_id, ag_id) VALUES ($1,$2)', [in_id, ag_id]);
        for (const cat_id of catIds) await db.query('INSERT INTO c_information_categories (in_id, cat_id) VALUES ($1,$2)', [in_id, cat_id]);

        const refIds = Array.isArray(body.in_id_ref) ? body.in_id_ref : (body.in_id_ref ? [body.in_id_ref] : []);
        if (body.ref_none !== '-' && refIds.length > 0) {
            for (const ref_id of refIds) await db.query('INSERT INTO c_information_information (in_id, in_id_ref) VALUES ($1,$2)', [in_id, ref_id]);
        }
        return res.json(responseSuccess(in_id, 'สำเร็จ!!'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('เกิดข้อผิดพลาด'));
    }
});

// ============ CIRCULAR: UPDATE ============
router.post('/account/circular_add/update.php', requireSuperAdmin, upload.single('mkk_ref_upload_in'), async (req, res) => {
    try {
        const body = req.body;
        if (!body.submit_create_circular_hidden) return res.status(405).json(responseError('Submit Not Allowed!'));
        if (!body.in_id) return res.status(405).json(responseError('ID Not Allowed!!'));

        const refIds = Array.isArray(body.in_id_ref) ? body.in_id_ref : (body.in_id_ref ? [body.in_id_ref] : []);
        if (refIds.length > 0 && refIds[0] == body.in_id) return res.status(400).json(responseError('หนังสืออ้างอิง ไม่สามารถใช้อันเดียวกันได้'));

        let in_file_mkk = '';
        if (body.mkk_ref_link_in && body.mkk_ref_link_in !== '') {
            in_file_mkk = body.mkk_ref_link_in.trim();
        } else if (req.file) {
            in_file_mkk = req.file.filename;
        } else if (body.mkk_ref_none_in === '-') {
            in_file_mkk = '-';
        } else if (body.existing_file_in && body.existing_file_in !== '') {
            in_file_mkk = body.existing_file_in;
        } else {
            return res.status(405).json(responseError('เกิดข้อผิดพลาด!!'));
        }

        const in_etc = (body.in_etc && body.in_etc.trim() !== '') ? body.in_etc.trim() : '-';
        const in_link = (body.in_link && body.in_link !== '') ? body.in_link.trim() : (body.lkk_none === '-' ? '-' : '');

        await db.query(
            `UPDATE c_information SET in_num_date=$1, in_detail=$2, in_detail_ag=$3, in_etc=$4, in_link=$5, in_file_mkk=$6, updated_user=$7, in_mkk_id=$8, in_mw_id=$9, in_results_id=$10, in_year_id=$11, in_status_id=$12, updated_at=NOW() WHERE in_id=$13`,
            [body.in_num_date, body.in_detail, body.in_detail_ag, in_etc, in_link, in_file_mkk, req.session.ad_name, body.in_mkk_id, body.in_mw_id, body.in_results_id, body.in_year_id, body.in_status_id, body.in_id]
        );

        const agIds = Array.isArray(body.ag_id) ? body.ag_id : (body.ag_id ? [body.ag_id] : []);
        const catIds = Array.isArray(body.cat_id) ? body.cat_id : (body.cat_id ? [body.cat_id] : []);

        await db.query('DELETE FROM c_information_agency WHERE in_id=$1', [body.in_id]);
        for (const ag_id of agIds) await db.query('INSERT INTO c_information_agency (in_id, ag_id) VALUES ($1,$2)', [body.in_id, ag_id]);

        await db.query('DELETE FROM c_information_categories WHERE in_id=$1', [body.in_id]);
        for (const cat_id of catIds) await db.query('INSERT INTO c_information_categories (in_id, cat_id) VALUES ($1,$2)', [body.in_id, cat_id]);

        if (body.ref_none !== '-' && refIds.length > 0) {
            await db.query('DELETE FROM c_information_information WHERE in_id=$1', [body.in_id]);
            for (const ref_id of refIds) await db.query('INSERT INTO c_information_information (in_id, in_id_ref) VALUES ($1,$2)', [body.in_id, ref_id]);
        } else if (body.ref_none === '-') {
            await db.query('DELETE FROM c_information_information WHERE in_id=$1', [body.in_id]);
        }

        return res.json(responseSuccess('success', 'แก้ไขข้อมูลสำเร็จ!!'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('เกิดข้อผิดพลาด'));
    }
});

// ============ CIRCULAR: DELETE ============
router.post('/account/circular_add/delete.php', requireSuperAdmin, async (req, res) => {
    try {
        if (!req.body.in_id) return res.status(405).json(responseError('ID Not Allowed!!'));
        // decode obfuscated id (PHP used substr+base64)
        let raw = req.body.in_id;
        let in_id;
        try {
            in_id = parseInt(Buffer.from(raw.substring(34, raw.length - 51), 'base64').toString('utf8'));
        } catch(e) {
            in_id = parseInt(raw); // fallback: plain id
        }
        if (isNaN(in_id)) return res.status(400).json(responseError('ข้อมูลไม่ถูกต้อง'));

        const used = await db.query('SELECT in_id_ref FROM c_information_information WHERE in_id_ref=$1', [in_id]);
        if (used.rows.length > 0) return res.status(400).json(responseError('หนังสือเวียนนี้ ใช้อ้างอิงอยู่..'));

        await db.query('DELETE FROM c_information_information WHERE in_id=$1', [in_id]);
        await db.query('DELETE FROM c_information_agency WHERE in_id=$1', [in_id]);
        await db.query('DELETE FROM c_information_categories WHERE in_id=$1', [in_id]);
        await db.query('DELETE FROM c_information WHERE in_id=$1', [in_id]);
        return res.json(responseSuccess(in_id, 'ลบข้อมูลสำเร็จ'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('เกิดข้อผิดพลาด'));
    }
});

// ============ CIRCULAR: TOGGLE STATUS ============
router.post('/account/circular_add/active_information.php', requireSuperAdmin, async (req, res) => {
    try {
        if (!req.body.in_id) return res.status(405).json(responseError('Service Not Allowed!'));
        await db.query('UPDATE c_information SET in_status_id=$1, updated_at=NOW() WHERE in_id=$2', [req.body.in_status, req.body.in_id]);
        return res.json(responseSuccess('success', 'Update สำเร็จ!!'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('เกิดข้อผิดพลาด'));
    }
});

// ============ CIRCULAR: REORDER ============
router.post('/account/circular_add/update_order.php', requireSuperAdmin, async (req, res) => {
    try {
        const orders = req.body.orders; // [{in_id, in_ordering}]
        if (!Array.isArray(orders)) return res.status(400).json(responseError('ข้อมูลไม่ถูกต้อง'));
        for (const item of orders) {
            await db.query('UPDATE c_information SET in_ordering=$1 WHERE in_id=$2', [item.in_ordering, item.in_id]);
        }
        return res.json(responseSuccess('success', 'เรียงลำดับสำเร็จ'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('เกิดข้อผิดพลาด'));
    }
});

// ============ PROFILE: GET ============
router.get('/account/profile_s/profile_s.php', requireAdmin, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT a_id, a_name, a_username, a_permiss, a_last_login FROM admin WHERE a_id=$1', [req.session.ad_id]);
        if (rows.length === 0) return res.status(404).json(responseError('ไม่พบข้อมูล'));
        return res.json(responseSuccess(rows[0]));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('Server Error'));
    }
});

// ============ PROFILE: UPDATE ============
router.post('/account/profile_s/update_s.php', requireAdmin, async (req, res) => {
    try {
        const { a_name } = req.body;
        if (!a_name) return res.status(400).json(responseError('กรุณากรอกชื่อ'));
        await db.query('UPDATE admin SET a_name=$1 WHERE a_id=$2', [a_name.trim(), req.session.ad_id]);
        req.session.ad_name = a_name.trim();
        return res.json(responseSuccess('success', 'แก้ไขข้อมูลสำเร็จ'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('Server Error'));
    }
});

// ============ CHANGE PASSWORD ============
router.post('/account/repassword.php', requireAdmin, async (req, res) => {
    try {
        const { old_password, new_password, confirm_password } = req.body;
        if (!old_password || !new_password || !confirm_password) return res.status(400).json(responseError('กรุณากรอกข้อมูลให้ครบ'));
        if (new_password !== confirm_password) return res.status(400).json(responseError('รหัสผ่านใหม่ไม่ตรงกัน'));
        if (new_password.length < 6) return res.status(400).json(responseError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'));

        const { rows } = await db.query('SELECT a_password FROM admin WHERE a_id=$1', [req.session.ad_id]);
        if (rows.length === 0) return res.status(404).json(responseError('ไม่พบข้อมูล'));
        const dbHash = rows[0].a_password.substring(20);
        const isMatch = await bcrypt.compare(old_password, dbHash).catch(() => false);
        if (!isMatch) return res.status(400).json(responseError('รหัสผ่านเดิมไม่ถูกต้อง'));

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(new_password, salt);
        // preserve the 20-char prefix format from PHP
        const prefix = rows[0].a_password.substring(0, 20);
        await db.query('UPDATE admin SET a_password=$1 WHERE a_id=$2', [prefix + newHash, req.session.ad_id]);
        return res.json(responseSuccess('success', 'เปลี่ยนรหัสผ่านสำเร็จ'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('Server Error'));
    }
});

// ============ PROFILE ============
router.get('/account/profile.php', requireAdmin, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT a_name, a_username, a_permiss FROM admin WHERE a_id=$1', [req.session.ad_id]);
        if (rows.length === 0) return res.status(404).json(responseError('ไม่พบข้อมูล'));
        return res.json(responseSuccess(rows[0]));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('Server Error'));
    }
});

router.post('/account/profile.php', requireAdmin, async (req, res) => {
    try {
        const { a_name } = req.body;
        if (!a_name) return res.status(400).json(responseError('กรุณากรอกชื่อ'));
        await db.query('UPDATE admin SET a_name=$1 WHERE a_id=$2', [a_name, req.session.ad_id]);
        req.session.ad_name = a_name;
        return res.json(responseSuccess('success', 'บันทึกข้อมูลสำเร็จ'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('Server Error'));
    }
});

// ============ MASTER DATA CRUD ============
const masterConfigs = {
    year:       { table: 'c_year', pk: 'year_id', val: 'year_value', order: 'year_ordering' },
    results:    { table: 'c_results', pk: 'results_id', val: 'results_detail', order: 'results_ordering' },
    agency:     { table: 'c_agency', pk: 'ag_id', val: 'ag_name', order: 'agency_ordering' },
    categories: { table: 'c_categories', pk: 'cat_id', val: 'cat_name', order: 'cat_ordering' },
    mkk:        { table: 'c_mati_kk', pk: 'mkk_id', val: 'mkk_name', order: 'mkk_ordering' },
    mw:         { table: 'c_mati_work', pk: 'mw_id', val: 'mw_name', order: 'mw_ordering' },
    status:     { table: 'c_status', pk: 'status_id', val: 'status_value', order: 'status_ordering' }
};

router.post('/master/action', requireSuperAdmin, async (req, res) => {
    try {
        const { action, type, id, value } = req.body;
        const config = masterConfigs[type];
        if (!config) return res.status(400).json(responseError('Invalid Master Data Type'));

        if (action === 'create') {
            const maxOrderRes = await db.query(`SELECT MAX(${config.order}) as max_val FROM ${config.table}`);
            const newOrder = (maxOrderRes.rows[0].max_val || 0) + 1;
            await db.query(`INSERT INTO ${config.table} (${config.val}, ${config.order}, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())`, [value, newOrder]);
            return res.json(responseSuccess('success', 'เพิ่มข้อมูลสำเร็จ'));
        } 
        else if (action === 'update') {
            if (!id) return res.status(400).json(responseError('ID Required'));
            await db.query(`UPDATE ${config.table} SET ${config.val} = $1, updated_at = NOW() WHERE ${config.pk} = $2`, [value, id]);
            return res.json(responseSuccess('success', 'แก้ไขข้อมูลสำเร็จ'));
        } 
        else if (action === 'delete') {
            if (!id) return res.status(400).json(responseError('ID Required'));
            
            // Basic referential integrity check could be added here, but forcing delete for now
            // To be safe, catch constraint errors
            try {
                await db.query(`DELETE FROM ${config.table} WHERE ${config.pk} = $1`, [id]);
                return res.json(responseSuccess('success', 'ลบข้อมูลสำเร็จ'));
            } catch (err) {
                if (err.code === '23503') { // foreign_key_violation
                    return res.status(400).json(responseError('ข้อมูลนี้ถูกใช้งานอยู่ ไม่สามารถลบได้'));
                }
                throw err;
            }
        }
        else {
            return res.status(400).json(responseError('Invalid Action'));
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('Server Error'));
    }
});

module.exports = router;
