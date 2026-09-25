import React, { useState } from 'react';
import { X, Plus, Trash2, Coffee, PlusCircle, MinusCircle, ShoppingBag, Check } from 'lucide-react';

export default function BarModal({
  isOpen,
  table, // if opened for a specific table, otherwise null
  barItems,
  currency,
  onClose,
  onAddToTable,
  onUpdateTableItem,
  onCreateBarItem,
  onDeleteBarItem
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState(table ? 'order' : 'catalog');
  const [filterCat, setFilterCat] = useState('all');

  // Form state for creating a new bar item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('drinks');
  const [newItemPrice, setNewItemPrice] = useState('');

  const categories = [
    { id: 'all', name: 'Все товары' },
    { id: 'drinks', name: 'Напитки & Чай' },
    { id: 'snacks', name: 'Снеки & Орехи' },
    { id: 'kitchen', name: 'Кухня & Сэндвичи' },
    { id: 'hookah', name: 'Кальяны' }
  ];

  const filteredItems = filterCat === 'all' 
    ? barItems 
    : barItems.filter(i => i.category === filterCat);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;

    onCreateBarItem({
      name: newItemName.trim(),
      category: newItemCategory,
      price: Number(newItemPrice)
    });

    setNewItemName('');
    setNewItemPrice('');
  };

  const tableOrders = table?.currentSession?.barOrders || [];
  const tableBarTotal = tableOrders.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {table ? `Бар и напитки: ${table.name}` : 'Каталог бара и кухни'}
              </h3>
              <p className="text-xs text-slate-400">
                {table 
                  ? `Добавление заказов к счету гостя (${table.currentSession?.clientName || 'Гость'})`
                  : 'Управление ценами и меню клуба'}
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

        {/* Tab switch if opened for table */}
        {table && (
          <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2">
            <button
              onClick={() => setActiveTab('order')}
              className={`py-2 px-4 text-xs font-semibold border-b-2 transition ${
                activeTab === 'order'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Добавить к столу
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-2 px-4 text-xs font-semibold border-b-2 transition ${
                activeTab === 'catalog'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Настройка меню
            </button>
          </div>
        )}

        {/* Order Mode (For Table) */}
        {table && activeTab === 'order' && (
          <div className="p-6 space-y-5">
            
            {/* Category filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCat(c.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    filterCat === c.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const countInTable = tableOrders.find(o => o.itemId === item.id)?.qty || 0;
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-800/70 border border-slate-700/70 rounded-xl flex items-center justify-between hover:border-slate-600 transition"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white line-clamp-1">{item.name}</div>
                      <div className="text-xs font-mono font-bold text-amber-400">{item.price} {currency}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {countInTable > 0 && (
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold flex items-center justify-center">
                          {countInTable}
                        </span>
                      )}
                      <button
                        onClick={() => onAddToTable(table.id, item)}
                        className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Table Bar Bill */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  Уже заказано на этот стол:
                </span>
                <span className="font-mono text-amber-400 font-bold">Итого: {tableBarTotal} {currency}</span>
              </div>

              {tableOrders.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-2">
                  Пока ничего не заказано
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {tableOrders.map((ord, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-800/80">
                      <span className="text-slate-200">{ord.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-400">{ord.price} × {ord.qty} = {ord.price * ord.qty} {currency}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onUpdateTableItem(table.id, idx, ord.qty - 1)}
                            className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700"
                            title="Уменьшить"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-bold text-white w-4 text-center">{ord.qty}</span>
                          <button
                            onClick={() => onUpdateTableItem(table.id, idx, ord.qty + 1)}
                            className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-700"
                            title="Увеличить"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
              >
                Готово
              </button>
            </div>

          </div>
        )}

        {/* Catalog Management Mode */}
        {(!table || activeTab === 'catalog') && (
          <div className="p-6 space-y-6">
            
            {/* Add new item form */}
            <form onSubmit={handleCreateSubmit} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-3">
              <div className="text-xs font-semibold text-slate-300">Добавить новую позицию в меню:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Название (напр. Чай с чабрецом)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 sm:col-span-1"
                />
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="drinks">Напитки & Чай</option>
                  <option value="snacks">Снеки & Орехи</option>
                  <option value="kitchen">Кухня & Сэндвичи</option>
                  <option value="hookah">Кальяны</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Цена"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition active:scale-95 whitespace-nowrap"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </form>

            {/* Existing Menu Items list */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">Текущее меню:</div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {barItems.map((item) => (
                  <div key={item.id} className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400">☕</span>
                      <span className="font-medium text-white">{item.name}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400">{item.price} {currency}</span>
                      <button
                        onClick={() => onDeleteBarItem(item.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Закрыть
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
