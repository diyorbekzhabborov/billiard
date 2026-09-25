import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  PlayCircle, 
  Coffee, 
  Edit3, 
  ArrowRightLeft, 
  User, 
  Clock, 
  Gamepad2, 
  Crown, 
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function TableCard({
  table,
  currency,
  onStart,
  onStop,
  onPause,
  onAddBar,
  onEdit,
  onTransfer
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Category metadata (icon, label, style)
  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'russian':
        return { label: 'Русский бильярд', icon: '🎱', badgeColor: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' };
      case 'pool':
        return { label: 'Американский пул', icon: '🔴', badgeColor: 'bg-blue-900/40 text-blue-300 border-blue-700/50' };
      case 'snooker':
        return { label: 'Снукер', icon: '🎯', badgeColor: 'bg-red-900/40 text-red-300 border-red-700/50' };
      case 'vip':
        return { label: 'VIP Зал', icon: '👑', badgeColor: 'bg-amber-900/40 text-amber-300 border-amber-600/50' };
      case 'playstation':
        return { label: 'PlayStation 5', icon: '🎮', badgeColor: 'bg-purple-900/40 text-purple-300 border-purple-700/50' };
      default:
        return { label: 'Игровая зона', icon: '⭐', badgeColor: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const meta = getCategoryMeta(table.category);

  // Compute live elapsed time for active session
  useEffect(() => {
    if (!table.currentSession || table.status === 'available') {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const start = new Date(table.currentSession.startTime).getTime();
      let totalElapsed = now - start;

      let paused = table.currentSession.totalPausedMs || 0;
      if (table.status === 'paused' && table.currentSession.pausedAt) {
        paused += (now - new Date(table.currentSession.pausedAt).getTime());
      }

      const effectiveSeconds = Math.max(0, Math.floor((totalElapsed - paused) / 1000));
      setElapsedSeconds(effectiveSeconds);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [table.status, table.currentSession]);

  // Format time HH:MM:SS
  const formatTimer = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Live calculation of money
  const calculateLiveCost = () => {
    if (!table.currentSession) return 0;
    const hours = elapsedSeconds / 3600;
    const rate = table.currentSession.hourlyRate || table.hourlyRate;
    const tableCost = Math.round(hours * rate);
    
    const barOrders = table.currentSession.barOrders || [];
    const barCost = barOrders.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return {
      tableCost,
      barCost,
      total: tableCost + barCost
    };
  };

  const liveCost = calculateLiveCost();
  const barOrdersCount = table.currentSession?.barOrders?.reduce((acc, it) => acc + it.qty, 0) || 0;

  return (
    <div className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg ${
      table.status === 'busy' 
        ? 'bg-slate-900/90 border-emerald-500/50 shadow-emerald-950/40 ring-1 ring-emerald-500/30' 
        : table.status === 'paused'
        ? 'bg-slate-900/90 border-amber-500/60 shadow-amber-950/40'
        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 shadow-slate-950/30'
    }`}>
      
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{meta.icon}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}>
                {meta.label}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1">
              {table.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(table)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Настройки стола и тарифа"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hourly Rate tag */}
        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-800/80">
          <span className="text-slate-400">Тариф:</span>
          <span className="font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {table.hourlyRate} {currency} / час
          </span>
        </div>
      </div>

      {/* Center Body: State Dependent */}
      <div className="px-4 sm:px-5 py-3 flex-1 flex flex-col justify-center">
        {table.status === 'available' ? (
          // AVAILABLE STATE
          <div className="text-center py-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-1">
              Стол свободен
            </span>
            <p className="text-[11px] text-slate-500">Готов к приему гостей</p>
          </div>
        ) : (
          // ACTIVE OR PAUSED STATE
          <div className="space-y-3">
            {/* Guest info */}
            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">{table.currentSession?.clientName || 'Гость'}</div>
                  {table.currentSession?.phone && (
                    <div className="text-[10px] text-slate-400">{table.currentSession.phone}</div>
                  )}
                </div>
              </div>
              
              <div className="text-right text-[11px] text-slate-400">
                <span>Старт: </span>
                <span className="font-mono text-slate-200">
                  {new Date(table.currentSession?.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Live Timer Display */}
            <div className={`rounded-xl p-3.5 text-center border transition-all ${
              table.status === 'paused'
                ? 'bg-amber-950/20 border-amber-600/40'
                : 'bg-emerald-950/25 border-emerald-500/40 ring-1 ring-emerald-500/20'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${table.status === 'paused' ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`}></span>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
                  {table.status === 'paused' ? 'Пауза игры' : 'Время в игре'}
                </span>
              </div>

              {/* Big Digital Clock */}
              <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-wider my-1 drop-shadow-md">
                {formatTimer(elapsedSeconds)}
              </div>

              {/* Real-time money calculation */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Наиграно:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {liveCost.tableCost} {currency}
                </span>
              </div>

              {/* Bar items summary if any */}
              {barOrdersCount > 0 && (
                <div className="flex items-center justify-between text-xs text-amber-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Coffee className="w-3.5 h-3.5" /> Бар ({barOrdersCount}):
                  </span>
                  <span className="font-bold font-mono">+{liveCost.barCost} {currency}</span>
                </div>
              )}

              {/* Grand live total */}
              {barOrdersCount > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold text-white pt-1 border-t border-slate-800/60">
                  <span className="text-slate-300">Всего к оплате:</span>
                  <span className="text-base font-black text-white font-mono">{liveCost.total} {currency}</span>
                </div>
              )}
            </div>

            {/* In-game quick actions: Bar & Transfer */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onAddBar(table)}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Бар ({barOrdersCount})</span>
              </button>

              <button
                onClick={() => onTransfer(table)}
                className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition"
                title="Пересадить на другой стол"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="p-4 sm:p-5 pt-2 border-t border-slate-800/80 bg-slate-900/40">
        {table.status === 'available' ? (
          <button
            onClick={() => onStart(table)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-98 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Начать игру</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPause(table)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                table.status === 'paused'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
              }`}
              title={table.status === 'paused' ? 'Возобновить игру' : 'Поставить на паузу'}
            >
              {table.status === 'paused' ? (
                <>
                  <PlayCircle className="w-4 h-4 fill-white" />
                  <span>Продолжить</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Пауза</span>
                </>
              )}
            </button>

            <button
              onClick={() => onStop(table)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-900/30 flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Стоп и Рассчитать</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
