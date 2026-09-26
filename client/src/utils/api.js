// Smart Hybrid API Client:
// 1. Tries to communicate with the Node.js Express backend (localhost or remote server).
// 2. If hosted as static site (Netlify/Vercel) without a running backend, automatically
//    falls back to a full-featured client-side storage engine (LocalStorage).
// This guarantees that the app NEVER breaks with "Ошибка соединения с сервером" on Netlify!

const API_BASE = import.meta.env.VITE_API_URL || '';

// --- LocalStorage Storage Engine Helpers ---
const DEFAULT_TABLES = [
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

const DEFAULT_BAR = [
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

function getStored(key, defaultVal) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

// Local Clubs
function getLocalClubs() {
  return getStored('billiard_clubs_db', [
    {
      id: "club_imperia",
      name: "Бильярдный Клуб «Империя»",
      pin: "1111",
      currency: "₽",
      createdAt: new Date().toISOString()
    }
  ]);
}

function saveLocalClubs(clubs) {
  setStored('billiard_clubs_db', clubs);
}

function getLocalClubData(pin, type, defaultVal) {
  return getStored(`billiard_${type}_${pin}`, defaultVal);
}

function setLocalClubData(pin, type, val) {
  setStored(`billiard_${type}_${pin}`, val);
}

// API Implementation
export const api = {
  // --- AUTH ---
  async pinLogin(pin) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/pin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 400 || res.status === 401) {
        return await res.json();
      }
    } catch (e) {
      // Backend unavailable or 404 on Netlify
    }

    // Local Fallback:
    const clubs = getLocalClubs();
    const club = clubs.find(c => String(c.pin).trim() === String(pin).trim());
    if (club) {
      return { success: true, club };
    }
    return { success: false, error: 'Неверный PIN-код. Проверьте код клуба.' };
  },

  async adminLogin(username, password) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) return await res.json();
      if (res.status === 401) return await res.json();
    } catch (e) {}

    // Local Fallback:
    if (username === 'admin1' && password === 'admin') {
      return {
        success: true,
        token: 'billiard_admin_local_token',
        user: { username: 'admin1' }
      };
    }
    return { success: false, error: 'Неверный логин или пароль администратора' };
  },

  // --- ADMIN CLUBS ---
  async getAdminClubs(token) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/clubs`, {
        headers: { 'X-Admin-Token': token }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const clubs = getLocalClubs();
    return clubs.map(c => {
      const tables = getLocalClubData(c.pin, 'tables', DEFAULT_TABLES);
      return { ...c, tablesCount: tables.length };
    });
  },

  async createAdminClub(token, data) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/clubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
      if (res.status === 400) return await res.json();
    } catch (e) {}

    // Local Fallback:
    const clubs = getLocalClubs();
    const cleanedPin = String(data.pin).trim();
    if (clubs.some(c => c.pin === cleanedPin)) {
      return { success: false, error: 'Этот 4-значный PIN-код уже занят' };
    }

    const newClub = {
      id: `club_${Date.now()}`,
      name: data.name.trim(),
      pin: cleanedPin,
      currency: data.currency || '₽',
      createdAt: new Date().toISOString()
    };
    clubs.push(newClub);
    saveLocalClubs(clubs);
    return { success: true, club: newClub };
  },

  async updateAdminClub(token, id, data) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/clubs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
      if (res.status === 400 || res.status === 404) return await res.json();
    } catch (e) {}

    const clubs = getLocalClubs();
    const club = clubs.find(c => c.id === id);
    if (!club) return { success: false, error: 'Клуб не найден' };

    if (data.pin) {
      const cleanedPin = String(data.pin).trim();
      if (clubs.some(c => c.id !== id && c.pin === cleanedPin)) {
        return { success: false, error: 'Этот PIN-код уже занят другим заведением' };
      }
      club.pin = cleanedPin;
    }
    if (data.name) club.name = data.name.trim();
    if (data.currency) club.currency = data.currency;

    saveLocalClubs(clubs);
    return { success: true, club };
  },

  async deleteAdminClub(token, id) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/clubs/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': token }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const clubs = getLocalClubs();
    if (clubs.length <= 1) return { success: false, error: 'Нельзя удалить единственный клуб' };
    const filtered = clubs.filter(c => c.id !== id);
    saveLocalClubs(filtered);
    return { success: true };
  },

  // --- TABLES ---
  async getTables(pin) {
    try {
      const res = await fetch(`${API_BASE}/api/tables`, {
        headers: { 'X-Club-Pin': pin }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return getLocalClubData(pin, 'tables', DEFAULT_TABLES);
  },

  async saveTable(pin, tableData) {
    const isEditing = Boolean(tableData.id);
    const url = isEditing ? `${API_BASE}/api/tables/${tableData.id}` : `${API_BASE}/api/tables`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Club-Pin': pin },
        body: JSON.stringify(tableData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Local Fallback:
    const tables = getLocalClubData(pin, 'tables', DEFAULT_TABLES);
    if (isEditing) {
      const idx = tables.findIndex(t => t.id === tableData.id);
      if (idx !== -1) {
        tables[idx] = { ...tables[idx], ...tableData };
        if (tables[idx].currentSession) {
          tables[idx].currentSession.hourlyRate = Number(tableData.hourlyRate);
        }
      }
    } else {
      tables.push({
        id: `table_${Date.now()}`,
        name: tableData.name,
        category: tableData.category || 'russian',
        hourlyRate: Number(tableData.hourlyRate) || 300,
        status: 'available',
        currentSession: null,
        createdAt: new Date().toISOString()
      });
    }
    setLocalClubData(pin, 'tables', tables);
    return { success: true };
  },

  async deleteTable(pin, id) {
    try {
      const res = await fetch(`${API_BASE}/api/tables/${id}`, {
        method: 'DELETE',
        headers: { 'X-Club-Pin': pin }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const tables = getLocalClubData(pin, 'tables', DEFAULT_TABLES);
    const filtered = tables.filter(t => t.id !== id);
    setLocalClubData(pin, 'tables', filtered);
    return { success: true };
  },

  // --- SESSIONS ---
  async startSession(pin, payload) {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Club-Pin': pin },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const tables = getLocalClubData(pin, 'tables', DEFAULT_TABLES);
    const table = tables.find(t => t.id === payload.tableId);
    if (!table) return { success: false, error: 'Стол не найден' };

    const startTime = payload.startTime ? new Date(payload.startTime).toISOString() : new Date().toISOString();
    const rate = Number(payload.customHourlyRate) || table.hourlyRate;

    table.status = 'busy';
    table.currentSession = {
      id: `sess_${Date.now()}`,
      tableId: table.id,
      tableName: table.name,
      category: table.category,
      clientName: payload.clientName?.trim() || 'Гость',
      phone: payload.phone?.trim() || '',
      hourlyRate: rate,
      startTime,
      pausedAt: null,
      totalPausedMs: 0,
      barOrders: [],
      comment: payload.comment?.trim() || ''
    };

    setLocalClubData(pin, 'tables', tables);
    return { success: true, table, session: table.currentSession };
  },

  async pauseSession(pin, tableId) {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Club-Pin': pin },
        body: JSON.stringify({ tableId })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const tables = getLocalClubData(pin, 'tables', DEFAULT_TABLES);
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentSession) return { success: false };

    const session = table.currentSession;
    const now = Date.now();

    if (table.status === 'busy') {
      table.status = 'paused';
      session.pausedAt = new Date().toISOString();
    } else if (table.status === 'paused') {
      table.status = 'busy';
      if (session.pausedAt) {
        const pausedDur = now - new Date(session.pausedAt).getTime();
        session.totalPausedMs = (session.totalPausedMs || 0) + Math.max(0, pausedDur);
        session.pausedAt = null;
      }
    }

    setLocalClubData(pin, 'tables', tables);
    return { success: true, table };
  },

  async addBarOrder(pin, payload) {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/add-bar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Club-Pin': pin },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const tables = getLocalClubData(pin, 'tables', DEFAULT_TABLES);
    const table = tables.find(t => t.id === payload.tableId);
    if (!table || !table.currentSession) return { success: false };

    if (!table.currentSession.barOrders) table.currentSession.barOrders = [];
    const existing = table.currentSession.barOrders.find(o => o.itemId === payload.itemId && o.name === payload.name);
    if (existing) {
      existing.qty += Number(payload.qty || 1);
    } else {
      table.currentSession.barOrders.push({
        itemId: payload.itemId,
        name: payload.name,
        price: Number(payload.price),
        qty: Number(payload.qty || 1)
      });
    }

    setLocalClubData(pin, 'tables', tables);
    return { success: true, table };
  },

  async updateBarOrder(pin, payload) {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/update-bar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Club-Pin': pin },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const tables = getLocalClubData(pin, 'tables', DEFAULT_TABLES);
    const table = tables.find(t => t.id === payload.tableId);
    if (!table || !table.currentSession || !table.currentSession.barOrders) return { success: false };

    if (payload.qty <= 0) {
      table.currentSession.barOrders.splice(payload.itemIndex, 1);
    } else {
      table.currentSession.barOrders[payload.itemIndex].qty = Number(payload.qty);
    }

    setLocalClubData(pin, 'tables', tables);
    return { success: true, table };
  },

  async transferSession(pin, fromTableId, toTableId) {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Club-Pin': pin },
        body: JSON.stringify({ fromTableId, toTableId })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const tables = getLocalClubData(pin, 'tables', DEFAULT_TABLES);
    const sourceTable = tables.find(t => t.id === fromTableId);
    const targetTable = tables.find(t => t.id === toTableId);

    if (!sourceTable || !sourceTable.currentSession) return { success: false, error: 'Исходный стол не занят' };
    if (!targetTable || targetTable.status !== 'available') return { success: false, error: 'Целевой стол занят' };

    const session = sourceTable.currentSession;
    session.tableId = targetTable.id;
    session.tableName = targetTable.name;
    session.category = targetTable.category;
    session.hourlyRate = targetTable.hourlyRate;

    targetTable.status = sourceTable.status;
    targetTable.currentSession = session;

    sourceTable.status = 'available';
    sourceTable.currentSession = null;

    setLocalClubData(pin, 'tables', tables);
    return { success: true, tables };
  },

  async stopSession(pin, payload) {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Club-Pin': pin },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const tables = getLocalClubData(pin, 'tables', DEFAULT_TABLES);
    const sessions = getLocalClubData(pin, 'sessions', []);
    const settings = getLocalClubData(pin, 'settings', { minMinutes: 15, roundingMinutes: 1 });

    const table = tables.find(t => t.id === payload.tableId);
    if (!table || !table.currentSession) return { success: false, error: 'Сессия не найдена' };

    const session = table.currentSession;
    const end = payload.endTime ? new Date(payload.endTime) : new Date();
    const start = new Date(session.startTime);

    let totalElapsedMs = end.getTime() - start.getTime();
    let pausedMs = session.totalPausedMs || 0;
    if (table.status === 'paused' && session.pausedAt) {
      pausedMs += Math.max(0, end.getTime() - new Date(session.pausedAt).getTime());
    }
    const effectiveMs = Math.max(0, totalElapsedMs - pausedMs);
    const rawMins = effectiveMs / 60000;

    let billedMins = Math.max(settings.minMinutes || 0, rawMins);
    const step = settings.roundingMinutes || 1;
    if (step > 1) {
      billedMins = Math.ceil(billedMins / step) * step;
    }

    const tableCost = Math.round((billedMins / 60) * session.hourlyRate);
    const barOrders = session.barOrders || [];
    const barCost = barOrders.reduce((s, it) => s + (it.price * it.qty), 0);
    const subTotal = tableCost + barCost;
    const discount = Math.min(subTotal, Math.max(0, Number(payload.discount) || 0));
    const totalAmount = Math.max(0, subTotal - discount);

    const completed = {
      id: session.id,
      tableId: table.id,
      tableName: table.name,
      category: table.category,
      clientName: session.clientName,
      phone: session.phone,
      hourlyRate: session.hourlyRate,
      startTime: session.startTime,
      endTime: end.toISOString(),
      rawDurationMinutes: Math.round(rawMins),
      billedMinutes: Math.round(billedMins),
      tableCost,
      barCost,
      barOrders,
      discount,
      totalAmount,
      paymentMethod: payload.paymentMethod || 'cash',
      cashPaid: payload.paymentMethod === 'cash' ? totalAmount : Number(payload.cashPaid || 0),
      cardPaid: payload.paymentMethod === 'card' ? totalAmount : Number(payload.cardPaid || 0),
      comment: payload.comment || session.comment || '',
      completedAt: new Date().toISOString()
    };

    sessions.unshift(completed);
    setLocalClubData(pin, 'sessions', sessions);

    table.status = 'available';
    table.currentSession = null;
    setLocalClubData(pin, 'tables', tables);

    return { success: true, session: completed, table };
  },

  // --- REPORTS ---
  async getDailyReport(pin, date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(`${API_BASE}/api/reports/daily?date=${targetDate}`, {
        headers: { 'X-Club-Pin': pin }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const sessions = getLocalClubData(pin, 'sessions', []);
    const tables = getLocalClubData(pin, 'tables', DEFAULT_TABLES);

    const daysSessions = sessions.filter(s => {
      const sDate = s.endTime ? s.endTime.split('T')[0] : s.completedAt.split('T')[0];
      return sDate === targetDate;
    });

    let totalRevenue = 0, totalTableRevenue = 0, totalBarRevenue = 0;
    let totalCash = 0, totalCard = 0, totalTransfer = 0, totalMinutesPlayed = 0;

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
      totalMinutesPlayed += (s.billedMinutes || s.rawDurationMinutes || 0);

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

    return {
      date: targetDate,
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
    };
  },

  // --- HISTORY ---
  async getHistory(pin, search = '', date = '') {
    try {
      let url = `${API_BASE}/api/sessions/history?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (date) url += `date=${encodeURIComponent(date)}&`;
      const res = await fetch(url, { headers: { 'X-Club-Pin': pin } });
      if (res.ok) return await res.json();
    } catch (e) {}

    let sessions = getLocalClubData(pin, 'sessions', []);
    if (date) {
      sessions = sessions.filter(s => {
        const sDate = s.endTime ? s.endTime.split('T')[0] : s.completedAt.split('T')[0];
        return sDate === date;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      sessions = sessions.filter(s =>
        (s.clientName && s.clientName.toLowerCase().includes(q)) ||
        (s.tableName && s.tableName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
    }
    return sessions;
  },

  async deleteHistory(pin, id) {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/history/${id}`, {
        method: 'DELETE',
        headers: { 'X-Club-Pin': pin }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const sessions = getLocalClubData(pin, 'sessions', []);
    const filtered = sessions.filter(s => s.id !== id);
    setLocalClubData(pin, 'sessions', filtered);
    return { success: true };
  },

  // --- BAR ---
  async getBar(pin) {
    try {
      const res = await fetch(`${API_BASE}/api/bar`, { headers: { 'X-Club-Pin': pin } });
      if (res.ok) return await res.json();
    } catch (e) {}

    return getLocalClubData(pin, 'bar', DEFAULT_BAR);
  },

  async createBarItem(pin, data) {
    try {
      const res = await fetch(`${API_BASE}/api/bar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Club-Pin': pin },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const bar = getLocalClubData(pin, 'bar', DEFAULT_BAR);
    const newItem = {
      id: `bar_${Date.now()}`,
      name: data.name,
      category: data.category || 'drinks',
      price: Number(data.price) || 0
    };
    bar.push(newItem);
    setLocalClubData(pin, 'bar', bar);
    return newItem;
  },

  async deleteBarItem(pin, id) {
    try {
      const res = await fetch(`${API_BASE}/api/bar/${id}`, {
        method: 'DELETE',
        headers: { 'X-Club-Pin': pin }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const bar = getLocalClubData(pin, 'bar', DEFAULT_BAR);
    const filtered = bar.filter(b => b.id !== id);
    setLocalClubData(pin, 'bar', filtered);
    return { success: true };
  },

  // --- SETTINGS ---
  async getSettings(pin) {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, { headers: { 'X-Club-Pin': pin } });
      if (res.ok) return await res.json();
    } catch (e) {}

    return getLocalClubData(pin, 'settings', {
      clubName: 'Бильярдный Клуб',
      currency: '₽',
      roundingMinutes: 1,
      minMinutes: 15,
      autoSound: true
    });
  },

  async updateSettings(pin, data) {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Club-Pin': pin },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const current = getLocalClubData(pin, 'settings', {
      clubName: 'Бильярдный Клуб',
      currency: '₽',
      roundingMinutes: 1,
      minMinutes: 15,
      autoSound: true
    });
    const updated = { ...current, ...data };
    setLocalClubData(pin, 'settings', updated);

    // Also update club name in local clubs
    const clubs = getLocalClubs();
    const c = clubs.find(cl => cl.pin === pin);
    if (c) {
      if (data.clubName) c.name = data.clubName;
      if (data.currency) c.currency = data.currency;
      saveLocalClubs(clubs);
    }

    return updated;
  },

  async resetDemo(pin) {
    try {
      const res = await fetch(`${API_BASE}/api/system/reset-demo`, {
        method: 'POST',
        headers: { 'X-Club-Pin': pin }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    setLocalClubData(pin, 'tables', DEFAULT_TABLES);
    setLocalClubData(pin, 'bar', DEFAULT_BAR);
    setLocalClubData(pin, 'sessions', []);
    return { success: true };
  }
};
