import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Gamepad2, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Mail, 
  User as UserIcon, 
  Image as ImageIcon, 
  AlertCircle,
  KeyRound,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

interface UserItem {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  status: 'active' | 'passive' | 'banned';
  avatar?: string;
  created_at: string;
}

interface UserManagementViewProps {
  currentUser: {
    name: string;
    email: string;
    role: string;
  };
}

// Hazır Knight Online & Gaming Preset Avatarları
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80', // Warrior
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // Rogue/Elven
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', // Mage
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', // Priest
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', // Admin Female
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'  // Cyber Neon
];

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'super_admin' | 'admin' | 'user',
    status: 'active' as 'active' | 'passive' | 'banned',
    avatar: PRESET_AVATARS[0]
  });
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      let url = '/api/v1/users';
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setError(err.response?.data?.message || 'Kullanıcı listesi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'active',
      avatar: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Boş bırakılırsa değişmeyecek
      role: user.role,
      status: user.status,
      avatar: user.avatar || PRESET_AVATARS[0]
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingUser) {
        // Güncelleme
        const response = await axios.put(`/api/v1/users/${editingUser.id}`, formData, { headers });
        if (response.data.success) {
          setFormSuccess('Kullanıcı bilgileri başarıyla güncellendi.');
          setTimeout(() => {
            setIsModalOpen(false);
            fetchUsers();
          }, 1000);
        }
      } else {
        // Yeni Kullanıcı Oluşturma
        if (!formData.password) {
          setFormError('Yeni kullanıcı için şifre alanı zorunludur.');
          setFormSubmitting(false);
          return;
        }
        const response = await axios.post('/api/v1/users', formData, { headers });
        if (response.data.success) {
          setFormSuccess('Yeni yetkili / kullanıcı başarıyla oluşturuldu.');
          setTimeout(() => {
            setIsModalOpen(false);
            fetchUsers();
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error('User save error:', err);
      setFormError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Kullanıcı kaydedilirken bir hata oluştu.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!window.confirm(`"${user.name}" kullanıcısını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.delete(`/api/v1/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Silme işlemi sırasında hata oluştu.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-amber-500/15 border border-amber-500/40 text-amber-400">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Yönetici (Süper Admin)
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Db Editör (Admin)
          </span>
        );
      case 'damage_editor':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/15 border border-rose-500/40 text-rose-400">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            Damage Sorumlusu
          </span>
        );
      case 'guide_editor':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Rehber Sorumlusu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 border border-indigo-500/40 text-indigo-300">
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            Game Master (User)
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Aktif
          </span>
        );
      case 'passive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Pasif
          </span>
        );
      case 'banned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Yasaklı
          </span>
        );
    }
  };

  if (currentUser.role !== 'super_admin') {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 inline-block">
          <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-white">Erişim Engellendi</h2>
        <p className="text-sm text-slate-400">
          Oyuncu & GM Listesi ve Kullanıcı Yönetim alanına sadece **Yönetici (Süper Admin)** yetkisine sahip kullanıcılar erişebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white">Oyuncu & GM Yönetim Merkezi</h1>
              <p className="text-xs text-slate-400">Sistem yöneticileri, Db Editörleri ve Game Master (GM) hesaplarını yönetin ve yetkilendirin.</p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="z-10 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yeni Yetkili / GM Ekle</span>
        </button>

        {/* Decorative Ambient Background */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kullanıcı adı veya e-posta ile ara..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </form>

        {/* Role Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Tüm Hesaplar' },
            { id: 'super_admin', label: 'Yöneticiler' },
            { id: 'admin', label: 'Db Editörleri' },
            { id: 'user', label: 'Game Masterlar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Table / List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Yetkili hesaplar yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center text-xs">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/30 rounded-3xl border border-slate-800/60 space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400">Kullanıcı Bulunamadı</p>
          <p className="text-xs text-slate-500">Arama kriterlerinize uygun henüz bir kullanıcı veya yetkili bulunmuyor.</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="py-4 px-6">Kullanıcı & Profil</th>
                  <th className="py-4 px-4">Mail Adresi</th>
                  <th className="py-4 px-4">Rol & Yetki</th>
                  <th className="py-4 px-4">Durum</th>
                  <th className="py-4 px-4">Kayıt Tarihi</th>
                  <th className="py-4 px-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                    
                    {/* User Info & Avatar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || PRESET_AVATARS[0]}
                          alt={u.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-amber-500/30 shadow-md bg-slate-950"
                        />
                        <div>
                          <div className="font-extrabold text-white group-hover:text-amber-400 transition-colors">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">UUID: {u.uuid.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 text-slate-300 font-medium">
                      {u.email}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {getStatusBadge(u.status)}
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('tr-TR')}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700 transition-all cursor-pointer"
                          title="Kullanıcıyı Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer"
                          title="Kullanıcıyı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {editingUser ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingUser ? 'Yetkili / GM Hesabını Düzenle' : 'Yeni Yetkili & GM Oluştur'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingUser ? `${editingUser.name} hesabının yetkilerini ve bilgilerini güncelleyin.` : 'Sisteme erişimi olacak kullanıcı adı, şifre ve yetkileri tanımlayın.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              
              {formError && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Profil Görseli (Avatar)
                </label>

                <div className="flex items-center gap-4">
                  <img
                    src={formData.avatar || PRESET_AVATARS[0]}
                    alt="Preview"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/50 shadow-lg bg-slate-950 shrink-0"
                  />
                  <div className="space-y-2 flex-1">
                    <div className="text-[11px] text-slate-400">Hazır Avatarlardan Seçin:</div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {PRESET_AVATARS.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Preset ${idx}`}
                          onClick={() => setFormData({ ...formData, avatar: url })}
                          className={`w-8 h-8 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                            formData.avatar === url ? 'border-amber-400 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="Veya Özel Görsel URL Adresi Yapıştırın..."
                  className="w-full mt-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: GM_Firedrake"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Mail Adresi
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="gm@deathko.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  Şifre {editingUser && <span className="text-[10px] text-slate-500 font-normal">(Değiştirmek istemiyorsanız boş bırakın)</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Minimum 6 karakter şifre girin'}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Kullanıcı Rolü & Yetkilendirme
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'super_admin',
                      title: 'Yönetici',
                      subtitle: 'Süper Admin',
                      desc: 'Tüm yetkilere sahiptir. GM ve yetkili ekleyebilir.',
                      icon: Shield,
                      color: 'amber'
                    },
                    {
                      id: 'admin',
                      title: 'Db Editör',
                      subtitle: 'Admin',
                      desc: 'Dashboard & Çözüm merkezlerine tam erişim. Konu yanıtlayabilir.',
                      icon: ShieldCheck,
                      color: 'cyan'
                    },
                    {
                      id: 'damage_editor',
                      title: 'Damage Sorumlusu',
                      subtitle: 'Damage Editor',
                      desc: 'Damage sorun bildirimlerini inceler, sadece kendisine atananları çözebilir.',
                      icon: Sparkles,
                      color: 'rose'
                    },
                    {
                      id: 'guide_editor',
                      title: 'Rehber Sorumlusu',
                      subtitle: 'Guide Editor',
                      desc: 'Rehber Forum sorun bildirimlerini inceler ve çözer.',
                      icon: Sparkles,
                      color: 'emerald'
                    },
                    {
                      id: 'user',
                      title: 'Game Master',
                      subtitle: 'User',
                      desc: 'Çözüm merkezlerini görür, sadece sorun konusu açabilir.',
                      icon: Gamepad2,
                      color: 'indigo'
                    }
                  ].map((roleOption) => (
                    <div
                      key={roleOption.id}
                      onClick={() => setFormData({ ...formData, role: roleOption.id as any })}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1.5 relative overflow-hidden ${
                        formData.role === roleOption.id
                          ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white">{roleOption.title}</span>
                        {formData.role === roleOption.id && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">{roleOption.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Hesap Durumu</label>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'active', label: 'Aktif', color: 'emerald' },
                    { id: 'passive', label: 'Pasif', color: 'slate' },
                    { id: 'banned', label: 'Yasaklı', color: 'rose' }
                  ].map((st) => (
                    <label key={st.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.status === st.id}
                        onChange={() => setFormData({ ...formData, status: st.id as any })}
                        className="text-amber-500 focus:ring-amber-500/20"
                      />
                      <span>{st.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Controls */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <span>Kaydediliyor...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingUser ? 'Değişiklikleri Kaydet' : 'Kullanıcıyı Oluştur'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
