import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const CLUBS_DIR = path.join(DATA_DIR, 'clubs');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CLUBS_DIR)) fs.mkdirSync(CLUBS_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());

// Global clubs registry
const CLUBS_FILE = path.join(DATA_DIR, 'clubs.json');

const ADMIN_CREDENTIALS = {
  username: "admin1",
  password: "admin",
  token: "billiard_super_admin_secret_token_2026"
};

function getClubs() {
  if (!fs.existsSync(CLUBS_FILE)) {
    const initialClubs = [
      {
        id: "club_imperia",
        name: "Бильярдный Клуб «Империя»",
        pin: "1111",
        currency: "₽",
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(CLUBS_FILE, JSON.stringify(initialClubs, null, 2), 'utf-8');
    return initialClubs;
  }
  try {
    return JSON.parse(fs.readFileSync(CLUBS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveClubs(clubs) {
  fs.writeFileSync(CLUBS_FILE, JSON.stringify(clubs, null, 2), 'utf-8');
}

function getDefaultTablesForClub(clubName) {
  return [
    {
      id: "table_1",
      name: "Стол 1 — Русский бильярд (12 футов)",
      category: "russian",
      hourlyRate: 400,
      status: "available",
      currentSession: null,
      createdAt: new Date().toISOString()
    },
    {
      id: "table_2",
      name: "Стол 2 — Русский бильярд (10 футов)",
      category: "russian",
      hourlyRate: 350,
      status: "available",
      currentSession: null,
      createdAt: new Date().toISOString()
    },
    {
      id: "table_3",
      name: "Стол 3 — Американский пул",
      category: "pool",
      hourlyRate: 300,
      status: "available",
      currentSession: null,
      createdAt: new Date().toISOString()
    },
    {
      id: "table_4",
      name: "VIP Зал — Снукер & Lounge",
      category: "vip",
      hourlyRate: 600,
      status: "available",
      currentSession: null,
      createdAt: new Date().toISOString()
    },
    {
      id: "table_5",
      name: "PlayStation 5 — Зона 1",
      category: "playstation",
      hourlyRate: 250,
      status: "available",
      currentSession: null,
      createdAt: new Date().toISOString()
    }
  ];
}

const defaultBar = [
  { id: "bar_1", name: "Чайник черного чая с лимоном", category: "drinks", price: 150 },
  { id: "bar_2", name: "Чайник зеленого чая с жасмином", category: "drinks", price: 150 },
  { id: "bar_3", name: "Кока-Кола 0.5л", category: "drinks", price: 120 },
  { id: "bar_4", name: "Вода минеральная / без газа 0.5л", category: "drinks", price: 70 },
  { id: "bar_5", name: "Энергетик Red Bull 0.25л", category: "drinks", price: 220 },
  { id: "bar_6", name: "Кофе Американо / Эспрессо", category: "drinks", price: 140 },
  { id: "bar_7", name: "Фисташки соленые (порция)", category: "snacks", price: 180 },
  { id: "bar_8", name: "Чипсы Lays", category: "snacks", price: 120 },
  { id: "bar_9", name: "Сэндвич фирменный", category: "kitchen", price: 230 },
  { id: "bar_10", name: "Кальян классический", category: "hookah", price: 800 }
];

function ensureClubDirectory(clubId, clubName, currency = "₽") {
  const dir = path.join(CLUBS_DIR, clubId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tablesFile = path.join(dir, 'tables.json');
  if (!fs.existsSync(tablesFile)) {
    fs.writeFileSync(tablesFile, JSON.stringify(getDefaultTablesForClub(clubName), null, 2), 'utf-8');
  }

  const barFile = path.join(dir, 'bar.json');
  if (!fs.existsSync(barFile)) {
    fs.writeFileSync(barFile, JSON.stringify(defaultBar, null, 2), 'utf-8');
  }

  const settingsFile = path.join(dir, 'settings.json');
  if (!fs.existsSync(settingsFile)) {
    fs.writeFileSync(settingsFile, JSON.stringify({
      clubName: clubName || "Бильярдный Клуб",
      currency: currency || "₽",
      roundingMinutes: 1,
      minMinutes: 15,
      autoSound: true
    }, null, 2), 'utf-8');
  }

  const sessionsFile = path.join(dir, 'sessions.json');
  if (!fs.existsSync(sessionsFile)) {
    fs.writeFileSync(sessionsFile, JSON.stringify([], null, 2), 'utf-8');
  }

  return dir;
}

// Ensure default club
const initialClubs = getClubs();
initialClubs.forEach(c => ensureClubDirectory(c.id, c.name, c.currency));

function readClubData(clubDir, file, defaultData) {
  const filePath = path.join(clubDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return defaultData;
  }
}

function writeClubData(clubDir, file, data) {
  const filePath = path.join(clubDir, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Admin Authentication Middleware
function requireAdminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_CREDENTIALS.token) {
    return res.status(401).json({ error: "Доступ запрещен. Неверная авторизация администратора." });
  }
  next();
}

// Client Multi-tenant PIN Middleware
function requireClubAuth(req, res, next) {
  const pin = req.headers['x-club-pin'] || req.query.pin;
  if (!pin) {
    return res.status(401).json({ error: "Требуется 4-значный PIN-код клуба для входа" });
  }

  const clubs = getClubs();
  const club = clubs.find(c => String(c.pin).trim() === String(pin).trim());

  if (!club) {
    return res.status(401).json({ error: "Неверный PIN-код. Проверьте код клуба или обратитесь к администратору." });
  }

  req.club = club;
  req.clubDir = ensureClubDirectory(club.id, club.name, club.currency);
  next();
}

// ==========================================
// ADMIN API (FOR YOU ONLY: admin1 / admin)
// ==========================================

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    return res.json({
      success: true,
      token: ADMIN_CREDENTIALS.token,
      user: { username: "admin1" }
    });
  }
  return res.status(401).json({ error: "Неверный логин или пароль администратора" });
});

// Admin: Get all clubs
app.get('/api/admin/clubs', requireAdminAuth, (req, res) => {
  const clubs = getClubs();
  // enrich with table count
  const list = clubs.map(c => {
    const clubDir = path.join(CLUBS_DIR, c.id);
    let tablesCount = 0;
    try {
      const tables = readClubData(clubDir, 'tables.json', []);
      tablesCount = tables.length;
    } catch (e) {}
    return {
      ...c,
      tablesCount
    };
  });
  res.json(list);
});

// Admin: Create new club with PIN
app.post('/api/admin/clubs', requireAdminAuth, (req, res) => {
  const { name, pin, currency = "₽", ownerPhone = "" } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Укажите название бильярдного клуба" });
  }

  const cleanedPin = String(pin).trim();
  if (!/^\d{4}$/.test(cleanedPin)) {
    return res.status(400).json({ error: "PIN-код должен состоять ровно из 4 цифр (например 1234)" });
  }

  const clubs = getClubs();
  if (clubs.some(c => c.pin === cleanedPin)) {
    return res.status(400).json({ error: "Этот 4-значный PIN-код уже занят другим клубом" });
  }

  const clubId = `club_${Date.now()}`;
  const newClub = {
    id: clubId,
    name: name.trim(),
    pin: cleanedPin,
    currency: currency || "₽",
    ownerPhone: ownerPhone?.trim() || "",
    createdAt: new Date().toISOString()
  };

  clubs.push(newClub);
  saveClubs(clubs);

  ensureClubDirectory(clubId, newClub.name, newClub.currency);

  res.json({ success: true, club: newClub });
});

// Admin: Update club PIN or details
app.put('/api/admin/clubs/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { name, pin, currency } = req.body;

  const clubs = getClubs();
  const club = clubs.find(c => c.id === id);
  if (!club) return res.status(404).json({ error: "Клуб не найден" });

  if (pin) {
    const cleanedPin = String(pin).trim();
    if (!/^\d{4}$/.test(cleanedPin)) {
      return res.status(400).json({ error: "PIN-код должен состоять ровно из 4 цифр" });
    }
    if (clubs.some(c => c.id !== id && c.pin === cleanedPin)) {
      return res.status(400).json({ error: "Этот PIN-код уже занят другим заведением" });
    }
    club.pin = cleanedPin;
  }

  if (name) club.name = name.trim();
  if (currency) club.currency = currency;

  saveClubs(clubs);
  res.json({ success: true, club });
});

// Admin: Delete club
app.delete('/api/admin/clubs/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const clubs = getClubs();

  if (clubs.length <= 1) {
    return res.status(400).json({ error: "Нельзя удалить последний оставшийся клуб" });
  }

  const filtered = clubs.filter(c => c.id !== id);
  saveClubs(filtered);

  // Optional: remove folder
  try {
    const clubDir = path.join(CLUBS_DIR, id);
    if (fs.existsSync(clubDir)) {
      fs.rmSync(clubDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.error("Error deleting club dir", e);
  }

  res.json({ success: true });
});

// ==========================================
// CLIENT AUTH (PURE 4-DIGIT PIN, NO OTHER CLUBS VISIBLE)
// ==========================================
app.post('/api/auth/pin-login', (req, res) => {
  const { pin } = req.body;
  if (!pin || String(pin).trim().length !== 4) {
    return res.status(400).json({ error: "Введите корректный 4-значный PIN-код" });
  }

  const clubs = getClubs();
  const club = clubs.find(c => String(c.pin).trim() === String(pin).trim());

  if (!club) {
    return res.status(401).json({ error: "Неверный PIN-код. Доступ запрещен." });
  }

  ensureClubDirectory(club.id, club.name, club.currency);

  res.json({
    success: true,
    club: {
      id: club.id,
      name: club.name,
      currency: club.currency,
      pin: club.pin
    }
  });
});

// ==========================================
// ISOLATED CLIENT CLUB OPERATIONS (PROTECTED BY PIN)
// ==========================================
app.use('/api', requireClubAuth);

// Settings
app.get('/api/settings', (req, res) => {
  const settings = readClubData(req.clubDir, 'settings.json', {
    clubName: req.club.name,
    currency: req.club.currency || "₽",
    roundingMinutes: 1,
    minMinutes: 15,
    autoSound: true
  });
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const current = readClubData(req.clubDir, 'settings.json', {
    clubName: req.club.name,
    currency: req.club.currency || "₽",
    roundingMinutes: 1,
    minMinutes: 15,
    autoSound: true
  });
  const updated = { ...current, ...req.body };
  writeClubData(req.clubDir, 'settings.json', updated);

  if (req.body.clubName || req.body.currency) {
    const clubs = getClubs();
    const c = clubs.find(cl => cl.id === req.club.id);
    if (c) {
      if (req.body.clubName) c.name = req.body.clubName;
      if (req.body.currency) c.currency = req.body.currency;
      saveClubs(clubs);
    }
  }

  res.json(updated);
});

// Tables
app.get('/api/tables', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  res.json(tables);
});

app.post('/api/tables', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  const { name, category, hourlyRate } = req.body;
  
  if (!name || hourlyRate === undefined) {
    return res.status(400).json({ error: "Укажите название и цену за 1 час" });
  }

  const newTable = {
    id: `table_${Date.now()}`,
    name,
    category: category || "russian",
    hourlyRate: Number(hourlyRate) || 300,
    status: "available",
    currentSession: null,
    createdAt: new Date().toISOString()
  };

  tables.push(newTable);
  writeClubData(req.clubDir, 'tables.json', tables);
  res.json(newTable);
});

app.put('/api/tables/:id', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  const { id } = req.params;
  const idx = tables.findIndex(t => t.id === id);

  if (idx === -1) return res.status(404).json({ error: "Стол не найден" });

  const { name, category, hourlyRate } = req.body;
  if (name !== undefined) tables[idx].name = name;
  if (category !== undefined) tables[idx].category = category;
  if (hourlyRate !== undefined) tables[idx].hourlyRate = Number(hourlyRate);

  if (tables[idx].currentSession && hourlyRate !== undefined) {
    tables[idx].currentSession.hourlyRate = Number(hourlyRate);
  }

  writeClubData(req.clubDir, 'tables.json', tables);
  res.json(tables[idx]);
});

