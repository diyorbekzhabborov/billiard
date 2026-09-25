import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';

export default function TransferModal({
  isOpen,
  sourceTable,
  tables,
  onClose,
  onConfirm
}) {
  if (!isOpen || !sourceTable) return null;

  // Filter available destination tables (free tables only, not the same table)
  const availableTables = tables.filter(t => t.id !== sourceTable.id && t.status === 'available');

  const [targetTableId, setTargetTableId] = useState(availableTables[0]?.id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetTableId) {
      alert("Выберите свободный стол для пересадки");
      return;
    }
    onConfirm(sourceTable.id, targetTableId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Пересадить гостей</h3>
              <p className="text-xs text-slate-400">Смена стола с сохранением времени и бара</p>
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
          
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60 text-xs">
            <span className="text-slate-400">Текущий стол: </span>
            <span className="font-bold text-white">{sourceTable.name}</span>
            <div className="text-emerald-400 mt-1">
              Гость: {sourceTable.currentSession?.clientName || 'Гость'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Выберите новый свободный стол:
            </label>

            {availableTables.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Нет свободных столов для пересадки</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableTables.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTargetTableId(t.id)}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                      targetTableId === t.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-slate-400">Тариф: {t.hourlyRate} / час</div>
                    </div>
                    {targetTableId === t.id && (
                      <span className="text-emerald-400 font-bold">✓ Выбран</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
              disabled={availableTables.length === 0}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95"
            >
              Перенести сессию
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
