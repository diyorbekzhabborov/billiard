import React from 'react';

export default function PrintReceipt({ session, clubName, currency }) {
  if (!session) return null;

  return (
    <div id="printable-receipt" className="hidden print:block p-6 max-w-sm mx-auto text-black font-mono text-xs">
      <div className="text-center pb-3 border-b border-black">
        <h2 className="text-base font-bold">{clubName || "Бильярдный Клуб"}</h2>
        <p className="text-[11px]">Квитанция об оплате</p>
      </div>

      <div className="py-2 border-b border-black space-y-1">
        <div className="flex justify-between">
          <span>Стол:</span>
          <span className="font-bold">{session.tableName}</span>
        </div>
        <div className="flex justify-between">
          <span>Гость:</span>
          <span>{session.clientName || 'Гость'}</span>
        </div>
        <div className="flex justify-between">
          <span>Время игры:</span>
          <span>
            {new Date(session.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {new Date(session.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Длительность:</span>
          <span className="font-bold">{session.billedMinutes || session.rawDurationMinutes} мин</span>
        </div>
        <div className="flex justify-between">
          <span>Тариф:</span>
          <span>{session.hourlyRate} {currency}/час</span>
        </div>
      </div>

      {session.barOrders && session.barOrders.length > 0 && (
        <div className="py-2 border-b border-black space-y-1">
          <div className="font-bold text-[11px]">Заказы бара:</div>
          {session.barOrders.map((b, i) => (
            <div key={i} className="flex justify-between">
              <span>{b.name} × {b.qty}</span>
              <span>{b.price * b.qty} {currency}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-1">
            <span>Итого бар:</span>
            <span>{session.barCost} {currency}</span>
          </div>
        </div>
      )}

      <div className="py-3 border-b-2 border-black space-y-1 text-sm font-bold">
        <div className="flex justify-between">
          <span>Стол:</span>
          <span>{session.tableCost} {currency}</span>
        </div>
        {session.discount > 0 && (
          <div className="flex justify-between text-xs font-normal">
            <span>Скидка:</span>
            <span>-{session.discount} {currency}</span>
          </div>
        )}
        <div className="flex justify-between text-base pt-1 border-t border-black">
          <span>ИТОГО К ОПЛАТЕ:</span>
          <span>{session.totalAmount} {currency}</span>
        </div>
        <div className="flex justify-between text-xs font-normal pt-1">
          <span>Оплата:</span>
          <span>
            {session.paymentMethod === 'cash' ? 'Наличные' : (session.paymentMethod === 'card' ? 'Банковская карта' : 'Перевод')}
          </span>
        </div>
      </div>

      <div className="text-center pt-3 text-[10px]">
        <p>Спасибо за визит!</p>
        <p>{new Date().toLocaleString('ru-RU')}</p>
      </div>
    </div>
  );
}
