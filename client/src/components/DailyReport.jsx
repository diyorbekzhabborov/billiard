import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  Clock, 
  Layers, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Printer, 
  Download, 
  ChevronRight,
  TrendingUp,
  Coffee
} from 'lucide-react';
import { api } from '../utils/api';

export default function DailyReport({
  isOpen,
  currency,
  clubPin,
  onClose
}) {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (date) => {
    setLoading(true);
    try {
      const data = await api.getDailyReport(clubPin, date);
      setReportData(data);
    } catch (e) {
      console.error("Error fetching daily report", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.sessions) return;
    const headers = ["Стол", "Гость", "Начало", "Конец", "Минуты", "Сумма за стол", "Бар", "Итого", "Оплата"];
    const rows = reportData.sessions.map(s => [
      `"${s.tableName}"`,
      `"${s.clientName || 'Гость'}"`,
      `"${new Date(s.startTime).toLocaleTimeString('ru-RU')}"`,
      `"${new Date(s.endTime).toLocaleTimeString('ru-RU')}"`,
      s.billedMinutes || s.rawDurationMinutes,
      s.tableCost,
      s.barCost,
      s.totalAmount,
      s.paymentMethod
    ]);

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_${selectedDate}.csv`;
    link.click();
  };

  const summary = reportData?.summary || {
    totalRevenue: 0,
    totalTableRevenue: 0,
    totalBarRevenue: 0,
    totalCash: 0,
    totalCard: 0,
    totalTransfer: 0,
    totalHoursPlayed: 0,
    sessionsCount: 0
  };

  const formatMinutes = (totalMin) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m} мин`;
    return `${h} ч ${m} мин`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Финансовый отчет за день</h3>
              <p className="text-xs text-slate-400">Сводка выручки, часов работы столов и кассы</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
              <Calendar className="w-4 h-4 text-emerald-400 mr-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Экспорт в Excel / CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Печать отчета"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1" id="printable-receipt">
          
          {loading ? (
            <div className="py-16 text-center text-slate-400">Загрузка данных отчета...</div>
          ) : (
            <>
              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total revenue */}
                <div className="bg-gradient-to-br from-emerald-950/40 to-slate-800/60 border border-emerald-500/30 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Общая выручка
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    {summary.totalRevenue.toLocaleString('ru-RU')} {currency}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Столы: {summary.totalTableRevenue} • Бар: {summary.totalBarRevenue}
                  </div>
                </div>

                {/* Total Hours Played */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Отработано столами
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {summary.totalHoursPlayed} <span className="text-sm font-normal text-slate-400">ч</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Суммарное время всех столов
                  </div>
                </div>

                {/* Sessions Count */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Завершено игр
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {summary.sessionsCount}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Количество расчетных сессий
                  </div>
                </div>

                {/* Bar Revenue */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    Выручка бара
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                    {summary.totalBarRevenue.toLocaleString('ru-RU')} {currency}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Напитки, снеки, кухня
                  </div>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-4">
                <div className="text-xs font-semibold text-slate-300 mb-3">Касса по способам оплаты:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Наличные:</div>
                        <div className="text-base font-bold text-white font-mono">{summary.totalCash} {currency}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Терминал / Карта:</div>
                        <div className="text-base font-bold text-white font-mono">{summary.totalCard} {currency}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Перевод / QR:</div>
                        <div className="text-base font-bold text-white font-mono">{summary.totalTransfer} {currency}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Performance Section */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span>Статистика по столам и приставкам</span>
                  <span className="text-xs text-slate-400 font-normal">
                    (Сколько отработал каждый стол и сколько заработал)
                  </span>
                </h4>

                <div className="space-y-2.5">
                  {reportData?.tableStats?.map((t) => {
                    const pct = summary.totalRevenue > 0 ? Math.round((t.totalRevenue / summary.totalRevenue) * 100) : 0;
                    return (
                      <div
                        key={t.tableId}
                        className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-3.5 hover:border-slate-600 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {t.category === 'playstation' ? '🎮' : (t.category === 'vip' ? '👑' : '🎱')}
                            </span>
                            <span className="text-sm font-bold text-white">{t.tableName}</span>
                            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              {t.hourlyRate} {currency}/час
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono">
                            <div className="text-slate-300">
                              <span className="text-slate-500">Время: </span>
                              <span className="font-bold text-white">{formatMinutes(t.totalMinutes)}</span>
                            </div>
                            <div className="text-emerald-400 font-bold text-sm">
                              {t.totalRevenue.toLocaleString('ru-RU')} {currency}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar of revenue contribution */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>{t.sessionsCount} сессий</span>
                          <span>{pct}% от общей кассы дня</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Sessions History for the day */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3">
                  Детализация всех закрытых сессий за {selectedDate} ({reportData?.sessions?.length || 0}):
                </h4>

                {reportData?.sessions?.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800">
                    В этот день еще не было закрытых сессий
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Стол</th>
                          <th className="py-2.5 px-3">Гость</th>
                          <th className="py-2.5 px-3">Время игры</th>
                          <th className="py-2.5 px-3">Стол</th>
                          <th className="py-2.5 px-3">Бар</th>
                          <th className="py-2.5 px-3">Итого</th>
                          <th className="py-2.5 px-3">Оплата</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                        {reportData?.sessions?.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-800/50">
                            <td className="py-2.5 px-3 font-semibold text-white">{s.tableName}</td>
                            <td className="py-2.5 px-3">{s.clientName || 'Гость'}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {new Date(s.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {new Date(s.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} ({formatMinutes(s.billedMinutes || s.rawDurationMinutes)})
                            </td>
                            <td className="py-2.5 px-3 font-mono">{s.tableCost} {currency}</td>
                            <td className="py-2.5 px-3 font-mono text-amber-400">{s.barCost > 0 ? `+${s.barCost} ${currency}` : '—'}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{s.totalAmount} {currency}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700">
                                {s.paymentMethod === 'cash' ? '💵 Нал' : (s.paymentMethod === 'card' ? '💳 Карта' : '📱 Перевод')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/80 border-t border-slate-700/80 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl transition"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}