app.delete('/api/tables/:id', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  const { id } = req.params;
  const table = tables.find(t => t.id === id);

  if (!table) return res.status(404).json({ error: "Стол не найден" });

  if (table.status !== 'available') {
    return res.status(400).json({ error: "Нельзя удалить стол во время активной игры. Сначала завершите сессию." });
  }

  const filtered = tables.filter(t => t.id !== id);
  writeClubData(req.clubDir, 'tables.json', filtered);
  res.json({ success: true, id });
});

// Bar
app.get('/api/bar', (req, res) => {
  const bar = readClubData(req.clubDir, 'bar.json', defaultBar);
  res.json(bar);
});

app.post('/api/bar', (req, res) => {
  const bar = readClubData(req.clubDir, 'bar.json', defaultBar);
  const { name, category, price } = req.body;
  
  if (!name || price === undefined) {
    return res.status(400).json({ error: "Укажите название и цену" });
  }

  const newItem = {
    id: `bar_${Date.now()}`,
    name,
    category: category || "drinks",
    price: Number(price) || 0
  };

  bar.push(newItem);
  writeClubData(req.clubDir, 'bar.json', bar);
  res.json(newItem);
});

app.put('/api/bar/:id', (req, res) => {
  const bar = readClubData(req.clubDir, 'bar.json', defaultBar);
  const { id } = req.params;
  const idx = bar.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ error: "Товар не найден" });

  const { name, category, price } = req.body;
  if (name !== undefined) bar[idx].name = name;
  if (category !== undefined) bar[idx].category = category;
  if (price !== undefined) bar[idx].price = Number(price);

  writeClubData(req.clubDir, 'bar.json', bar);
  res.json(bar[idx]);
});

