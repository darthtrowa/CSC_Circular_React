const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// เลียนแบบ Response.class.php
const responseSuccess = (response, message = 'success') => ({ status: true, message, response });
const responseError = (message = 'error') => ({ status: false, message });

const JWT_SECRET = 'L^opNlkilogmL';

router.get('/index_main/main_select.php', async (req, res) => {
    try {
        const { rows: year } = await db.query('SELECT year_id, year_value FROM c_year order by year_ordering asc');
        const { rows: results } = await db.query('SELECT results_id, results_detail FROM c_results where results_status = $1 order by results_ordering asc', ['true']);
        const { rows: mati_work } = await db.query('SELECT mw_id, mw_name, mw_date, mw_ref FROM c_mati_work order by mw_ordering asc');
        const { rows: mati_kk } = await db.query('SELECT mkk_id, mkk_name, mkk_date, mkk_ref FROM c_mati_kk order by mkk_ordering asc');
        const { rows: agency } = await db.query('SELECT ag_id, ag_name FROM c_agency order by agency_ordering asc');
        const { rows: categories } = await db.query('SELECT cat_id, cat_name FROM c_categories order by cat_ordering asc');
        const { rows: c_status } = await db.query('SELECT status_id, status_value FROM c_status order by status_ordering asc');

        const responseData = { year, results, mati_work, mati_kk, agency, categories, c_status };

        const payload = {
            iss: 'circular',
            aud: 'circular',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 ชม.
            response: responseData
        };

        const token = jwt.sign(payload, JWT_SECRET);
        return res.json(responseSuccess(token, 'success'));

    } catch (error) {
        console.error(error);
        return res.status(405).json(responseError('ไม่สามารถเรียกดูข้อมูลได้'));
    }
});

