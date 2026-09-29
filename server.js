require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Məlumat mənbəyi: qr-checkin-system Telegram bildirişi ilə eyni anda bu fayla yazır
const EVENTS_FILE = process.env.EVENTS_FILE || path.join(__dirname, '..', 'qr-checkin-system', 'data', 'events.jsonl');

function readEvents() {
    try {
        if (!fs.existsSync(EVENTS_FILE)) return [];
        const content = fs.readFileSync(EVENTS_FILE, 'utf8').trim();
        if (!content) return [];
        return content.split('\n')
            .map(line => { try { return JSON.parse(line); } catch { return null; } })
            .filter(Boolean);
    } catch (err) {
        console.error('Hadisə faylı oxunmadı:', err.message);
        return [];
    }
}

// Hadisələr (tarix filtri: ?date=DD.MM.YYYY, məs: 29.09.2026)
app.get('/api/events', (req, res) => {
    let events = readEvents();
    if (req.query.date) {
        events = events.filter(e => e.date === req.query.date);
    }
    res.json({ success: true, events });
});

// Qeyd olan günlərin siyahısı (tarix seçimi üçün)
app.get('/api/days', (req, res) => {
    const map = {};
    for (const e of readEvents()) {
        if (e.date) map[e.date] = (map[e.date] || 0) + 1;
    }
    const days = Object.entries(map)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => {
            const key = s => s.split('.').reverse().join('-');
            return key(b.date).localeCompare(key(a.date));
        });
    res.json({ success: true, days });
});

// Məlumat mənbəyi haqqında məlumat (fayl tapılmasa dashboard xəbərdarlıq göstərir)
app.get('/api/meta', (req, res) => {
    const exists = fs.existsSync(EVENTS_FILE);
    res.json({
        success: true,
        file: EVENTS_FILE,
        exists,
        totalEvents: exists ? readEvents().length : 0
    });
});

// Köhnə layihədən öyrəşilmiş /dashboard ünvanı da işləsin
app.get('/dashboard', (req, res) => res.redirect('/'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`📊 İşçi İzləmə Paneli: http://localhost:${PORT}`);
    console.log(`📁 Məlumat faylı: ${EVENTS_FILE}`);
    if (!fs.existsSync(EVENTS_FILE)) {
        console.warn('⚠️  Məlumat faylı hələ yoxdur — qr-checkin-system işə salınıb ilk giriş edildikdə yaranacaq.');
    }
});