app.delete('/api/bar/:id', (req, res) => {
  const bar = readClubData(req.clubDir, 'bar.json', defaultBar);
  const filtered = bar.filter(b => b.id !== req.params.id);
  writeClubData(req.clubDir, 'bar.json', filtered);
  res.json({ success: true });
});

// Start session
app.post('/api/sessions/start', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  const { tableId, clientName, phone, customHourlyRate, startTime, comment } = req.body;

  const table = tables.find(t => t.id === tableId);
  if (!table) return res.status(404).json({ error: "Стол не найден" });
  if (table.status !== 'available') return res.status(400).json({ error: "Стол уже занят" });

  const sessionStartTime = startTime ? new Date(startTime).toISOString() : new Date().toISOString();
  const rate = customHourlyRate !== undefined && customHourlyRate !== null && !isNaN(customHourlyRate)
    ? Number(customHourlyRate)
    : table.hourlyRate;

  const session = {
    id: `sess_${Date.now()}`,
    tableId: table.id,
    tableName: table.name,
    category: table.category,
    clientName: clientName?.trim() || "Гость",
    phone: phone?.trim() || "",
    hourlyRate: rate,
    startTime: sessionStartTime,
    pausedAt: null,
    totalPausedMs: 0,
    barOrders: [],
    comment: comment?.trim() || ""
  };

  table.status = 'busy';
  table.currentSession = session;

  writeClubData(req.clubDir, 'tables.json', tables);
  res.json({ success: true, table, session });
});

