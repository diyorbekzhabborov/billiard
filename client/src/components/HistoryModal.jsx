import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Trash2, Printer, Filter } from 'lucide-react';

export default function HistoryModal({
  isOpen,
  currency,
  clubPin,
  onClose
}) {
  if (!isOpen) return null;

  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = '/api/sessions/history?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (filterDate) url += `date=${encodeURIComponent(filterDate)}&`;
      const res = await fetch(url, {
        headers: { 'X-Club-Pin': clubPin || '' }
      });
      const data = await res.json();
      setSessions(data);
    } catch (e) {
      console.error("Error fetching history", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, filterDate]);

  const handleDelete = async (id) => {
    if (!confirm("Вы действительно хотите аннулировать эту запись?")) return;
    try {
      const res = await fetch(`/api/sessions/history/${id}`, {
        method: 'DELETE',
        headers: { 'X-Club-Pin': clubPin || '' }
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">История всех закрытых смен и игр</h3>
            <p className="text-xs text-slate-400">Архив расчетов и чеков</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex flex-wrap gap-2.5 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Поиск по имени гостя или столу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Загрузка архива...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">Записей не найдено</div>
          ) : (
            sessions.map((s) => {
              const start = new Date(s.startTime);
              const end = new Date(s.endTime);
              const durationMins = s.billedMinutes || s.rawDurationMinutes;
              const h = Math.floor(durationMins / 60);
              const m = durationMins % 60;

              return (
                <div
                  key={s.id}
                  className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-4 hover:border-slate-600 transition flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{s.tableName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-emerald-400">{s.clientName || 'Гость'}</span>
                      {s.phone && <span className="text-slate-500">({s.phone})</span>}
                    </div>
                    <div className="text-slate-400 flex items-center gap-2 text-[11px]">
                      <span>{start.toLocaleDateString('ru-RU')}</span>
                      <span>{start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-300">
                        {h > 0 ? `${h} ч ` : ''}{m} мин
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-white font-mono text-sm">
                        {s.totalAmount} {currency}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Стол: {s.tableCost} {s.barCost > 0 && `+ Бар: ${s.barCost}`}
                      </div>
                    </div>

                    <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {s.paymentMethod === 'cash' ? '💵 Нал' : (s.paymentMethod === 'card' ? '💳 Карта' : '📱 Перевод')}
                    </span>

                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition"
                      title="Аннулировать запись"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/80 border-t border-slate-700/80 flex justify-between items-center text-xs text-slate-400">
          <span>Всего записей: {sessions.length}</span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}
