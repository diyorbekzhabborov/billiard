import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  BarChart3, 
  History, 
  Coffee, 
  Settings, 
  DollarSign, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({
  club,
  currency,
  tables,
  todayRevenue,
  onOpenAddTable,
  onOpenReport,
  onOpenHistory,
  onOpenBar,
  onOpenSettings,
  onLogout
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalTables = tables.length;
  const busyTables = tables.filter(t => t.status === 'busy' || t.status === 'paused').length;
  const freeTables = totalTables - busyTables;

  const formattedTime = currentTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 py-2.5">
          
          {/* Logo, Club Name & Current PIN */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-lg">
              🎱
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
                  {club?.name || "Бильярдный Клуб"}
                </h1>
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                  PIN: {club?.pin}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-medium">{formattedTime}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Свободно: {freeTables}/{totalTables}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Badges for desktop */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="bg-gradient-to-r from-emerald-950/40 to-slate-800/80 border border-emerald-800/40 rounded-xl px-3 py-1 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-xs">
                <span className="text-slate-400">Касса: </span>
                <span className="font-bold text-white font-mono">{todayRevenue.toLocaleString('ru-RU')} {currency}</span>
              </div>
            </div>
          </div>

          {/* Actions Navbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenAddTable}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/30 transition active:scale-95"
              title="Добавить новый стол или приставку"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Новый стол</span>
            </button>

            {/* Desktop only navigation shortcuts (mobile uses bottom nav) */}
            <button
              onClick={onOpenBar}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Меню бара и кухни"
            >
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>Бар</span>
            </button>

            <button
              onClick={onOpenReport}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Отчет за день и касса"
            >
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Отчет</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="История всех смен"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>История</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="hidden md:flex p-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Настройки клуба"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Switch / Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-red-950/40 hover:text-red-300 text-slate-400 border border-slate-700 transition"
              title="Сменить PIN-код / Выйти из клуба"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Сменить PIN</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
