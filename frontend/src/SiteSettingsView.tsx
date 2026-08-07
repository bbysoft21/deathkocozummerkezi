import React, { useState } from 'react';
import {
  Settings,
  Database,
  Trash2,
  ShieldCheck,
  Globe,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';

interface SiteSettingsViewProps {
  currentUser: {
    name: string;
    email: string;
    role: string;
  };
}

export const SiteSettingsView: React.FC<SiteSettingsViewProps> = ({ currentUser }) => {
  // Kurumsal Genel Ayarlar State
  const [siteTitle, setSiteTitle] = useState('DeathKO Çözüm Merkezi');
  const [siteDesc, setSiteDesc] = useState('DeathKO Knight Online Sunucuları Destek ve Çözüm Yönetim Portalı');
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [maxUploadSize, setMaxUploadSize] = useState('5MB');

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Database Optimizasyonu State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [cleaningDb, setCleaningDb] = useState(false);
  const [dbCleanMsg, setDbCleanMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);

    setTimeout(() => {
      setSavingSettings(false);
      setSettingsMsg({ type: 'success', text: 'Genel site ayarları başarıyla kaydedildi.' });
      setTimeout(() => setSettingsMsg(null), 3000);
    }, 600);
  };

  const handleCleanDatabase = async () => {
    setCleaningDb(true);
    setDbCleanMsg(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post('/api/v1/users/clean-database', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDbCleanMsg({
          type: 'success',
          text: response.data.message || 'Veritabanı optimizasyonu tamamlandı. Süper Admin hariç tüm eski veriler temizlendi.'
        });
        setConfirmModalOpen(false);
      }
    } catch (err: any) {
      console.error('Clean database error:', err);
      setDbCleanMsg({
        type: 'error',
        text: err.response?.data?.message || 'Veritabanı temizleme işlemi sırasında bir hata oluştu.'
      });
    } finally {
      setCleaningDb(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-xl shadow-xl" style={{ backgroundColor: 'rgba(34,38,42,0.7)', border: '1px solid rgba(52,58,64,0.8)' }}>
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl" style={{ backgroundColor: 'rgba(255,185,56,0.10)', border: '1px solid rgba(255,185,56,0.20)', color: '#ffb938' }}>
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">Site Ayarları & Sistem Yönetimi</h1>
            <p className="text-xs mt-0.5" style={{ color: '#8a9099' }}>Kurumsal genel yapılandırma ve veritabanı optimizasyon paneli</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl w-fit" style={{ backgroundColor: 'rgba(255,185,56,0.10)', border: '1px solid rgba(255,185,56,0.25)', color: '#ffb938' }}>
          <ShieldCheck className="w-4 h-4" />
          <span>Kurumsal Yönetici Modu</span>
        </div>
      </div>

      {dbCleanMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${dbCleanMsg.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{dbCleanMsg.text}</span>
        </div>
      )}

      {/* Grid: Genel Ayarlar & Database Optimizasyonu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* SOL: Kurumsal Genel Site Ayarları */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl p-6 shadow-2xl space-y-5" style={{ backgroundColor: 'rgba(34,38,42,0.9)', border: '1px solid rgba(255,185,56,0.20)' }}>
            <div className="flex items-center gap-2 text-sm font-extrabold pb-3" style={{ color: '#ffb938', borderBottom: '1px solid #343a40' }}>
              <Globe className="w-4 h-4" style={{ color: '#ffb938' }} />
              <span>Genel Yapılandırma</span>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {settingsMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{settingsMsg.text}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold block" style={{ color: '#ffb938' }}>Portal Başlığı</label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none"
                  style={{ backgroundColor: '#1a1d1e', border: '1px solid #343a40' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#ffb938')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#343a40')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold block" style={{ color: '#ffb938' }}>Açıklama & Meta Bilgisi</label>
                <textarea
                  rows={3}
                  value={siteDesc}
                  onChange={(e) => setSiteDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none"
                  style={{ backgroundColor: '#1a1d1e', border: '1px solid #343a40' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#ffb938')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#343a40')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block" style={{ color: '#ffb938' }}>Maksimum Görsel Yükleme Boyutu</label>
                  <select
                    value={maxUploadSize}
                    onChange={(e) => setMaxUploadSize(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs text-white focus:outline-none"
                    style={{ backgroundColor: '#1a1d1e', border: '1px solid #343a40' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffb938')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#343a40')}
                  >
                    <option value="2MB">2 MB</option>
                    <option value="5MB">5 MB (Önerilen)</option>
                    <option value="10MB">10 MB</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold block" style={{ color: '#ffb938' }}>Sipariş & Bildirim Sesleri</label>
                  <button
                    type="button"
                    onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={notificationSoundEnabled
                      ? { backgroundColor: '#ffb938', color: '#1a1d1e', border: '1px solid #ffd080', boxShadow: '0 4px 12px rgba(255,185,56,0.25)' }
                      : { backgroundColor: '#1a1d1e', border: '1px solid #343a40', color: '#8a9099' }
                    }
                  >
                    <span>{notificationSoundEnabled ? '🔊 Sesli Uyarılar Aktif' : '🔇 Sesler Kapalı'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-3 rounded-xl font-black text-xs tracking-wide cursor-pointer disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #ffb938, #e6a020)', color: '#1a1d1e', boxShadow: '0 6px 20px rgba(255,185,56,0.30)', border: '1px solid #ffd080' }}
                >
                  {savingSettings ? 'AYARLAR KAYDEDİLİYOR...' : 'GENEL AYARLARI KAYDET'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SAĞ: Database Optimizasyonu ve Temizleme */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden" style={{ backgroundColor: 'rgba(34,38,42,0.9)', border: '1px solid rgba(255,185,56,0.20)' }}>
            <div className="absolute top-0 right-0 p-8 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: 'rgba(255,185,56,0.04)' }} />

            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #343a40' }}>
              <div className="flex items-center gap-2 text-sm font-extrabold" style={{ color: '#ffb938' }}>
                <Database className="w-4 h-4" style={{ color: '#ffb938' }} />
                <span>Veritabanı Optimizasyonu</span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider" style={{ backgroundColor: '#ffb938', color: '#1a1d1e' }}>
                Süper Admin
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              Veritabanını optimize ederek performansı artırır. Sistemdeki eski sorun kayıtlarını, logları, bildirimleri ve <b style={{ color: '#ffb938' }}>Süper Admin hariç tüm kullanıcıları</b> kalıcı olarak temizler.
            </p>

            <div className="p-3.5 rounded-2xl text-[11px] space-y-2" style={{ backgroundColor: '#1a1d1e', border: '1px solid #343a40', color: '#c0c8d0' }}>
              <div className="font-extrabold flex items-center gap-1.5" style={{ color: '#ffb938' }}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Optimizasyon İşlemi Neleri Kapsar?</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Sistemdeki tüm bilet ve sorun bildirimleri silinir.</li>
                <li>Tüm kullanıcı bildirimleri temizlenir.</li>
                <li><b>Süper Admin hariç</b> tüm Db Editör, Damage ve GM hesapları kaldırılır.</li>
                <li>Veritabanı tablosu dizinleri optimize edilir.</li>
              </ul>
            </div>

            {currentUser.role === 'super_admin' ? (
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="w-full py-3 rounded-xl font-black text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #ffb938, #e6a020)', color: '#1a1d1e', boxShadow: '0 6px 20px rgba(255,185,56,0.28)', border: '1px solid #ffd080' }}
              >
                <Trash2 className="w-4 h-4" style={{ color: '#1a1d1e' }} />
                <span>VERİTABANI OPTİMİZASYONUNU BAŞLAT</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl text-center text-xs font-bold" style={{ backgroundColor: '#1a1d1e', color: '#8a9099', border: '1px solid #343a40' }}>
                🔒 Bu işlem sadece Süper Admin yetkisine açıktır.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR DATABASE CLEANING */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(26,29,30,0.88)' }}>
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4" style={{ backgroundColor: '#22262a', border: '2px solid #ffb938' }}>
            <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid #343a40' }}>
              <div className="p-2.5 rounded-2xl" style={{ backgroundColor: 'rgba(255,185,56,0.15)', color: '#ffb938', border: '1px solid rgba(255,185,56,0.35)' }}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Kritik İşlem Onayı</h3>
                <span className="text-xs font-bold" style={{ color: '#ffb938' }}>Veritabanı Verileri Silinecek</span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              Bu işlem geri alınamaz! <b>Süper Admin hariç</b> tüm yetkili hesapları, Game Master hesapları, açılan biletler ve veriler tamamen silinecektir. Devam etmek istiyor musunuz?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                disabled={cleaningDb}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#2a2f34', color: '#c0c8d0', border: '1px solid #343a40' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333940')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2a2f34')}
              >
                İptal Et
              </button>

              <button
                onClick={handleCleanDatabase}
                disabled={cleaningDb}
                className="px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#ffb938', color: '#1a1d1e', boxShadow: '0 4px 16px rgba(255,185,56,0.30)', border: '1px solid #ffd080' }}
              >
                {cleaningDb ? (
                  <span>Optimizasyon Yapılıyor...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" style={{ color: '#1a1d1e' }} />
                    <span>EVET, TEMİZLE VE OPTİMİZE ET</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
