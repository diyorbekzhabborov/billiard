import React, { useState, useEffect } from 'react';
import { Delete, AlertCircle } from 'lucide-react';

export default function PinLoginModal({ onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  // Support physical keyboard on desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const handleDigit = (digit) => {
    if (pin.length >= 4) return;
    setError('');
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      submitPin(newPin);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const submitPin = async (inputPin) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inputPin })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onLoginSuccess(data.club);
      } else {
        setError(data.error || 'Неверный PIN-код');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setPin(''), 600);
      }
    } catch (e) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070b10] select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-xl shadow-emerald-500/25 mx-auto mb-3 text-3xl">
            🎱
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Billiard Club CRM</h1>
          <p className="text-xs text-slate-400 mt-1">Введите 4-значный PIN-код клуба</p>
        </div>

        {/* 4 PIN Dots Indicator */}
        <div className={`flex items-center justify-center gap-4 my-4 ${shake ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const filled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  filled
                    ? 'bg-emerald-400 border-emerald-400 shadow-md shadow-emerald-500/50 scale-110'
                    : 'bg-slate-800 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        <div className="h-6 mb-3 flex items-center justify-center">
          {error && (
            <div className="text-xs text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Touch Number Pad (Mobile-friendly) */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(String(num))}
              className="h-16 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 active:scale-95 text-white font-mono text-2xl font-bold transition flex items-center justify-center shadow-md shadow-black/40"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white active:bg-slate-800 text-xs font-semibold transition flex items-center justify-center"
          >
            Очистить
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 active:scale-95 text-white font-mono text-2xl font-bold transition flex items-center justify-center shadow-md shadow-black/40"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-red-400 active:bg-slate-800 transition flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