router.post('/index_main/main.php', async (req, res) => {
    try {
        const input = req.body;
        let params = [];
        let whereClauses = ["1=1"];
        let paramIndex = 1;

        const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

        const addInClause = (values, column) => {
            let arr = toArray(values);
            if (arr.length === 0) return null;
            let placeholders = arr.map(() => `$${paramIndex++}`).join(',');
            params.push(...arr);
            return `${column} IN (${placeholders})`;
        };

        let inYear = addInClause(input.in_year_id, 'c_information.in_year_id');
        if (inYear) whereClauses.push(inYear);

        let inMkk = addInClause(input.in_mkk_id, 'c_information.in_mkk_id');
        if (inMkk) whereClauses.push(inMkk);

        let inResults = addInClause(input.in_results_id, 'c_information.in_results_id');
        if (inResults) whereClauses.push(inResults);

        let inMw = addInClause(input.in_mw_id, 'c_information.in_mw_id');
        if (inMw) whereClauses.push(inMw);

        let inStatus = addInClause(input.in_status_id, 'c_information.in_status_id');
        if (inStatus) whereClauses.push(inStatus);

        let agIds = toArray(input.ag_id);
        if (agIds.length > 0) {
            let placeholders = agIds.map(() => `$${paramIndex++}`).join(',');
            params.push(...agIds);
            whereClauses.push(`EXISTS (
                SELECT 1 FROM c_information_agency 
                WHERE c_information_agency.in_id = c_information.in_id 
                AND c_information_agency.ag_id IN (${placeholders})
            )`);
        }

        let catIds = toArray(input.cat_id);
        if (catIds.length > 0) {
            let placeholders = catIds.map(() => `$${paramIndex++}`).join(',');
            params.push(...catIds);
            whereClauses.push(`EXISTS (
                SELECT 1 FROM c_information_categories 
                WHERE c_information_categories.in_id = c_information.in_id 
                AND c_information_categories.cat_id IN (${placeholders})
            )`);
        }

        if (input.in_num_date) {
            whereClauses.push(`c_information.in_num_date ILIKE $${paramIndex++}`);
            params.push(`%${input.in_num_date}%`);
        }

        if (input.in_detail) {
            whereClauses.push(`c_information.in_detail ILIKE $${paramIndex++}`);
            params.push(`%${input.in_detail}%`);
        }

        whereClauses.push("c_results.results_status = 'true'");

        let whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        let sql = `
            SELECT 
                c_information.in_id,
                c_information.in_num_date,
                c_information.in_detail,
                c_information.in_detail_ag,
                c_information.in_file_mkk,
                c_information.in_etc,
                c_information.in_link,
                c_information.updated_at,
                c_information.created_at,
                c_information.updated_user,
                STRING_AGG(DISTINCT CONCAT(c_mati_kk.mkk_name, ':', c_mati_kk.mkk_date, ':', c_mati_kk.mkk_ref), ',') AS mati_kk,
                STRING_AGG(DISTINCT CONCAT(c_mati_work.mw_name, ':', c_mati_work.mw_date, ':', c_mati_work.mw_ref), ',') AS mati_work,
                STRING_AGG(DISTINCT CONCAT(c_results.results_id, ':', c_results.results_detail, ':', c_results.results_color, ':', c_results.results_etc), ',') AS results,
                STRING_AGG(DISTINCT CONCAT(c_year.year_value), ',') AS year,
                STRING_AGG(DISTINCT CONCAT(c_status.status_value), ',') AS status_a,
                STRING_AGG(DISTINCT CONCAT(c_categories.cat_name, ':', c_categories.cat_ref), ',') AS categories,
                STRING_AGG(DISTINCT CONCAT(c_agency.ag_name), ',') AS agency,
                STRING_AGG(DISTINCT CONCAT(ref_info.in_num_date, ':', ref_info.in_detail), ',') AS references_info
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

            ${whereSql}
            
            GROUP BY 
                c_information.in_id, 
                c_year.year_value
            ORDER BY c_year.year_value DESC
        `;

        const { rows } = await db.query(sql, params);

        const circular_kp = rows.map(info => {
            // mati_kk: STRING_AGG may return multiple values separated by comma; take first
            if (info.mati_kk) {
                const firstEntry = info.mati_kk.split(',')[0];
                const parts = firstEntry.split(':');
                info.mati_kk = { mkk_name: parts[0] || '', mkk_date: parts[1] || '', mkk_ref: parts.slice(2).join(':') || '-' };
            } else {
                info.mati_kk = { mkk_name: '', mkk_date: '', mkk_ref: '-' };
            }

            // mati_work
            if (info.mati_work) {
                const firstEntry = info.mati_work.split(',')[0];
                const parts = firstEntry.split(':');
                info.mati_work = { mw_name: parts[0] || '', mw_date: parts[1] || '', mw_ref: parts.slice(2).join(':') || '-' };
            } else {
                info.mati_work = { mw_name: '', mw_date: '', mw_ref: '-' };
            }

            // results
            if (info.results) {
                const firstEntry = info.results.split(',')[0];
                const parts = firstEntry.split(':');
                info.results = { 
                    results_id: parts[0] || '', 
                    results_detail: parts[1] || '', 
                    results_color: parts[2] || '', 
                    results_etc: parts.slice(3).join(':') || '' 
                };
            } else {
                info.results = { results_id: '', results_detail: '', results_color: '', results_etc: '' };
            }

            // year
            if (info.year) {
                info.year = { year_value: info.year.split(',')[0] };
            } else {
                info.year = { year_value: '' };
            }

            // status_a
            if (info.status_a) {
                info.status_a = { status_value: info.status_a.split(',')[0] };
            } else {
                info.status_a = { status_value: '' };
            }

            // categories
            info.categories = info.categories ? info.categories.split(',').map(item => {
                const idx = item.indexOf(':');
                const name = idx >= 0 ? item.substring(0, idx) : item;
                const ref = idx >= 0 ? item.substring(idx + 1) : '-';
                return { cat_name: name, cat_ref: ref || '-' };
            }) : [];

            // agency
            info.agency = info.agency ? info.agency.split(',').map(item => {
                return { ag_name: item };
            }) : [];

            // references_info
            const raw = info.references_info || '';
            info.references_info = raw ? raw.split(',').map(item => {
                const idx = item.indexOf(':');
                if (idx >= 0) {
                    return { in_num_date: item.substring(0, idx), in_detail: item.substring(idx + 1) };
                }
                return null;
            }).filter(Boolean) : [];

            return info;
        });

        // Frontend loadBooks() reads resp.response.circular_kp directly (no JWT decode)
        return res.json({
            status: true,
            message: 'success',
            response: {
                circular_kp,
                total_arr: [circular_kp.length]
            }
        });

    } catch (error) {
        require('fs').writeFileSync('error.log', error.stack || error.message);
        console.error("Search Error:", error);
        return res.status(405).json(responseError('ไม่สามารถเรียกดูข้อมูลได้'));
    }
});

// ============ PUBLIC STATS (ใช้บนหน้าหลัก ไม่ต้อง login) ============
router.get('/stats.php', async (req, res) => {
    try {
        const [all, use, adjust, notuse, pending, missing] = await Promise.all([
            db.query(`SELECT COUNT(*) AS c FROM c_information`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 2`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 4`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 5`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 12`),
            db.query(`SELECT COUNT(*) AS c FROM c_information WHERE in_results_id = 11`),
        ]);
        return res.json(responseSuccess({
            count_all:    parseInt(all.rows[0].c),
            count_use:    parseInt(use.rows[0].c),
            count_adjust: parseInt(adjust.rows[0].c),
            count_notuse: parseInt(notuse.rows[0].c),
            count_pending: parseInt(pending.rows[0].c),
            count_missing: parseInt(missing.rows[0].c),
        }));
    } catch (error) {
        console.error(error);
        return res.status(500).json(responseError('ไม่สามารถเรียกดูข้อมูลได้'));
    }
});

module.exports = router;
