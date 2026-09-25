import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Coffee, 
  Percent, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Printer, 
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function StopSessionModal({
  table,
  currency,
  isOpen,
  onClose,
  onConfirm
}) {
  if (!isOpen || !table || !table.currentSession) return null;

  const session = table.currentSession;
  const now = new Date();
  const startTime = new Date(session.startTime);

  // Initial calculation of time
  let totalElapsedMs = now.getTime() - startTime.getTime();
  let pausedMs = session.totalPausedMs || 0;
  if (table.status === 'paused' && session.pausedAt) {
    pausedMs += Math.max(0, now.getTime() - new Date(session.pausedAt).getTime());
  }

  const effectiveMs = Math.max(0, totalElapsedMs - pausedMs);
  const totalMinutes = Math.max(1, Math.round(effectiveMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Rate & calculation
  const hourlyRate = session.hourlyRate || table.hourlyRate;
  const rawTableCost = Math.round((totalMinutes / 60) * hourlyRate);

  const [tableCost, setTableCost] = useState(rawTableCost);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, card, transfer, combined
  const [cashGiven, setCashGiven] = useState('');
  const [cashPart, setCashPart] = useState('');
  const [cardPart, setCardPart] = useState('');
  const [comment, setComment] = useState('');

  // Bar items from session
  const barOrders = session.barOrders || [];
  const barTotal = barOrders.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Grand total calculation
  const subtotal = Number(tableCost) + barTotal;
  const discountVal = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const finalTotal = Math.max(0, subtotal - discountVal);

  // Change calculation for cash
  const cashGivenNum = Number(cashGiven) || 0;
  const change = cashGivenNum > finalTotal ? cashGivenNum - finalTotal : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (paymentMethod === 'combined') {
      const sumCombined = (Number(cashPart) || 0) + (Number(cardPart) || 0);
      if (sumCombined !== finalTotal) {
        alert(`Сумма наличных (${cashPart || 0}) и карты (${cardPart || 0}) должна быть равна итогу (${finalTotal} ${currency})!`);
        return;
      }
    }

    onConfirm({
      tableId: table.id,
      endTime: now.toISOString(),
      discount: discountVal,
      paymentMethod,
      cashPaid: paymentMethod === 'cash' ? finalTotal : (paymentMethod === 'combined' ? Number(cashPart) : 0),
      cardPaid: paymentMethod === 'card' ? finalTotal : (paymentMethod === 'combined' ? Number(cardPart) : 0),
      comment
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Расчет стола:</span>
              <span className="text-emerald-400">{table.name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Гость: <span className="text-slate-200 font-semibold">{session.clientName}</span>
              {session.phone && ` (${session.phone})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Time & Tariff Breakdown Box */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Время игры:
              </span>
              <span className="font-mono text-slate-200">
                {startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Продолжительность:</div>
                <div className="text-lg font-black text-white font-mono">
                  {hours > 0 ? `${hours} ч ` : ''}{minutes} мин
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Тариф:</div>
                <div className="text-sm font-semibold text-amber-400 font-mono">
                  {hourlyRate} {currency} / час
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Стоимость времени:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tableCost}
                  onChange={(e) => setTableCost(Number(e.target.value))}
                  className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right font-mono font-bold text-emerald-400 text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-mono">{currency}</span>
              </div>
            </div>
          </div>

          {/* Bar Orders Summary */}
          {barOrders.length > 0 && (
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
              <div className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5" />
                Заказы из бара и кухни ({barOrders.length}):
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {barOrders.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/60">
                    <span className="text-slate-300 line-clamp-1">{item.name} × {item.qty}</span>
                    <span className="font-mono text-slate-200 font-medium whitespace-nowrap">
                      {item.price * item.qty} {currency}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between text-xs font-semibold text-amber-300">
                <span>Итого по бару:</span>
                <span className="font-mono">{barTotal} {currency}</span>
              </div>
            </div>
          )}

          {/* Discount Field */}
          <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-400" />
              Скидка / Бонус ({currency}):
            </label>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono font-bold text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Total Amount Box */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                Итого к оплате
              </span>
              <div className="text-[11px] text-slate-400">
                {barTotal > 0 ? `Стол: ${tableCost} + Бар: ${barTotal}` : 'Оплата только за стол'}
                {discountVal > 0 && ` (Скидка -${discountVal})`}
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {finalTotal} {currency}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Способ оплаты:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Наличные</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition ${
                  paymentMethod === 'card'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Терминал / Карта</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition ${
                  paymentMethod === 'transfer'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300 ring-1 ring-purple-500'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>Перевод / QR</span>
              </button>
            </div>
          </div>

          {/* Cash Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex-1 mr-3">
                <span className="text-slate-400 block mb-1">Получено от клиента:</span>
                <input
                  type="number"
                  placeholder={String(finalTotal)}
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-right">
                <span className="text-slate-400 block mb-1">Сдача клиенту:</span>
                <div className={`text-base font-black font-mono ${change > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {change} {currency}
                </div>
              </div>
            </div>
          )}

          {/* Comment */}
          <input
            type="text"
            placeholder="Примечание к расчету (необязательно)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              title="Печать чека"
            >
              <Printer className="w-4 h-4" />
              <span>Чек</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
            >
              Отмена
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-700/40 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 fill-white" />
              <span>Рассчитать и освободить</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
