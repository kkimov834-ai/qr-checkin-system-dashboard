require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Hadisələr faylı: EVENTS_FILE ilə əsas sistemdəki fayla yol göstərmək olar
const EVENTS_FILE = process.env.EVENTS_FILE || path.join(__dirname, 'data', 'events.jsonl');

if (!fs.existsSync(EVENTS_FILE)) {
    fs.mkdirSync(path.dirname(EVENTS_FILE), { recursive: true });
    fs.writeFileSync(EVENTS_FILE, '');
}

function readEvents() {
    const content = fs.readFileSync(EVENTS_FILE, 'utf8').trim();
    if (!content) return [];
    return content.split('\n')
        .map(line => { try { return JSON.parse(line); } catch { return null; } })
        .filter(Boolean);
}

// Dashboard üçün hadisələr (tarix filtri: ?date=DD.MM.YYYY)
app.get('/api/events', (req, res) => {
    let events = readEvents();
    if (req.query.date) {
        events = events.filter(e => e.date === req.query.date);
    }
    res.json({ success: true, events });
});

app.get('/dashboard', (req, res) => res.redirect('/dashboard.html' + req.url.slice('/dashboard'.length)));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Dashboard serveri ${PORT} portunda çalışır...`);
});
