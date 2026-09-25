import React, { useState, useEffect } from 'react';
import { X, Settings, DollarSign, Clock, Volume2, RotateCcw, Building } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  settings,
  onClose,
  onSaveSettings,
  onResetDemo
}) {
  if (!isOpen || !settings) return null;

  const [clubName, setClubName] = useState(settings.clubName || '');
  const [currency, setCurrency] = useState(settings.currency || '₽');
  const [roundingMinutes, setRoundingMinutes] = useState(settings.roundingMinutes || 1);
  const [minMinutes, setMinMinutes] = useState(settings.minMinutes || 0);
  const [autoSound, setAutoSound] = useState(settings.autoSound !== false);

  const currencies = [
    { code: '₽', label: 'Рубль (₽)' },
    { code: 'с.', label: 'Сомони (с.)' },
    { code: 'сом', label: 'Сом (сом)' },
    { code: '₸', label: 'Тенге (₸)' },
    { code: 'UZS', label: 'Сум (UZS)' },
    { code: '$', label: 'Доллар ($)' },
    { code: '€', label: 'Евро (€)' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      clubName: clubName.trim(),
      currency,
      roundingMinutes: Number(roundingMinutes),
      minMinutes: Number(minMinutes),
      autoSound
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Настройки CRM</h3>
              <p className="text-xs text-slate-400">Параметры клуба и тарификации</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Club Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              Название бильярдного клуба
            </label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Бильярдный Клуб «Империя»"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Валюта расчетов
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {currencies.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`p-2 rounded-lg border text-xs font-medium transition ${
                    currency === c.code
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rounding Step */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Шаг округления времени расчета
            </label>
            <select
              value={roundingMinutes}
              onChange={(e) => setRoundingMinutes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="1">Поминутно (точное время 1 в 1)</option>
              <option value="5">Округление до 5 минут</option>
              <option value="10">Округление до 10 минут</option>
              <option value="15">Округление до 15 минут</option>
            </select>
          </div>

          {/* Minimum Minutes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Минимальное время расчета (порог)
            </label>
            <select
              value={minMinutes}
              onChange={(e) => setMinMinutes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="0">Без минимального времени (с 1-й минуты)</option>
              <option value="15">Минимум 15 минут игры</option>
              <option value="30">Минимум 30 минут игры</option>
              <option value="60">Минимум 1 час игры</option>
            </select>
          </div>

          {/* Sound switch */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Звуковые эффекты при старте и стопе
            </span>
            <input
              type="checkbox"
              checked={autoSound}
              onChange={(e) => setAutoSound(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm("Сбросить демо-столы и каталог бара до начальных настроек?")) {
                  onResetDemo();
                }
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Восстановить стандартный набор столов и бара</span>
            </button>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/30 transition active:scale-95"
            >
              Сохранить
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
