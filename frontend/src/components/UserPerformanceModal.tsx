import React, { useEffect, useState } from 'react';
import { 
  X, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  TrendingUp,
  Activity
} from 'lucide-react';
import axios from 'axios';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface UserPerformanceModalProps {
  userId: number | null;
  onClose: () => void;
}

interface UserDetailData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  opened_tickets: Array<{
    id: number;
    subject: string;
    status: string;
    priority: string;
    solution_center: string;
    category: string | null;
    assigned_to: string | null;
    created_at: string;
    resolved_at: string | null;
  }>;
  resolved_tickets: Array<{
    id: number;
    subject: string;
    status: string;
    priority: string;
    solution_center: string;
    category: string | null;
    opened_by: string;
    created_at: string;
    resolved_at: string | null;
    resolution_minutes: number | null;
  }>;
  chart_data: Array<{
    date: string;
    opened: number;
    resolved: number;
  }>;
}

export const UserPerformanceModal: React.FC<UserPerformanceModalProps> = ({ userId, onClose }) => {
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'opened' | 'resolved'>('opened');

  useEffect(() => {
    if (userId) {
      fetchUserDetail(userId);
    }
  }, [userId]);

  const fetchUserDetail = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      const res = await axios.get(`/api/v1/tickets/performance-analytics/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setData(res.data.data);
        if (res.data.data.resolved_tickets.length > 0 && res.data.data.opened_tickets.length === 0) {
          setActiveTab('resolved');
        }
      }
    } catch (err: any) {
      console.error('Fetch user detail error:', err);
      setError(err.response?.data?.message || 'Kullanıcı detayları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">Süper Admin</span>;
      case 'admin':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">Db Editör</span>;
      case 'damage_editor':
        return <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold">Damage Sorumlusu</span>;
      case 'guide_editor':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold">Rehber Sorumlusu</span>;
      case 'game_master':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">Game Master</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs font-bold">Kullanıcı</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">AÇIK</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">İŞLEMDE</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">ÇÖZÜLDÜ</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 border border-slate-600 text-[10px] font-bold">KAPATILDI</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">{status}</span>;
    }
  };

  const formatMinutes = (mins: number | null) => {
    if (mins === null || mins === undefined) return '-';
    if (mins < 60) return `${mins} dk`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours} saat ${remainingMins} dk`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1d1e]/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#22262a] border border-[#2a2f34] rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-[#1a1d1e] border-b border-[#2a2f34] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {data?.user?.avatar ? (
              <img src={data.user.avatar} alt={data.user.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xl shadow-lg">
                {data?.user?.name ? data.user.name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">{data?.user?.name || 'Yükleniyor...'}</h2>
                {data?.user && getRoleBadge(data.user.role)}
              </div>
              <p className="text-xs text-slate-400 mt-1">{data?.user?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[#2a2f34] text-slate-400 hover:text-white hover:bg-[#343a40] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Performans ve aktivite grafiği yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 inline-block">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-xs text-rose-400 font-medium">{error}</p>
          </div>
        ) : data ? (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#1a1d1e] border border-[#2a2f34] flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Toplam Açtığı Konu</span>
                  <span className="text-xl font-black text-white">{data.opened_tickets.length}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1a1d1e] border border-[#2a2f34] flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Toplam Çözdüğü Konu</span>
                  <span className="text-xl font-black text-white">{data.resolved_tickets.length}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1a1d1e] border border-[#2a2f34] flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Aktif Çözüm Oranı</span>
                  <span className="text-xl font-black text-white">
                    {data.opened_tickets.length + data.resolved_tickets.length > 0 
                      ? `%${Math.round((data.resolved_tickets.length / (data.opened_tickets.length + data.resolved_tickets.length)) * 100) || 100}`
                      : '%100'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recharts Chart Section */}
            <div className="p-5 rounded-3xl bg-[#1a1d1e] border border-[#2a2f34] space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Son 14 Günlük Aktivite Trend Grafiği</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Açılan Konu
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Çözülen Konu
                  </span>
                </div>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffb938" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ffb938" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2f34" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#22262a', borderColor: '#2a2f34', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="opened" name="Açılan Konu" stroke="#ffb938" strokeWidth={2} fillOpacity={1} fill="url(#colorOpened)" />
                    <Area type="monotone" dataKey="resolved" name="Çözülen Konu" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Log Tabs & Table */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[#2a2f34] pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('opened')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeTab === 'opened'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                        : 'bg-[#1a1d1e] text-slate-400 border border-[#2a2f34] hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Açtığı Konular ({data.opened_tickets.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('resolved')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeTab === 'resolved'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md'
                        : 'bg-[#1a1d1e] text-slate-400 border border-[#2a2f34] hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Çözdüğü / Üstlendiği Konular ({data.resolved_tickets.length})</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Opened Tickets */}
              {activeTab === 'opened' && (
                <div className="bg-[#1a1d1e] border border-[#2a2f34] rounded-2xl overflow-hidden">
                  {data.opened_tickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Bu kullanıcının açtığı herhangi bir sorun bildirimi / konu bulunmuyor.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#22262a] border-b border-[#2a2f34] text-slate-400 uppercase tracking-wider text-[10px] font-extrabold">
                            <th className="py-3 px-4"># ID</th>
                            <th className="py-3 px-4">Başlık</th>
                            <th className="py-3 px-4">Çözüm Merkezi / Kategori</th>
                            <th className="py-3 px-4">Atanan Yetkili</th>
                            <th className="py-3 px-4">Durum</th>
                            <th className="py-3 px-4">Tarih</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2f34] text-xs">
                          {data.opened_tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-[#22262a]/50 transition-colors">
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-500">#{t.id}</td>
                              <td className="py-3 px-4 font-bold text-white">{t.subject}</td>
                              <td className="py-3 px-4 text-slate-300">
                                <span className="uppercase text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mr-1.5">
                                  {t.solution_center}
                                </span>
                                {t.category && <span className="text-slate-400">{t.category}</span>}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {t.assigned_to ? (
                                  <span className="text-cyan-400 font-semibold">{t.assigned_to}</span>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Atanmadı</span>
                                )}
                              </td>
                              <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                              <td className="py-3 px-4 text-slate-400 text-[11px]">
                                {new Date(t.created_at).toLocaleDateString('tr-TR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Resolved Tickets */}
              {activeTab === 'resolved' && (
                <div className="bg-[#1a1d1e] border border-[#2a2f34] rounded-2xl overflow-hidden">
                  {data.resolved_tickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Bu kullanıcının henüz çözdüğü veya üstlendiği konu kaydı bulunmuyor.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#22262a] border-b border-[#2a2f34] text-slate-400 uppercase tracking-wider text-[10px] font-extrabold">
                            <th className="py-3 px-4"># ID</th>
                            <th className="py-3 px-4">Başlık</th>
                            <th className="py-3 px-4">Açan Yetkili</th>
                            <th className="py-3 px-4">Çözüm Süresi</th>
                            <th className="py-3 px-4">Durum</th>
                            <th className="py-3 px-4">Tamamlanma Tarihi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2f34] text-xs">
                          {data.resolved_tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-[#22262a]/50 transition-colors">
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-500">#{t.id}</td>
                              <td className="py-3 px-4 font-bold text-white">{t.subject}</td>
                              <td className="py-3 px-4 text-amber-400 font-semibold">{t.opened_by}</td>
                              <td className="py-3 px-4 text-slate-300">
                                <span className="font-mono text-emerald-400 font-bold">
                                  {formatMinutes(t.resolution_minutes)}
                                </span>
                              </td>
                              <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                              <td className="py-3 px-4 text-slate-400 text-[11px]">
                                {t.resolved_at ? new Date(t.resolved_at).toLocaleDateString('tr-TR') : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        ) : null}

        {/* Footer */}
        <div className="p-4 bg-[#1a1d1e] border-t border-[#2a2f34] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2a2f34] hover:bg-[#343a40] text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