// Pause / Resume
app.post('/api/sessions/pause', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  const { tableId } = req.body;

  const table = tables.find(t => t.id === tableId);
  if (!table || !table.currentSession) return res.status(404).json({ error: "Активная сессия не найдена" });

  const session = table.currentSession;
  const now = Date.now();

  if (table.status === 'busy') {
    table.status = 'paused';
    session.pausedAt = new Date().toISOString();
  } else if (table.status === 'paused') {
    table.status = 'busy';
    if (session.pausedAt) {
      const pausedDuration = now - new Date(session.pausedAt).getTime();
      session.totalPausedMs = (session.totalPausedMs || 0) + Math.max(0, pausedDuration);
      session.pausedAt = null;
    }
  }

  writeClubData(req.clubDir, 'tables.json', tables);
  res.json({ success: true, table });
});

// Add Bar item
app.post('/api/sessions/add-bar', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  const { tableId, itemId, name, price, qty = 1 } = req.body;

  const table = tables.find(t => t.id === tableId);
  if (!table || !table.currentSession) return res.status(404).json({ error: "Активная сессия не найдена" });

  if (!table.currentSession.barOrders) table.currentSession.barOrders = [];

  const existing = table.currentSession.barOrders.find(o => o.itemId === itemId && o.name === name);
  if (existing) {
    existing.qty += Number(qty);
  } else {
    table.currentSession.barOrders.push({
      itemId,
      name,
      price: Number(price),
      qty: Number(qty)
    });
  }

  writeClubData(req.clubDir, 'tables.json', tables);
  res.json({ success: true, table });
});

// Update Bar item in session
app.post('/api/sessions/update-bar', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  const { tableId, itemIndex, qty } = req.body;

  const table = tables.find(t => t.id === tableId);
  if (!table || !table.currentSession || !table.currentSession.barOrders) {
    return res.status(404).json({ error: "Сессия или заказ не найден" });
  }

  if (qty <= 0) {
    table.currentSession.barOrders.splice(itemIndex, 1);
  } else {
    table.currentSession.barOrders[itemIndex].qty = Number(qty);
  }

  writeClubData(req.clubDir, 'tables.json', tables);
  res.json({ success: true, table });
});

