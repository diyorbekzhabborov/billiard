import React, { useState } from 'react';
import { X, Play, Clock, User, Phone, DollarSign, FileText } from 'lucide-react';

export default function StartSessionModal({
  table,
  currency,
  isOpen,
  onClose,
  onConfirm
}) {
  if (!isOpen || !table) return null;

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [customHourlyRate, setCustomHourlyRate] = useState(table.hourlyRate);
  const [customStartTime, setCustomStartTime] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      tableId: table.id,
      clientName: clientName.trim() || 'Гость',
      phone: phone.trim(),
      customHourlyRate: Number(customHourlyRate) || table.hourlyRate,
      startTime: customStartTime ? new Date(customStartTime).toISOString() : new Date().toISOString(),
      comment: comment.trim()
    });
  };

  // Quick guest name shortcuts
  const quickNames = ['Гость', 'Компания друзей', 'Постоянный гость', 'VIP клиент'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Play className="w-4 h-4 fill-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Начать игру</h3>
              <p className="text-xs text-slate-400">{table.name}</p>
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
          
          {/* Client Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Имя клиента / Компании
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Например: Рустам или Столик 1"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              autoFocus
            />
            {/* Quick badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickNames.map((name) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => setClientName(name)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              Номер телефона (необязательно)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Hourly Rate Override */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Тариф за 1 час игры
              </span>
              <span className="text-[11px] text-slate-500">Базовый: {table.hourlyRate} {currency}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="10"
                value={customHourlyRate}
                onChange={(e) => setCustomHourlyRate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono font-semibold focus:outline-none focus:border-emerald-500 transition"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                {currency} / час
              </span>
            </div>
          </div>

          {/* Start Time (Default: Now) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Время начала
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">Сейчас (по умолчанию)</span>
            </label>
            <input
              type="datetime-local"
              value={customStartTime}
              onChange={(e) => setCustomStartTime(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
            />
            <p className="text-[10px] text-slate-500 mt-1">Оставьте пустым, чтобы таймер запустился с текущей секунды</p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Примечание к брони / игре
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Например: скидка по акции, день рождения"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Buttons */}
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
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Запустить стол</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
