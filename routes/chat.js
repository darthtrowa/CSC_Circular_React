const express    = require('express');
const router     = express.Router();
const WebSocket  = require('ws');
const { randomUUID } = require('crypto');

const OPENCLAW_HOST  = process.env.OPENCLAW_HOST  || '127.0.0.1';
const OPENCLAW_PORT  = parseInt(process.env.OPENCLAW_PORT || '18789');
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN  || '005cf3a69eb78f33cffeef7d4dfdabe747291b479da6fab9';
const TIMEOUT_MS     = 120000;

// ──────────────────────────────────────────────────────────────
// helper: เชื่อมต่อและ handshake กับ OpenClaw gateway
// ──────────────────────────────────────────────────────────────
function openClawConnect() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://${OPENCLAW_HOST}:${OPENCLAW_PORT}`, {
            handshakeTimeout: 6000,
        });
        const pending = new Map();

        function sendFrame(obj) { ws.send(JSON.stringify(obj)); }

        function request(method, params) {
            return new Promise((res, rej) => {
                const id = randomUUID();
                pending.set(id, { res, rej });
                sendFrame({ type: 'req', id, method, params });
                setTimeout(() => {
                    if (pending.has(id)) { pending.delete(id); rej(new Error('timeout: ' + method)); }
                }, 15000);
            });
        }

        ws.on('message', (raw) => {
            let f;
            try { f = JSON.parse(raw.toString()); } catch { return; }
            if (f.type === 'res' && f.id && pending.has(f.id)) {
                const { res, rej } = pending.get(f.id);
                pending.delete(f.id);
                if (f.ok !== false) res(f.payload ?? f.result ?? f);
                else rej(new Error(f.payload?.error?.message || f.error?.message || JSON.stringify(f)));
                return;
            }
            ws.emit('oc-event', f);
        });

        ws.on('error', reject);

        ws.on('open', async () => {
            try {
                await new Promise(r => setTimeout(r, 300)); // รอ challenge event
                await request('connect', {
                    minProtocol: 3,
                    maxProtocol: 3,
                    client: {
                        id:          'gateway-client',
                        displayName: 'Circular Web UI',
                        mode:        'backend',
                        version:     '1.0.0',
                        platform:    'node',
                    },
                    caps:   [],
                    auth:   { token: OPENCLAW_TOKEN },
                    role:   'operator',
                    scopes: ['operator.read', 'operator.write'],
                });
                resolve({ ws, request });
            } catch (err) { ws.close(); reject(err); }
        });

        ws.on('close', () => {
            for (const { rej } of pending.values()) rej(new Error('WebSocket closed'));
            pending.clear();
        });
    });
}

// ──────────────────────────────────────────────────────────────
// PING
// ──────────────────────────────────────────────────────────────
router.get('/ping', async (req, res) => {
    try {
        const { ws } = await openClawConnect();
        ws.close();
        return res.json({ ok: true });
    } catch (err) {
        return res.status(503).json({ ok: false, error: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// CHAT
// ──────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { message, sessionKey: existingSessionKey } = req.body;
    if (!message?.trim()) return res.status(400).json({ status: false, message: 'กรุณาส่งข้อความ' });

    // 1. เชื่อมต่อ gateway
    let conn;
    try {
        conn = await openClawConnect();
    } catch (err) {
        return res.status(502).json({ status: false, message: 'เชื่อมต่อ OpenClaw ไม่ได้: ' + err.message });
    }

    const { ws, request } = conn;
    let replied = false;
    const chunks = [];

    const finish = (ok, text, extra = {}) => {
        if (replied) return;
        replied = true;
        clearTimeout(tid);
        ws.close();
        if (ok) res.json({ status: true, response: text, ...extra });
        else    res.status(502).json({ status: false, message: text });
    };

    const tid = setTimeout(() => {
        const partial = chunks.join('').trim();
        finish(!!partial, partial || 'OpenClaw ไม่ตอบภายใน ' + (TIMEOUT_MS / 1000) + ' วินาที');
    }, TIMEOUT_MS);

    // 2. สร้าง session (หรือใช้ session เดิม)
    let sessionKey = existingSessionKey;
    let sessionId;
    if (!sessionKey) {
        try {
            const sess = await request('sessions.create', { agentId: 'main' });
            sessionKey = sess.key || sess.sessionKey;
            sessionId  = sess.sessionId;
        } catch (err) {
            return finish(false, 'สร้าง session ไม่ได้: ' + err.message);
        }
    }

    // 3. subscribe รับ messages จาก session (param เป็น 'key' ไม่ใช่ 'sessionKey')
    try {
        await request('sessions.messages.subscribe', { key: sessionKey });
    } catch (e) { console.log('[OpenClaw] subscribe warn:', e.message); }

    // 4. รับ streaming events จาก agent
    let runId = null;
    ws.on('oc-event', (f) => {
        const event   = f.event || '';
        const payload = f.payload || {};

        // === event: "chat" (หลัก) ===
        if (event === 'chat') {
            const state = payload.state;
            const msg   = payload.message;

            // final = คำตอบสมบูรณ์ (ใช้เฉพาะ final ป้องกัน duplicate)
            if (state === 'final' && msg?.content) {
                const parts   = Array.isArray(msg.content) ? msg.content : [];
                const fullTxt = parts.filter(p => p.type === 'text').map(p => p.text).join('').trim();
                if (fullTxt) return finish(true, fullTxt, { sessionKey });
            }
            return;
        }

        // === event: "agent" stream:"assistant" (fallback) ===
        if (event === 'agent' && payload.stream === 'assistant') {
            const text = payload.data?.text ?? payload.data?.delta ?? null;
            if (text) chunks.push(String(text));
            return;
        }

        // === lifecycle end ===
        if (event === 'agent' && payload.stream === 'lifecycle' && payload.data?.phase === 'end') {
            const accumulated = chunks.join('').trim();
            if (accumulated && !replied) finish(true, accumulated, { sessionKey });
        }
    });

    ws.on('close', () => {
        const full = chunks.join('').trim();
        if (full)         finish(true, full, { sessionKey });
        else if (!replied) finish(false, 'OpenClaw ปิดการเชื่อมต่อโดยไม่มีคำตอบ');
    });

    // 5. ส่ง message ด้วย chat.send
    try {
        const result = await request('chat.send', {
            sessionKey,
            idempotencyKey: randomUUID(),
            message:        message.trim(),
        });

        // chat.send ตอบ { runId, status: 'started' }
        // agent กำลัง run → รอ events ผ่าน sessions.messages.subscribe
        runId = result?.runId ?? null;
        console.log('[OpenClaw] chat.send started, runId:', runId);

        // ถ้า result มี content ตอบทันที
        const text = result?.message?.content ?? result?.content ?? result?.text ?? null;
        if (text) finish(true, String(text).trim(), { sessionKey });

    } catch (err) {
        console.error('[OpenClaw chat.send]', err.message);
        if (!replied) finish(false, 'ส่งข้อความไม่ได้: ' + err.message);
    }
});

module.exports = router;
