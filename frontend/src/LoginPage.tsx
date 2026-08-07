import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Server } from 'lucide-react';
import axios from 'axios';
import faviconLogo from '../public/favicon.webp';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userSession, setUserSession] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post('/api/v1/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { user, access_token } = response.data.data;
        localStorage.setItem('auth_token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('login_time', Date.now().toString());
        onLoginSuccess(user);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.response && err.response.data && err.response.data.errors) {
        const firstErr = Object.values(err.response.data.errors)[0] as string[];
        setErrorMessage(firstErr[0] || 'Giriş yapılamadı.');
      } else {
        setErrorMessage('Sunucuya bağlanılamadı. Lütfen backend servisinizin çalıştığından emin olun.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUserSession(null);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ backgroundColor: '#1a1d1e' }}>
      {/* Background Image with Dark Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('/bg-game.png')` }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #1a1d1e 0%, rgba(26,29,30,0.85) 60%, rgba(26,29,30,0.5) 100%)' }} />

      {/* Floating Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ backgroundColor: 'rgba(255,185,56,0.07)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />

      {/* Container */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-6 space-y-6 text-left hidden lg:block pr-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wider uppercase backdrop-blur-md" 
               style={{ backgroundColor: 'rgba(255,185,56,0.08)', borderColor: 'rgba(255,185,56,0.18)', color: '#ffb938' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#ffb938' }} />
            <span>DeathKO Çözüm Merkezi</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Yetkili &amp; Yönetim Portalına <br />
            <span className="text-gradient-gold">Hoş Geldiniz</span>
          </h1>

          <p className="text-base leading-relaxed" style={{ color: '#8a9099' }}>
            DeathKO Knight Online sunucularının tüm yetkili taleplerini, canlı oyun içi sorun bildirimlerini, görev ve veritabanı akışlarını tek bir güvenli panelden yönetin.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(34,38,42,0.7)', border: '1px solid rgba(52,58,64,0.8)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,185,56,0.10)', color: '#ffb938' }}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Süper Admin Yetkisi</h4>
                  <p className="text-xs" style={{ color: '#8a9099' }}>Tam sistem kontrolü</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(34,38,42,0.7)', border: '1px solid rgba(52,58,64,0.8)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Çoklu Oyun Desteği</h4>
                  <p className="text-xs" style={{ color: '#8a9099' }}>Dinamik veritabanı</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="glass-panel glow-orange p-8 rounded-3xl relative overflow-hidden">
            
            {/* Top Border Accent */}
            <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: 'linear-gradient(to right, #ffb938, #ffd080, #ffb938)' }} />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex p-2.5 rounded-2xl shadow-xl mb-3 ring-4 backdrop-blur-md ring-[rgba(255,185,56,0.10)]"
                   style={{ backgroundColor: 'rgba(26,29,30,0.95)', border: '1px solid rgba(255,185,56,0.35)', boxShadow: '0 8px 32px rgba(255,185,56,0.12)' }}>
                <img src={faviconLogo} alt="DeathKO Logo" className="w-12 h-12 object-contain rounded-xl" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide">Yönetici Girişi</h2>
              <p className="text-xs mt-1" style={{ color: '#8a9099' }}>Lütfen yetkili hesabınızla giriş yapın</p>
            </div>

            {/* Success State */}
            {userSession ? (
              <div className="space-y-6 text-center py-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-semibold text-sm">Giriş Başarılı!</span>
                </div>

                <div className="p-4 rounded-xl text-left space-y-2" style={{ backgroundColor: 'rgba(26,29,30,0.9)', border: '1px solid var(--clr-border)' }}>
                  <div className="text-xs" style={{ color: '#8a9099' }}>Kullanıcı Adı: <span className="text-white font-medium">{userSession.name}</span></div>
                  <div className="text-xs" style={{ color: '#8a9099' }}>E-posta: <span className="text-white font-medium">{userSession.email}</span></div>
                  <div className="text-xs" style={{ color: '#8a9099' }}>Rol: <span className="font-semibold uppercase" style={{ color: '#ffb938' }}>{userSession.role}</span></div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 rounded-xl text-white font-medium text-sm transition-all duration-200"
                  style={{ backgroundColor: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--clr-surface-3)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--clr-surface-2)')}
                >
                  Oturumu Kapat
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleLogin} className="space-y-5">

                {/* Error Alert */}
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#c0c8d0' }}>
                    E-Posta Adresi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: '#8a9099' }}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm transition-all placeholder:text-[#5a6270] focus:outline-none"
                      style={{ backgroundColor: 'rgba(26,29,30,0.9)', border: '1px solid var(--clr-border)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#ffb938')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--clr-border)')}
                      placeholder="bbysoft21@gmail.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#c0c8d0' }}>
                      Şifre
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: '#8a9099' }}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl text-white text-sm transition-all placeholder:text-[#5a6270] focus:outline-none"
                      style={{ backgroundColor: 'rgba(26,29,30,0.9)', border: '1px solid var(--clr-border)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#ffb938')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--clr-border)')}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                      style={{ color: '#8a9099' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#c0c8d0')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#8a9099')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Options */}
                <div className="flex items-center justify-between text-xs pt-1" style={{ color: '#8a9099' }}>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="rounded" style={{ accentColor: '#ffb938' }} />
                    <span>Beni Hatırla</span>
                  </label>
                  <span className="hover:underline cursor-pointer" style={{ color: '#ffb938' }}>Şifremi Unuttum</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm tracking-wide transition-all duration-200 shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  style={{ 
                    background: 'linear-gradient(135deg, #ffb938 0%, #e6a020 100%)',
                    color: '#1a1d1e',
                    boxShadow: '0 8px 24px rgba(255,185,56,0.25)'
                  }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1a1d1e', borderTopColor: 'transparent' }} />
                  ) : (
                    <>
                      <span>Sisteme Giriş Yap</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer Notice */}
            <div className="mt-8 text-center text-xs" style={{ color: '#5a6270' }}>
              DeathKO Co-Züm Merkezi &copy; {new Date().getFullYear()} - Tüm Hakları Saklıdır
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