// Transfer session
app.post('/api/sessions/transfer', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  const { fromTableId, toTableId } = req.body;

  const sourceTable = tables.find(t => t.id === fromTableId);
  const targetTable = tables.find(t => t.id === toTableId);

  if (!sourceTable || !sourceTable.currentSession) return res.status(400).json({ error: "Исходный стол не занят" });
  if (!targetTable || targetTable.status !== 'available') return res.status(400).json({ error: "Целевой стол занят или недоступен" });

  const session = sourceTable.currentSession;
  session.tableId = targetTable.id;
  session.tableName = targetTable.name;
  session.category = targetTable.category;
  session.hourlyRate = targetTable.hourlyRate;

  targetTable.status = sourceTable.status;
  targetTable.currentSession = session;

  sourceTable.status = 'available';
  sourceTable.currentSession = null;

  writeClubData(req.clubDir, 'tables.json', tables);
  res.json({ success: true, tables });
});

// Stop session & Calculate
app.post('/api/sessions/stop', (req, res) => {
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  const sessions = readClubData(req.clubDir, 'sessions.json', []);
  const settings = readClubData(req.clubDir, 'settings.json', { minMinutes: 15, roundingMinutes: 1 });

  const {
    tableId,
    endTime,
    discount = 0,
    paymentMethod = 'cash',
    cashPaid = 0,
    cardPaid = 0,
    comment = ''
  } = req.body;

  const table = tables.find(t => t.id === tableId);
  if (!table || !table.currentSession) return res.status(404).json({ error: "Активная сессия не найдена" });

  const session = table.currentSession;
  const end = endTime ? new Date(endTime) : new Date();
  const start = new Date(session.startTime);

  let totalElapsedMs = end.getTime() - start.getTime();
  let pausedMs = session.totalPausedMs || 0;
  if (table.status === 'paused' && session.pausedAt) {
    pausedMs += Math.max(0, end.getTime() - new Date(session.pausedAt).getTime());
  }
  const effectivePlayMs = Math.max(0, totalElapsedMs - pausedMs);
  const rawDurationMinutes = effectivePlayMs / 60000;

  const minMin = settings.minMinutes || 0;
  let billedMinutes = Math.max(minMin, rawDurationMinutes);

  const step = settings.roundingMinutes || 1;
  if (step > 1) {
    billedMinutes = Math.ceil(billedMinutes / step) * step;
  }

  const hoursFraction = billedMinutes / 60;
  const tableCost = Math.round(hoursFraction * session.hourlyRate);

  const barOrders = session.barOrders || [];
  const barCost = barOrders.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const subTotal = tableCost + barCost;
  const discountAmount = Math.min(subTotal, Math.max(0, Number(discount) || 0));
  const finalTotal = Math.max(0, subTotal - discountAmount);

  const completedSession = {
    id: session.id,
    tableId: table.id,
    tableName: table.name,
    category: table.category,
    clientName: session.clientName,
    phone: session.phone,
    hourlyRate: session.hourlyRate,
    startTime: session.startTime,
    endTime: end.toISOString(),
    rawDurationMinutes: Math.round(rawDurationMinutes),
    billedMinutes: Math.round(billedMinutes),
    tableCost,
    barCost,
    barOrders,
    discount: discountAmount,
    totalAmount: finalTotal,
    paymentMethod,
    cashPaid: paymentMethod === 'cash' ? finalTotal : (paymentMethod === 'combined' ? Number(cashPaid) : 0),
    cardPaid: paymentMethod === 'card' ? finalTotal : (paymentMethod === 'combined' ? Number(cardPaid) : 0),
    comment: comment || session.comment || "",
    completedAt: new Date().toISOString()
  };

  sessions.unshift(completedSession);
  writeClubData(req.clubDir, 'sessions.json', sessions);

  table.status = 'available';
  table.currentSession = null;
  writeClubData(req.clubDir, 'tables.json', tables);

  res.json({
    success: true,
    session: completedSession,
    table
  });
});

