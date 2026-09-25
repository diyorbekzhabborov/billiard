import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2, DollarSign, Layers, Gamepad2, Sparkles } from 'lucide-react';

export default function TableModal({
  isOpen,
  table, // if editing, otherwise null
  currency,
  onClose,
  onSave,
  onDelete
}) {
  if (!isOpen) return null;

  const isEditing = Boolean(table);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('russian');
  const [hourlyRate, setHourlyRate] = useState(350);

  useEffect(() => {
    if (table) {
      setName(table.name);
      setCategory(table.category || 'russian');
      setHourlyRate(table.hourlyRate || 350);
    } else {
      setName('');
      setCategory('russian');
      setHourlyRate(350);
    }
  }, [table]);

  const categories = [
    { id: 'russian', name: 'Русский бильярд (12ф/10ф)', icon: '🎱', defaultRate: 400 },
    { id: 'pool', name: 'Американский пул (9ф/8ф)', icon: '🔴', defaultRate: 300 },
    { id: 'snooker', name: 'Снукер', icon: '🎯', defaultRate: 500 },
    { id: 'vip', name: 'VIP Зал / Комната отдыха', icon: '👑', defaultRate: 600 },
    { id: 'playstation', name: 'PlayStation 5 / Xbox', icon: '🎮', defaultRate: 250 },
    { id: 'other', name: 'Другая зона / Настолки', icon: '⭐', defaultRate: 200 }
  ];

  const handleCategorySelect = (catId) => {
    setCategory(catId);
    if (!isEditing) {
      const match = categories.find(c => c.id === catId);
      if (match) setHourlyRate(match.defaultRate);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Пожалуйста, введите название стола или зоны");
      return;
    }
    if (!hourlyRate || Number(hourlyRate) < 0) {
      alert("Пожалуйста, укажите корректную цену за 1 час");
      return;
    }

    onSave({
      id: table ? table.id : undefined,
      name: name.trim(),
      category,
      hourlyRate: Number(hourlyRate)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? "Редактировать стол / зону" : "Добавить новый стол / зону"}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? "Изменение названия и цены за 1 час" : "Бильярд, PlayStation, VIP"}
              </p>
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
          
          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Тип стола / зоны:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => handleCategorySelect(c.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center gap-2 ${
                    category === c.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="line-clamp-1 font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Название стола или консоли
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Стол 5 — Русский (12 футов) или PS5 Зона 3"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              autoFocus
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Цена за 1 час (тариф)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="10"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="400"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-base text-white font-mono font-bold focus:outline-none focus:border-amber-500 transition"
              />
              <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-semibold">
                {currency} / час
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Система автоматически рассчитывает стоимость игры гостей по этой часовой ставке.
            </p>
          </div>

          {/* Delete Button for existing tables */}
          {isEditing && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Вы действительно хотите удалить стол "${table.name}"?`)) {
                    onDelete(table.id);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить этот стол</span>
              </button>
            </div>
          )}

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
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              {isEditing ? "Сохранить изменения" : "Создать стол"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
