import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Building, 
  PlusCircle, 
  Key, 
  Trash2, 
  Edit3, 
  LogOut, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy
} from 'lucide-react';
import { api } from '../utils/api';

export default function AdminPanel({ onNavigateHome }) {
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('billiard_admin_token'));
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Clubs management
  const [clubs, setClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);

  // New/Edit Club form
  const [clubName, setClubName] = useState('');
  const [clubPin, setClubPin] = useState('');
  const [clubCurrency, setClubCurrency] = useState('₽');
  const [formError, setFormError] = useState('');

  const fetchClubs = async (token) => {
    setLoadingClubs(true);
    try {
      const data = await api.getAdminClubs(token || adminToken);
      setClubs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClubs(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchClubs(adminToken);
    }
  }, [adminToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const data = await api.adminLogin(username, password);

      if (data && data.success) {
        sessionStorage.setItem('billiard_admin_token', data.token);
        setAdminToken(data.token);
        fetchClubs(data.token);
      } else {
        setLoginError(data?.error || 'Неверный логин или пароль');
      }
    } catch (e) {
      setLoginError('Ошибка связи с сервером');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('billiard_admin_token');
    setAdminToken(null);
  };

  const handleSaveClub = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!clubName.trim()) {
      setFormError('Укажите название клуба');
      return;
    }
    if (!/^\d{4}$/.test(clubPin.trim())) {
      setFormError('PIN должен состоять ровно из 4 цифр');
      return;
    }

    try {
      const isEditing = Boolean(editingClub);
      const payload = {
        name: clubName.trim(),
        pin: clubPin.trim(),
        currency: clubCurrency
      };

      const data = isEditing 
        ? await api.updateAdminClub(adminToken, editingClub.id, payload)
        : await api.createAdminClub(adminToken, payload);

      if (data && data.success) {
        setShowAddModal(false);
        setEditingClub(null);
        setClubName('');
        setClubPin('');
        fetchClubs();
      } else {
        setFormError(data?.error || 'Ошибка сохранения клуба');
      }
    } catch (e) {
      setFormError('Ошибка связи с сервером');
    }
  };

  const handleDeleteClub = async (id, name) => {
    if (!confirm(`Вы действительно хотите удалить учетную запись "${name}"? Все данные и столы этого клуба будут удалены.`)) {
      return;
    }

    try {
      const res = await api.deleteAdminClub(adminToken, id);
      if (res && res.success) {
        fetchClubs();
      } else {
        alert(res?.error || 'Ошибка удаления клуба');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Admin Login View
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#070b10] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Панель управления</h2>
            <p className="text-xs text-slate-400 mt-1">Вход для владельца платформы (Супер-Администратор)</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Логин
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin1"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Пароль
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-98"
            >
              {loginLoading ? 'Проверка...' : 'Войти в админку'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 mx-auto transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Перейти к экрану клиентов</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // 2. Admin Dashboard View
  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 flex flex-col">
      
      {/* Admin Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Админ-панель CRM</h2>
              <p className="text-[11px] text-slate-400">Управление учетными записями бильярдных клубов</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title="Открыть клиентское приложение"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">К приложению</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-red-500/30 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Выход</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Все подключенные бильярдные клубы</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Каждый клуб входит по своему 4-значному PIN-коду и имеет отдельную изолированную базу данных.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingClub(null);
              setClubName('');
              setClubPin('');
              setFormError('');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Добавить новый клуб</span>
          </button>
        </div>

        {/* Clubs List Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {loadingClubs ? (
            <div className="p-12 text-center text-xs text-slate-400">Загрузка клубов...</div>
          ) : clubs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">Нет подключенных клубов</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Название клуба</th>
                    <th className="py-3 px-4">4-значный PIN-код</th>
                    <th className="py-3 px-4">Валюта</th>
                    <th className="py-3 px-4">Количество столов</th>
                    <th className="py-3 px-4">Дата создания</th>
                    <th className="py-3 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {clubs.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🎱</span>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-base">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wider">
                          {c.pin}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{c.currency}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{c.tablesCount || 5} столов</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingClub(c);
                              setClubName(c.name);
                              setClubPin(c.pin);
                              setClubCurrency(c.currency || '₽');
                              setFormError('');
                              setShowAddModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="Изменить PIN или название"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteClub(c.id, c.name)}
                            disabled={clubs.length <= 1}
                            className="p-1.5 text-slate-500 hover:text-red-400 disabled:opacity-30 rounded-lg hover:bg-slate-800 transition"
                            title={clubs.length <= 1 ? "Нельзя удалить единственный клуб" : "Удалить клуб"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Add / Edit Club Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" />
                <span>{editingClub ? 'Редактировать учетную запись' : 'Подключить новый бильярдный клуб'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClub} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Название бильярдного клуба:
                </label>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Например: Бильярдный Клуб «Олимп»"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  4-значный PIN-код для входа персонала:
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={clubPin}
                  onChange={(e) => setClubPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="2222"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-base font-mono font-bold text-emerald-400 text-center tracking-widest focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500">
                  По этому коду покупатель будет входить в свою изолированную CRM.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Валюта расчетов:
                </label>
                <select
                  value={clubCurrency}
                  onChange={(e) => setClubCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="₽">Рубли (₽)</option>
                  <option value="с.">Сомони (с.)</option>
                  <option value="сом">Сом (сом)</option>
                  <option value="₸">Тенге (₸)</option>
                  <option value="UZS">Сум (UZS)</option>
                  <option value="$">Доллары ($)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-700 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95"
                >
                  {editingClub ? 'Сохранить' : 'Создать клуб'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