// Daily Report
app.get('/api/reports/daily', (req, res) => {
  const sessions = readClubData(req.clubDir, 'sessions.json', []);
  const tables = readClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  
  const targetDateStr = req.query.date || new Date().toISOString().split('T')[0];

  const daysSessions = sessions.filter(s => {
    const sessionDate = s.endTime ? s.endTime.split('T')[0] : s.completedAt.split('T')[0];
    return sessionDate === targetDateStr;
  });

  let totalRevenue = 0;
  let totalTableRevenue = 0;
  let totalBarRevenue = 0;
  let totalCash = 0;
  let totalCard = 0;
  let totalTransfer = 0;
  let totalMinutesPlayed = 0;

  const tableStats = {};
  tables.forEach(t => {
    tableStats[t.id] = {
      tableId: t.id,
      tableName: t.name,
      category: t.category,
      hourlyRate: t.hourlyRate,
      sessionsCount: 0,
      totalMinutes: 0,
      tableRevenue: 0,
      barRevenue: 0,
      totalRevenue: 0
    };
  });

  daysSessions.forEach(s => {
    totalRevenue += s.totalAmount || 0;
    totalTableRevenue += s.tableCost || 0;
    totalBarRevenue += s.barCost || 0;
    totalMinutesPlayed += s.billedMinutes || s.rawDurationMinutes || 0;

    if (s.paymentMethod === 'cash') totalCash += s.totalAmount || 0;
    else if (s.paymentMethod === 'card') totalCard += s.totalAmount || 0;
    else if (s.paymentMethod === 'transfer') totalTransfer += s.totalAmount || 0;
    else if (s.paymentMethod === 'combined') {
      totalCash += s.cashPaid || 0;
      totalCard += s.cardPaid || 0;
    }

    if (!tableStats[s.tableId]) {
      tableStats[s.tableId] = {
        tableId: s.tableId,
        tableName: s.tableName,
        category: s.category || 'other',
        hourlyRate: s.hourlyRate || 0,
        sessionsCount: 0,
        totalMinutes: 0,
        tableRevenue: 0,
        barRevenue: 0,
        totalRevenue: 0
      };
    }

    const t = tableStats[s.tableId];
    t.sessionsCount += 1;
    t.totalMinutes += (s.billedMinutes || s.rawDurationMinutes || 0);
    t.tableRevenue += (s.tableCost || 0);
    t.barRevenue += (s.barCost || 0);
    t.totalRevenue += (s.totalAmount || 0);
  });

  res.json({
    date: targetDateStr,
    summary: {
      totalRevenue,
      totalTableRevenue,
      totalBarRevenue,
      totalCash,
      totalCard,
      totalTransfer,
      totalMinutesPlayed,
      totalHoursPlayed: (totalMinutesPlayed / 60).toFixed(1),
      sessionsCount: daysSessions.length
    },
    tableStats: Object.values(tableStats),
    sessions: daysSessions
  });
});

// All Sessions History
app.get('/api/sessions/history', (req, res) => {
  const sessions = readClubData(req.clubDir, 'sessions.json', []);
  const { tableId, search, date } = req.query;

  let filtered = sessions;

  if (tableId) filtered = filtered.filter(s => s.tableId === tableId);
  if (date) {
    filtered = filtered.filter(s => {
      const sDate = s.endTime ? s.endTime.split('T')[0] : s.completedAt.split('T')[0];
      return sDate === date;
    });
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s => 
      (s.clientName && s.clientName.toLowerCase().includes(q)) ||
      (s.tableName && s.tableName.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  }

  res.json(filtered);
});

// Void / Cancel Session
app.delete('/api/sessions/history/:id', (req, res) => {
  const sessions = readClubData(req.clubDir, 'sessions.json', []);
  const filtered = sessions.filter(s => s.id !== req.params.id);
  writeClubData(req.clubDir, 'sessions.json', filtered);
  res.json({ success: true });
});

// Reset Club data
app.post('/api/system/reset-demo', (req, res) => {
  writeClubData(req.clubDir, 'tables.json', getDefaultTablesForClub(req.club.name));
  writeClubData(req.clubDir, 'bar.json', defaultBar);
  writeClubData(req.clubDir, 'settings.json', {
    clubName: req.club.name,
    currency: req.club.currency || "₽",
    roundingMinutes: 1,
    minMinutes: 15,
    autoSound: true
  });
  writeClubData(req.clubDir, 'sessions.json', []);
  res.json({ success: true, message: "Данные текущего клуба сброшены" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Billiard Multi-Tenant CRM API server is running on http://localhost:${PORT}`);
});
