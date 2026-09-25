import React from 'react';
import { Layers, BarChart3, Coffee, History, Settings } from 'lucide-react';

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  busyCount,
  onOpenAddTable
}) {
  const tabs = [
    { id: 'tables', label: 'Столы', icon: Layers, badge: busyCount > 0 ? busyCount : null },
    { id: 'report', label: 'Отчет', icon: BarChart3 },
    { id: 'bar', label: 'Бар', icon: Coffee },
    { id: 'history', label: 'История', icon: History },
    { id: 'settings', label: 'Клуб', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
                isActive ? 'text-emerald-400 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2.5 bg-amber-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
