import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TableCard from './components/TableCard';
import TableModal from './components/TableModal';
import StartSessionModal from './components/StartSessionModal';
import StopSessionModal from './components/StopSessionModal';
import BarModal from './components/BarModal';
import DailyReport from './components/DailyReport';
import HistoryModal from './components/HistoryModal';
import TransferModal from './components/TransferModal';
import SettingsModal from './components/SettingsModal';
import PrintReceipt from './components/PrintReceipt';
import PinLoginModal from './components/PinLoginModal';
import MobileBottomNav from './components/MobileBottomNav';
import AdminPanel from './components/AdminPanel';
import { sound } from './utils/audio';
import { api } from './utils/api';
import { 
  PlusCircle, 
  Layers, 
  Sparkles, 
  Gamepad2, 
  Coffee,
  Calendar,
  Settings,
  History,
  TrendingUp,
  LogOut
} from 'lucide-react';

export default function App() {
  // Check if user is on /admin route
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return window.location.pathname.startsWith('/admin');
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Current authenticated Club state
  const [currentClub, setCurrentClub] = useState(() => {
    try {
      const saved = localStorage.getItem('billiard_active_club');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [tables, setTables] = useState([]);
  const [barItems, setBarItems] = useState([]);
  const [settings, setSettings] = useState({
    clubName: "Бильярдный Клуб",
    currency: "₽",
    roundingMinutes: 1,
    minMinutes: 15,
    autoSound: true
  });
  const [todaySummary, setTodaySummary] = useState({ totalRevenue: 0 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeMobileTab, setActiveMobileTab] = useState('tables');

  // Modals state
  const [startModalTable, setStartModalTable] = useState(null);
  const [stopModalTable, setStopModalTable] = useState(null);
  const [editTableModal, setEditTableModal] = useState({ isOpen: false, table: null });
  const [barModal, setBarModal] = useState({ isOpen: false, table: null });
  const [transferTable, setTransferTable] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastPrintedSession, setLastPrintedSession] = useState(null);

  // Fetch data for active club
  const fetchData = async () => {
    if (!currentClub) return;
    try {
      const [tData, bData, sData, repData] = await Promise.all([
        api.getTables(currentClub.pin),
        api.getBar(currentClub.pin),
        api.getSettings(currentClub.pin),
        api.getDailyReport(currentClub.pin)
      ]);

      if (tData) setTables(tData);
      if (bData) setBarItems(bData);
      if (sData) setSettings(sData);
      if (repData) setTodaySummary(repData.summary || { totalRevenue: 0 });
    } catch (e) {
      console.error("API error", e);
    }
  };

  useEffect(() => {
    if (currentClub) {
      fetchData();
      const interval = setInterval(fetchData, 4000);
      return () => clearInterval(interval);
    }
  }, [currentClub]);

  const handleLoginSuccess = (club) => {
    localStorage.setItem('billiard_active_club', JSON.stringify(club));
    setCurrentClub(club);
  };

  const handleLogout = () => {
    localStorage.removeItem('billiard_active_club');
    setCurrentClub(null);
    setTables([]);
  };

  // Handle Mobile Tab Switch
  const handleMobileTabChange = (tabId) => {
    setActiveMobileTab(tabId);
    if (tabId === 'report') setIsReportOpen(true);
    else if (tabId === 'bar') setBarModal({ isOpen: true, table: null });
    else if (tabId === 'history') setIsHistoryOpen(true);
    else if (tabId === 'settings') setIsSettingsOpen(true);
  };

  // Handlers for Session Lifecycle
  const handleStartSession = async (payload) => {
    try {
      const res = await api.startSession(currentClub.pin, payload);
      if (res && res.success) {
        if (settings.autoSound) sound.playStart();
        setStartModalTable(null);
        fetchData();
      } else {
        alert(res?.error || "Ошибка запуска сессии");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePauseSession = async (table) => {
    try {
      const res = await api.pauseSession(currentClub.pin, table.id);
      if (res && res.success) {
        sound.playClick();
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopSession = async (payload) => {
    try {
      const res = await api.stopSession(currentClub.pin, payload);
      if (res && res.success) {
        if (settings.autoSound) sound.playStop();
        setLastPrintedSession(res.session);
        setStopModalTable(null);
        fetchData();
      } else {
        alert(res?.error || "Ошибка расчета сессии");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Transfer session
  const handleTransferSession = async (fromTableId, toTableId) => {
    try {
      const res = await api.transferSession(currentClub.pin, fromTableId, toTableId);
      if (res && res.success) {
        sound.playClick();
        setTransferTable(null);
        fetchData();
      } else {
        alert(res?.error || "Ошибка переноса стола");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add / Edit Table
  const handleSaveTable = async (tableData) => {
    try {
      const res = await api.saveTable(currentClub.pin, tableData);
      if (res && res.success) {
        setEditTableModal({ isOpen: false, table: null });
        fetchData();
      } else {
        alert(res?.error || "Ошибка сохранения стола");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTable = async (tableId) => {
    try {
      const res = await api.deleteTable(currentClub.pin, tableId);
      if (res && res.success) {
        setEditTableModal({ isOpen: false, table: null });
        fetchData();
      } else {
        alert(res?.error || "Ошибка удаления стола");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bar items management
  const handleAddToTable = async (tableId, item) => {
    try {
      const res = await api.addBarOrder(currentClub.pin, {
        tableId,
        itemId: item.id,
        name: item.name,
        price: item.price,
        qty: 1
      });
      if (res && res.success) {
        sound.playClick();
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTableItem = async (tableId, itemIndex, qty) => {
    try {
      const res = await api.updateBarOrder(currentClub.pin, { tableId, itemIndex, qty });
      if (res && res.success) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBarItem = async (itemData) => {
    try {
      await api.createBarItem(currentClub.pin, itemData);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBarItem = async (itemId) => {
    try {
      await api.deleteBarItem(currentClub.pin, itemId);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Settings
  const handleSaveSettings = async (newSettings) => {
    try {
      const updated = await api.updateSettings(currentClub.pin, newSettings);
      if (updated) {
        setSettings(updated);
        setCurrentClub(prev => ({
          ...prev,
          name: updated.clubName,
          currency: updated.currency
        }));
        setIsSettingsOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await api.resetDemo(currentClub.pin);
      if (res && res.success) {
        setIsSettingsOpen(false);
        fetchData();
        alert("Стандартные столы и бар успешно восстановлены!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // If user requested /admin route, render AdminPanel
  if (isAdminRoute) {
    return (
      <AdminPanel
        onNavigateHome={() => {
          window.history.pushState({}, '', '/');
          setIsAdminRoute(false);
        }}
      />
    );
  }

  // If not logged in, show Mobile PIN entry screen
  if (!currentClub) {
    return <PinLoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  // Category filters
  const categoriesList = [
    { id: 'all', name: 'Все зоны', count: tables.length },
    { id: 'russian', name: 'Русский', count: tables.filter(t => t.category === 'russian').length },
    { id: 'pool', name: 'Пул', count: tables.filter(t => t.category === 'pool').length },
    { id: 'snooker', name: 'Снукер', count: tables.filter(t => t.category === 'snooker').length },
    { id: 'vip', name: 'VIP', count: tables.filter(t => t.category === 'vip').length },
    { id: 'playstation', name: 'PlayStation', count: tables.filter(t => t.category === 'playstation').length }
  ];

  const filteredTables = selectedCategory === 'all'
    ? tables
    : tables.filter(t => t.category === selectedCategory);

  const busyCount = tables.filter(t => t.status === 'busy' || t.status === 'paused').length;

  return (
    <div className="min-h-screen bg-[#090e15] flex flex-col selection:bg-emerald-500 selection:text-white pb-24 md:pb-12">
      
      {/* Top Bar with PIN badge and logout */}
      <Navbar
        club={currentClub}
        currency={settings.currency}
        tables={tables}
        todayRevenue={todaySummary.totalRevenue}
        onOpenAddTable={() => setEditTableModal({ isOpen: true, table: null })}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenBar={() => setBarModal({ isOpen: true, table: null })}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex-1 w-full space-y-4 sm:space-y-6">
        
        {/* Mobile Quick Revenue Bar (visible on small screens) */}
        <div className="flex md:hidden items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">В игре:</span>
            <span className="font-bold text-white font-mono">{busyCount} / {tables.length}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">Касса:</span>
            <span className="font-bold text-emerald-400 text-sm">{todaySummary.totalRevenue.toLocaleString('ru-RU')} {settings.currency}</span>
          </div>
        </div>

        {/* Category Filter Pills & Add Table Shortcut */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2 sm:p-2.5 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {categoriesList.map((cat) => {
              if (cat.id !== 'all' && cat.count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            <span>Всего зон: </span>
            <span className="font-bold text-white font-mono">{tables.length}</span>
          </div>
        </div>

        {/* Empty State */}
        {filteredTables.length === 0 && (
          <div className="py-16 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Зоны не найдены</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
              В этой категории пока нет столов. Добавьте новый стол или приставку PlayStation!
            </p>
            <button
              onClick={() => setEditTableModal({ isOpen: true, table: null })}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
            >
              Добавить зону
            </button>
          </div>
        )}

        {/* Tables Grid (Mobile-friendly responsive grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              currency={settings.currency}
              onStart={(t) => setStartModalTable(t)}
              onStop={(t) => setStopModalTable(t)}
              onPause={handlePauseSession}
              onAddBar={(t) => setBarModal({ isOpen: true, table: t })}
              onEdit={(t) => setEditTableModal({ isOpen: true, table: t })}
              onTransfer={(t) => setTransferTable(t)}
            />
          ))}
        </div>

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        onTabChange={handleMobileTabChange}
        busyCount={busyCount}
        onOpenAddTable={() => setEditTableModal({ isOpen: true, table: null })}
      />

      {/* MODALS */}
      <StartSessionModal
        table={startModalTable}
        currency={settings.currency}
        isOpen={Boolean(startModalTable)}
        onClose={() => setStartModalTable(null)}
        onConfirm={handleStartSession}
      />

      <StopSessionModal
        table={stopModalTable}
        currency={settings.currency}
        isOpen={Boolean(stopModalTable)}
        onClose={() => setStopModalTable(null)}
        onConfirm={handleStopSession}
      />

      <TableModal
        isOpen={editTableModal.isOpen}
        table={editTableModal.table}
        currency={settings.currency}
        onClose={() => setEditTableModal({ isOpen: false, table: null })}
        onSave={handleSaveTable}
        onDelete={handleDeleteTable}
      />

      <BarModal
        isOpen={barModal.isOpen}
        table={barModal.table ? tables.find(t => t.id === barModal.table.id) : null}
        barItems={barItems}
        currency={settings.currency}
        onClose={() => setBarModal({ isOpen: false, table: null })}
        onAddToTable={handleAddToTable}
        onUpdateTableItem={handleUpdateTableItem}
        onCreateBarItem={handleCreateBarItem}
        onDeleteBarItem={handleDeleteBarItem}
      />

      <TransferModal
        isOpen={Boolean(transferTable)}
        sourceTable={transferTable}
        tables={tables}
        onClose={() => setTransferTable(null)}
        onConfirm={handleTransferSession}
      />

      <DailyReport
        isOpen={isReportOpen}
        currency={settings.currency}
        clubPin={currentClub.pin}
        onClose={() => {
          setIsReportOpen(false);
          setActiveMobileTab('tables');
        }}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        currency={settings.currency}
        clubPin={currentClub.pin}
        onClose={() => {
          setIsHistoryOpen(false);
          setActiveMobileTab('tables');
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => {
          setIsSettingsOpen(false);
          setActiveMobileTab('tables');
        }}
        onSaveSettings={handleSaveSettings}
        onResetDemo={handleResetDemo}
      />

      {/* Hidden print layout component */}
      <PrintReceipt
        session={lastPrintedSession}
        clubName={settings.clubName}
        currency={settings.currency}
      />

    </div>
  );
}
