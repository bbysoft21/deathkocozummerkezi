import React, { useEffect, useState } from 'react';
import { 
  Gamepad2, 
  Users, 
  LogOut, 
  Bell, 
  Search, 
  TrendingUp, 
  Sparkles,
  Flame,
  ShieldAlert,
  Coins,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  BarChart3,
  User as UserIcon,
  KeyRound,
  Settings
} from 'lucide-react';
import axios from 'axios';
import { SolutionCenterView } from './SolutionCenterView';
import { UserManagementView } from './UserManagementView';
import { PerformanceReportView } from './PerformanceReportView';
import { SiteSettingsView } from './SiteSettingsView';

interface User {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface StatsData {
  resolved: number;
  pending: number;
  in_progress: number;
  closed: number;
  total: number;
  centers?: {
    firedrake: number;
    myko: number;
    'light-farm': number;
  };
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type ActivePage = 'dashboard' | 'firedrake' | 'myko' | 'light-farm' | 'users' | 'reports' | 'settings';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [stats, setStats] = useState<StatsData>({
    resolved: 0,
    pending: 0,
    in_progress: 0,
    closed: 0,
    total: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  // Notification & Profile Edit Dropdown State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [lastNotifId, setLastNotifId] = useState<number | null>(null);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profileAvatar, setProfileAvatar] = useState(user.avatar || '');
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileMsg(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('name', profileName);
      if (profileAvatar) formData.append('avatar', profileAvatar);
      if (profileAvatarFile) formData.append('avatar_file', profileAvatarFile);
      if (currentPassword) formData.append('current_password', currentPassword);
      if (newPassword) formData.append('new_password', newPassword);

      const response = await axios.post('/api/v1/me/profile', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setProfileMsg({ type: 'success', text: 'Profiliniz ve resmi güncellendi.' });
        setCurrentPassword('');
        setNewPassword('');
        setProfileAvatarFile(null);
        
        // LocalStorage'daki kullanıcıyı güncelle ve ekranı yenile
        const updatedUser = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setTimeout(() => {
          setIsProfileDropdownOpen(false);
          setProfileMsg(null);
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      setProfileMsg({ 
        type: 'error', 
        text: err.response?.data?.message || err.response?.data?.errors?.current_password?.[0] || 'Profil güncellenirken bir hata oluştu.' 
      });
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Sağ alt canlı açılır pop-up toast bildirimi state'i
  const [liveToast, setLiveToast] = useState<{ show: boolean; title: string; message: string } | null>(null);

  useEffect(() => {
    fetchStats();
    fetchNotifications();

    // 3 saniyede bir yeni kisiye ozel bildirimleri anlık kontrol et (Real-time polling)
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [lastNotifId]);

  // Yemeksepeti / Trendyol Sipariş Zili tarzında yüksek dikkat çekici "Ding-Dong" zil sesi üretip 3 defa çalma
  const playNotificationSound3Times = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Sipariş Zili "Ding-Dong" Melodisi (Yüksek frekanslı 2 çift ton)
      const playOrderBellChime = (delayMs: number) => {
        setTimeout(() => {
          try {
            const now = audioCtx.currentTime;
            
            // 1. DING Tonu (E6 - 1318.51 Hz)
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(1318.51, now);
            gain1.gain.setValueAtTime(0.6, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.35);

            // 2. DONG Tonu (G5 - 783.99 Hz - 120ms sonra)
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(783.99, now + 0.12);
            gain2.gain.setValueAtTime(0.7, now + 0.12);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.55);

          } catch (err) {
            console.error('Order bell play error:', err);
          }
        }, delayMs);
      };

      // 3 defa sipariş zili melodisi çal (0ms, 650ms, 1300ms)
      playOrderBellChime(0);
      playOrderBellChime(650);
      playOrderBellChime(1300);
    } catch (e) {
      console.error('Audio play error:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get('/api/v1/tickets/stats', { headers: authHeader });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const response = await axios.get('/api/v1/user/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const notifData: any[] = response.data.data;
        
        if (notifData.length > 0) {
          const newest = notifData[0];

          // İlk açılışta en son ID'yi set et
          if (lastNotifId === null) {
            setLastNotifId(newest.id);
          } else if (newest.id > lastNotifId && !newest.is_read) {
            // Anlık yeni bildirim geldi! 🔊 3 defa ses çal ve 🔔 Sağ alt pop-up göster
            playNotificationSound3Times();
            setLiveToast({
              show: true,
              title: newest.title,
              message: newest.message
            });
            setLastNotifId(newest.id);

            // 10 saniye sonra pop-up'ı kapat
            setTimeout(() => {
              setLiveToast(null);
            }, 10000);
          }
        }

        setNotifications(notifData);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  const markNotificationRead = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.patch(`/api/v1/user/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6">
        
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('dashboard')}>
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-extrabold text-white tracking-wide">DeathKO</span>
            <span className="text-xs text-amber-400 block -mt-1 font-semibold">Çözüm Merkezi</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center w-96 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5" />
          <input
            type="text"
            placeholder="Destek talebi, sorun konusu ara..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-600"
          />
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-4">
          
          {/* Personal Notifications Bell & Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {notifications.some(n => !n.is_read) && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                </>
              )}
            </button>

            {/* Notification Dropdown Box */}
            {isNotifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">Özel Bildirimleriniz</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                    {notifications.filter(n => !n.is_read).length} Yeni
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">Henüz bildiriminiz yok</div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 cursor-pointer transition-colors ${
                          n.is_read 
                            ? 'bg-slate-950/40 border-slate-900 text-slate-400' 
                            : 'bg-amber-500/10 border-amber-500/30 text-slate-100 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{n.title}</span>
                          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">{n.message}</p>
                        <span className="text-[9px] text-slate-500 block pt-1">{new Date(n.created_at).toLocaleString('tr-TR')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative pl-3 border-l border-slate-800">
            <div 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-slate-900 transition-colors"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  onError={(e) => {
                    // Eğer görsel yüklenemezse kırık göstermek yerine harf avatarına düş
                    (e.target as HTMLElement).style.display = 'none';
                    if ((e.target as HTMLElement).nextElementSibling) {
                      ((e.target as HTMLElement).nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                  className="w-9 h-9 rounded-xl object-cover border border-amber-500/40 shadow-sm" 
                />
              ) : null}
              <div 
                style={{ display: user.avatar ? 'none' : 'flex' }}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/30 items-center justify-center font-bold text-amber-400 text-sm"
              >
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>{user.name}</span>
                  <span className="text-[9px] text-amber-400">▼</span>
                </div>
                <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">{user.role}</div>
              </div>
            </div>

            {/* Profile & Password Edit Dropdown Box */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-amber-400" />
                    <span>Profil & Şifre Ayarları</span>
                  </div>
                  <button 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  {profileMsg && (
                    <div className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 ${
                      profileMsg.type === 'success' 
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      <span>{profileMsg.text}</span>
                    </div>
                  )}

                  {/* Mail Adresi (Salt Okunur) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">E-Posta (Mail)</label>
                    <input
                      type="text"
                      disabled
                      value={user.email}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-500 cursor-not-allowed font-mono"
                    />
                    <span className="text-[9px] text-slate-600 block">Mail adresi güvenlik nedeniyle değiştirilemez.</span>
                  </div>

                  {/* Kullanıcı Adı */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 block">Kullanıcı Adı</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Profil Resmi Yükleme (PC Dosya Seçimi veya Web URL) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-300 block">Profil Görseli (Avatar)</label>

                    {/* Önizleme Kutusucuğu */}
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar Önizleme" className="w-10 h-10 rounded-xl object-cover border border-amber-500/40" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-bold">
                          {profileName.charAt(0)}
                        </div>
                      )}

                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-amber-400 cursor-pointer bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg text-center transition-all">
                          📁 Bilgisayardan Dosya Seç
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Veya URL Girme */}
                    <input
                      type="text"
                      value={profileAvatar}
                      onChange={(e) => {
                        setProfileAvatar(e.target.value);
                        setAvatarPreview(e.target.value);
                      }}
                      placeholder="Veya Görsel URL Yapıştırın (https://...)"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Şifre Değiştirme Alanı */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" /> Şifre Değiştir
                    </span>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 block">Mevcut Şifreniz</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Mevcut şifre"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 block">Yeni Şifreniz</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="En az 6 karakter"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Çıkış Yap</span>
                    </button>

                    <button
                      type="submit"
                      disabled={profileSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {profileSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex flex-1">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 p-4 hidden md:flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Solution Center Pages Section */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">
                Çözüm Merkezleri
              </div>
              <div className="space-y-1">
                
                {/* Firedrake Çözüm */}
                <button
                  onClick={() => setActivePage('firedrake')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activePage === 'firedrake'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Firedrake Çözüm</span>
                  </span>
                  {stats.centers && stats.centers.firedrake > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold animate-pulse flex items-center gap-1">
                      ⚠️ {stats.centers.firedrake}
                    </span>
                  )}
                </button>

                {/* Myko Çözüm */}
                <button
                  onClick={() => setActivePage('myko')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activePage === 'myko'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <span>Myko Çözüm</span>
                  </span>
                  {stats.centers && stats.centers.myko > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold animate-pulse flex items-center gap-1">
                      ⚠️ {stats.centers.myko}
                    </span>
                  )}
                </button>

                {/* Light Farm Çözüm */}
                <button
                  onClick={() => setActivePage('light-farm')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activePage === 'light-farm'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>Light Farm Çözüm</span>
                  </span>
                  {stats.centers && (stats.centers['light-farm'] > 0 || (stats.centers as any).light_farm > 0) && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold animate-pulse flex items-center gap-1">
                      ⚠️ {stats.centers['light-farm'] || (stats.centers as any).light_farm}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* General System Nav */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">
                Genel Yönetim
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => { setActivePage('dashboard'); fetchStats(); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activePage === 'dashboard'
                      ? 'bg-slate-800/80 text-white border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Genel Bakış</span>
                </button>

                {/* Sadece Süper Admin Oyuncu & GM Listesini ve Performans Raporunu Görebilir */}
                {user.role === 'super_admin' && (
                  <>
                    <button
                      onClick={() => setActivePage('users')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        activePage === 'users'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Oyuncu & GM Listesi</span>
                    </button>

                    <button
                      onClick={() => setActivePage('reports')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        activePage === 'reports'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      <span>Yetkili Performans Raporu</span>
                    </button>
                  </>
                )}

                {/* Site Ayarları & DB Optimizasyonu (En Altta) */}
                <button
                  onClick={() => setActivePage('settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activePage === 'settings'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Site Ayarları</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Super Admin / Role Status Footer */}
          <div className="p-3 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 text-left">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{user.role === 'super_admin' ? 'Süper Admin Modu' : user.role === 'admin' ? 'Db Editör Modu' : 'Game Master Modu'}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {user.role === 'super_admin'
                ? 'Tüm sistem ve kullanıcı yönetim yetkilerine sahipsiniz.'
                : user.role === 'admin'
                ? 'Çözüm merkezlerinde konuları yönetebilir ve yanıtlayabilirsiniz.'
                : 'Çözüm merkezlerini görüntüleyebilir ve sorun konusu açabilirsiniz.'}
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {activePage === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 Stats Cards: Toplam Çözülen, Bekleyen Sorunlar, İşlemde Olan, İptal Edilen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* 1. Toplam Çözülen Card */}
                <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Toplam Çözülen</span>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight">{stats.resolved}</div>
                  <div className="text-[11px] text-emerald-400 font-medium">Başarıyla sonuçlanan bildirimler</div>
                </div>

                {/* 2. Bekleyen Sorunlar Card */}
                <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Bekleyen Sorunlar</span>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight">{stats.pending}</div>
                  <div className="text-[11px] text-amber-400 font-medium">İnceleme bekleyen açık talepler</div>
                </div>

                {/* 3. İşlemde Olan Card */}
                <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">İşlemde Olanlar</span>
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight">{stats.in_progress}</div>
                  <div className="text-[11px] text-cyan-400 font-medium">Yetkili tarafından incelenenler</div>
                </div>

                {/* 4. İptal Edilen / Kapatılan Card */}
                <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-3 relative overflow-hidden group hover:border-red-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">İptal Edilen / Kapatılan</span>
                    <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight">{stats.closed}</div>
                  <div className="text-[11px] text-red-400 font-medium">Kapatılmış veya geçersiz talepler</div>
                </div>

              </div>

              {/* 3 Solution Centers Quick Navigation Section */}
              <div className="pt-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Çözüm Merkezleri Hızlı Erişim</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div 
                    onClick={() => setActivePage('firedrake')}
                    className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer space-y-3 group"
                  >
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 w-fit border border-amber-500/20 group-hover:scale-110 transition-transform">
                      <Flame className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Firedrake Çözüm</h3>
                    <p className="text-xs text-slate-400">Firedrake sunucusuna özel sorun bildirimleri ve yetkili talepleri.</p>
                  </div>

                  <div 
                    onClick={() => setActivePage('myko')}
                    className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer space-y-3 group"
                  >
                    <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 w-fit border border-cyan-500/20 group-hover:scale-110 transition-transform">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Myko Çözüm</h3>
                    <p className="text-xs text-slate-400">Myko sunucusuna özel sorun bildirimleri ve KC/hesap talepleri.</p>
                  </div>

                  <div 
                    onClick={() => setActivePage('light-farm')}
                    className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer space-y-3 group"
                  >
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Coins className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Light Farm Çözüm</h3>
                    <p className="text-xs text-slate-400">Light Farm sunucusuna özel teknik ve zindan sorun bildirimleri.</p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {activePage === 'firedrake' && (
            <SolutionCenterView
              centerKey="firedrake"
              title="Firedrake Çözüm Merkezi"
              description="Firedrake sunucusuna ait tüm sorun bildirimleri, drop/görev hataları ve yetkili talepleri."
              icon={<Flame className="w-6 h-6 text-amber-400" />}
              currentUser={user}
              onTicketUpdated={fetchStats}
            />
          )}

          {activePage === 'myko' && (
            <SolutionCenterView
              centerKey="myko"
              title="Myko Çözüm Merkezi"
              description="Myko sunucusuna ait tüm KC, hesap ve PUS sorun bildirimleri."
              icon={<ShieldAlert className="w-6 h-6 text-cyan-400" />}
              currentUser={user}
              onTicketUpdated={fetchStats}
            />
          )}

          {activePage === 'light-farm' && (
            <SolutionCenterView
              centerKey="light-farm"
              title="Light Farm Çözüm Merkezi"
              description="Light Farm sunucusuna ait teknik hatalar, zindan ve bağlantı sorun bildirimleri."
              icon={<Coins className="w-6 h-6 text-emerald-400" />}
              currentUser={user}
              onTicketUpdated={fetchStats}
            />
          )}

          {activePage === 'users' && user.role === 'super_admin' && (
            <UserManagementView currentUser={user} />
          )}

          {activePage === 'reports' && user.role === 'super_admin' && (
            <PerformanceReportView currentUser={user} />
          )}

          {activePage === 'settings' && (
            <SiteSettingsView currentUser={user} />
          )}
        </main>
      </div>

      {/* SAĞ ALT CANLI SESLİ BİLDİRİM TOAST POP-UP */}
      {liveToast && liveToast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl p-4 space-y-2 animate-bounce flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
              <Bell className="w-4 h-4 text-amber-400 animate-ring" />
              <span>{liveToast.title}</span>
            </div>
            <button 
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {liveToast.message}
          </p>

          <div className="text-[10px] text-amber-400/80 font-bold flex items-center gap-1 pt-1">
            <span>🔊 3 Defa Bildirim Sesi Çalındı</span>
          </div>
        </div>
      )}

    </div>
  );
};
