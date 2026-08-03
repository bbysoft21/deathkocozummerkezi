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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">Site Ayarları & Sistem Yönetimi</h1>
            <p className="text-xs text-slate-400 mt-0.5">Kurumsal genel yapılandırma ve veritabanı optimizasyon paneli</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 w-fit">
          <ShieldCheck className="w-4 h-4" />
          <span>Kurumsal Yönetici Modu</span>
        </div>
      </div>

      {dbCleanMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
          dbCleanMsg.type === 'success'
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
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-amber-400 border-b border-slate-800 pb-3">
              <Globe className="w-4 h-4 text-amber-400" />
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
                <label className="text-xs font-bold text-amber-300 block">Portal Başlığı</label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 block">Açıklama & Meta Bilgisi</label>
                <textarea
                  rows={3}
                  value={siteDesc}
                  onChange={(e) => setSiteDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-300 block">Maksimum Görsel Yükleme Boyutu</label>
                  <select
                    value={maxUploadSize}
                    onChange={(e) => setMaxUploadSize(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="2MB">2 MB</option>
                    <option value="5MB">5 MB (Önerilen)</option>
                    <option value="10MB">10 MB</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-300 block">Sipariş & Bildirim Sesleri</label>
                  <button
                    type="button"
                    onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      notificationSoundEnabled
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{notificationSoundEnabled ? '🔊 Sesli Uyarılar Aktif' : '🔇 Sesler Kapalı'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-amber-500/30 cursor-pointer disabled:opacity-50 transition-all border border-amber-300"
                >
                  {savingSettings ? 'AYARLAR KAYDEDİLİYOR...' : 'GENEL AYARLARI KAYDET'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SAĞ: Database Optimizasyonu ve Temizleme */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-amber-400">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Veritabanı Optimizasyonu</span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black uppercase tracking-wider">
                Süper Admin
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              Veritabanını optimize ederek performansı artırır. Sistemdeki eski sorun kayıtlarını, logları, bildirimleri ve <b className="text-amber-400">Süper Admin hariç tüm kullanıcıları</b> kalıcı olarak temizler.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-2">
              <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Optimizasyon İşlemi Neleri Kapsar?</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Sistemdeki tüm bilet ve sorun bildirimleri silinir.</li>
                <li>Tüm kullanıcı bildirimleri temizlenir.</li>
                <li><b>Süper Admin hariç</b> tüm Db Editör, Damage ve GM hesapları kaldırılır.</li>
                <li>Veritabanı tablosu dizinleri optimize edilir.</li>
              </ul>
            </div>

            {currentUser.role === 'super_admin' ? (
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
              >
                <Trash2 className="w-4 h-4 text-slate-950" />
                <span>VERİTABANI OPTİMİZASYONUNU BAŞLAT</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 text-slate-400 text-center text-xs font-bold border border-slate-800">
                🔒 Bu işlem sadece Süper Admin yetkisine açıktır.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR DATABASE CLEANING */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Kritik İşlem Onayı</h3>
                <span className="text-xs text-amber-400 font-bold">Veritabanı Verileri Silinecek</span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              Bu işlem geri alınamaz! <b>Süper Admin hariç</b> tüm yetkili hesapları, Game Master hesapları, açılan biletler ve veriler tamamen silinecektir. Devam etmek istiyor musunuz?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                disabled={cleaningDb}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-extrabold text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                İptal Et
              </button>

              <button
                onClick={handleCleanDatabase}
                disabled={cleaningDb}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 border border-amber-300"
              >
                {cleaningDb ? (
                  <span>Optimizasyon Yapılıyor...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-slate-950" />
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
