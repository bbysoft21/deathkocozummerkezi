import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Timer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from 'axios';
import { UserPerformanceModal } from './components/UserPerformanceModal';

interface TicketLog {
  id: number;
  subject: string;
  status: string;
  assigned_to: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
  } | null;
  created_at: string;
  assigned_at: string;
  in_progress_at: string | null;
  resolved_at: string | null;
  response_time_minutes: number | null;
  resolution_time_minutes: number | null;
  total_time_minutes: number | null;
}

interface StaffAnalytic {
  user: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
  };
  this_week_resolved_count: number;
  last_week_resolved_count: number;
  this_month_resolved_count: number;
  transferred_count?: number;
  avg_transfer_holding_minutes?: number;
  avg_response_minutes?: number;
  avg_resolution_process_minutes?: number;
  this_week_avg_minutes: number;
  last_week_avg_minutes: number;
  this_month_avg_minutes: number;
  trend: 'improving' | 'declining' | 'equal';
  count_change_percent: number;
}

interface GMAnalytic {
  user: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
  };
  this_week_created_count: number;
  last_week_created_count: number;
  this_month_created_count: number;
  total_created_count: number;
}

interface PerformanceReportViewProps {
  currentUser: {
    name: string;
    email: string;
    role: string;
  };
}

export const PerformanceReportView: React.FC<PerformanceReportViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<TicketLog[]>([]);
  const [staffAnalytics, setStaffAnalytics] = useState<StaffAnalytic[]>([]);
  const [gmAnalytics, setGmAnalytics] = useState<GMAnalytic[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGmSectionOpen, setIsGmSectionOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/v1/tickets/performance-analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setLogs(response.data.data.recent_logs);
        setStaffAnalytics(response.data.data.staff_analytics);
        if (response.data.data.gm_analytics) {
          setGmAnalytics(response.data.data.gm_analytics);
        }
      }
    } catch (err: any) {
      console.error('Fetch performance data error:', err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.reload();
        return;
      }
      setError(err.response?.data?.message || 'Performans raporu yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (mins: number | null) => {
    if (mins === null || mins === undefined) return 'Beklemede';
    if (mins < 60) return `${mins} dk`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours} saat ${remainingMins} dk`;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Db Editör';
      case 'damage_editor': return 'Damage Sorumlusu';
      case 'super_admin': return 'Süper Admin';
      default: return 'Yetkili';
    }
  };

  const filteredStaffAnalytics = staffAnalytics.filter((s) => {
    if (selectedStaffId === 'all') return true;
    return s.user.id === Number(selectedStaffId);
  });

  const filteredLogs = logs.filter((log) => {
    if (selectedStaffId === 'all') return true;
    return log.assigned_to && log.assigned_to.id === Number(selectedStaffId);
  });

  if (currentUser.role !== 'super_admin') {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 inline-block">
          <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-white">Erişim Engellendi</h2>
        <p className="text-sm text-slate-400">Performans ve Yetkili Analiz Raporlarına sadece **Süper Admin** erişebilir.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-[#22262a] via-[#22262a]/90 to-amber-950/40 border border-[#2a2f34] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white">Yetkili Performans & Analiz Raporu</h1>
              <p className="text-xs text-slate-400">Yetkili tepki süreleri, sorun çözme hızları, haftalık ilerleme/gerileme grafikleri.</p>
            </div>
          </div>
        </div>

        {/* Decorative Ambient Background */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Person Based Filter Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#22262a]/60 border border-[#2a2f34]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-white">Kişi Bazlı Rapor Filtresi:</span>
          <span className="text-[11px] text-slate-400">Performansı incelenecek yetkiliyi seçin</span>
        </div>

        <select
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-[#1a1d1e] border border-[#2a2f34] text-xs font-semibold text-amber-400 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
        >
          <option value="all">👥 Tüm Yetkililer Raporu (Genel)</option>
          {staffAnalytics.map((s) => (
            <option key={s.user.id} value={s.user.id}>
              👤 {s.user.name} ({getRoleLabel(s.user.role)})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Performans verileri ve haftalık analizler hesaplanıyor...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center text-xs">
          {error}
        </div>
      ) : (
        <>
          {/* SECTION 1: HAFTALIK VE AYLIK YETKİLİ İLERLEME/GERİLEME ANALİZ KARTLARI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Yetkili Çözüm Hızı ve Haftalık/Aylık Trend Analizi
              </h2>
              <span className="text-xs text-slate-500">Kıyaslama: Geçen Hafta vs Bu Hafta</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {filteredStaffAnalytics.map((staff) => (
                <div 
                  key={staff.user.id} 
                  onClick={() => setSelectedUserId(staff.user.id)}
                  className="p-5 rounded-3xl bg-[#22262a]/80 border border-[#2a2f34] space-y-4 relative overflow-hidden shadow-xl hover:border-amber-500/50 transition-all cursor-pointer group"
                >
                  {/* User Badge Top */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={staff.user.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                        alt={staff.user.name}
                        className="w-10 h-10 rounded-2xl object-cover border border-amber-500/30 shadow-md bg-[#1a1d1e]"
                      />
                      <div>
                        <h3 className="text-sm font-extrabold text-white">{staff.user.name}</h3>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {getRoleLabel(staff.user.role)}
                        </span>
                      </div>
                    </div>

                    {/* Trend Badge */}
                    {staff.trend === 'improving' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <ArrowUpRight className="w-4 h-4" /> İlerliyor
                      </span>
                    ) : staff.trend === 'declining' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <ArrowDownRight className="w-4 h-4" /> Geriliyor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#2a2f34] text-slate-400">
                        <Minus className="w-4 h-4" /> Sabit
                      </span>
                    )}
                  </div>

                  {/* Response & Resolution Average Times Breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#2a2f34]/60 text-[11px]">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                      <span className="text-[9px] text-cyan-400/80 block font-semibold">Ort. İşleme Alma Süresi</span>
                      <span className="font-extrabold text-xs">⚡ {formatMinutes(staff.avg_response_minutes ?? null)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      <span className="text-[9px] text-emerald-400/80 block font-semibold">Ort. İşlemden Çözüm</span>
                      <span className="font-extrabold text-xs">✅ {formatMinutes(staff.avg_resolution_process_minutes ?? null)}</span>
                    </div>
                  </div>

                  {/* Weekly & Monthly Stat Grids */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Bu Hafta Çözülen */}
                    <div className="p-3 rounded-2xl bg-[#1a1d1e] border border-[#2a2f34]/80 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Bu Hafta Çözülen</span>
                      <div className="text-lg font-black text-emerald-400">{staff.this_week_resolved_count} Sorun</div>
                      <span className="text-[9px] text-slate-500 block">Ort: {formatMinutes(staff.this_week_avg_minutes)}</span>
                    </div>

                    {/* Geçen Hafta Çözülen */}
                    <div className="p-3 rounded-2xl bg-[#1a1d1e] border border-[#2a2f34]/80 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Geçen Hafta</span>
                      <div className="text-lg font-black text-slate-300">{staff.last_week_resolved_count} Sorun</div>
                      <span className="text-[9px] text-slate-500 block">Ort: {formatMinutes(staff.last_week_avg_minutes)}</span>
                    </div>
                  </div>

                  {/* Monthly Summary Bar & Detail Action */}
                  <div className="p-3 rounded-2xl bg-[#1a1d1e]/60 border border-[#2a2f34]/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Bu Ay Toplam Çözülen:</span>
                      <span className="font-extrabold text-amber-400">{staff.this_month_resolved_count} Konu ({formatMinutes(staff.this_month_avg_minutes)} ort.)</span>
                    </div>
                    {staff.transferred_count !== undefined && staff.transferred_count > 0 && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#2a2f34]/40 text-amber-300">
                        <span>🔄 Başkasına Devredilen:</span>
                        <span className="font-bold">{staff.transferred_count} Konu (Ort. {formatMinutes(staff.avg_transfer_holding_minutes ?? null)} tutuldu)</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right pt-1">
                    <span className="text-[11px] font-bold text-amber-400 group-hover:underline inline-flex items-center gap-1">
                      Grafik ve Log Detayları →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: ZAMAN TAKİBİ DETAY TABLOSU (ATAMA -> İŞLEME ALMA -> TAMAMLAMA) */}
          <div className="space-y-4 pt-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Timer className="w-4 h-4 text-cyan-400" />
              Sorun Bazlı Süre Takibi ve Zaman Günlükleri
            </h2>

            <div className="bg-[#22262a]/60 border border-[#2a2f34]/80 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#1a1d1e]/80 border-b border-[#2a2f34] text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                    <tr>
                      <th className="py-4 px-6">Sorun Konusu</th>
                      <th className="py-4 px-4">Atanan Yetkili</th>
                      <th className="py-4 px-4">Atama Zamanı</th>
                      <th className="py-4 px-4">İşleme Alma Süresi</th>
                      <th className="py-4 px-4">Çözüm Süresi</th>
                      <th className="py-4 px-4">Toplam Geçen Süre</th>
                      <th className="py-4 px-6 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#2a2f34]/30 transition-colors">
                        
                        {/* Subject */}
                        <td className="py-4 px-6 font-extrabold text-white">
                          {log.subject}
                        </td>

                        {/* Assigned To */}
                        <td className="py-4 px-4">
                          {log.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400">{log.assigned_to.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a2f34] text-slate-400">
                                {getRoleLabel(log.assigned_to.role)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        {/* Assign Time */}
                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                          {new Date(log.assigned_at).toLocaleString('tr-TR')}
                        </td>

                        {/* Response Time (Atama -> İşleme Alma) */}
                        <td className="py-4 px-4">
                          {log.response_time_minutes !== null ? (
                            <span className="font-bold text-cyan-400">
                              ⚡ {formatMinutes(log.response_time_minutes)}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-italic">İşleme Alınmadı</span>
                          )}
                        </td>

                        {/* Resolution Time (İşlem -> Çözüm) */}
                        <td className="py-4 px-4">
                          {log.resolution_time_minutes !== null ? (
                            <span className="font-bold text-emerald-400">
                              ✅ {formatMinutes(log.resolution_time_minutes)}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-italic">Tamamlanmadı</span>
                          )}
                        </td>

                        {/* Total Time */}
                        <td className="py-4 px-4 font-mono text-slate-300">
                          {formatMinutes(log.total_time_minutes)}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            log.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                            log.status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {log.status === 'resolved' ? 'Çözüldü' : log.status === 'in_progress' ? 'İşlemde' : 'Açık'}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 3: GAME MASTER (GM) BİLDİRİM/KONU AÇMA ANALİZİ (AÇILIR / KAPANIR BUTON) */}
          <div className="space-y-4 pt-4">
            <button
              onClick={() => setIsGmSectionOpen(!isGmSectionOpen)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#22262a]/80 border border-[#2a2f34] hover:border-amber-500/50 transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                    Game Master (GM) Konu Açma Analizi (Haftalık & Aylık)
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a2f34] text-slate-400 font-normal">
                      {gmAnalytics.length} GM Kayıtlı
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">GM'lerin açtığı sorun bildirim sayılarını görmek için tıklayın</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                <span>{isGmSectionOpen ? 'İçeriği Gizle' : 'Detayları Göster'}</span>
                {isGmSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isGmSectionOpen && (
              <div className="bg-[#22262a]/60 border border-[#2a2f34]/80 rounded-3xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#1a1d1e]/80 border-b border-[#2a2f34] text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                      <tr>
                        <th className="py-4 px-6">Game Master</th>
                        <th className="py-4 px-4">Bu Hafta Açtığı Konu</th>
                        <th className="py-4 px-4">Geçen Hafta Açtığı Konu</th>
                        <th className="py-4 px-4">Bu Ay Açtığı Konu</th>
                        <th className="py-4 px-6 text-right">Toplam Açtığı Konu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {gmAnalytics.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">Henüz kayıtlı Game Master bulunmuyor.</td>
                        </tr>
                      ) : (
                        gmAnalytics.map((gm) => (
                          <tr 
                            key={gm.user.id} 
                            onClick={() => setSelectedUserId(gm.user.id)}
                            className="hover:bg-[#2a2f34]/50 transition-colors cursor-pointer group"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <img
                                  src={gm.user.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'}
                                  alt={gm.user.name}
                                  className="w-8 h-8 rounded-xl object-cover border border-indigo-500/30"
                                />
                                <div>
                                  <span className="font-extrabold text-white block">{gm.user.name}</span>
                                  <span className="text-[10px] text-indigo-400 font-semibold">Game Master</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-bold text-amber-400">
                              {gm.this_week_created_count} Konu
                            </td>
                            <td className="py-4 px-4 text-slate-400">
                              {gm.last_week_created_count} Konu
                            </td>
                            <td className="py-4 px-4 font-bold text-emerald-400">
                              {gm.this_month_created_count} Konu
                            </td>
                             <td className="py-4 px-6 text-right font-mono font-bold text-white">
                              <span className="group-hover:text-amber-400 transition-colors">{gm.total_created_count} Konu →</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* User Performance Detail Modal */}
      {selectedUserId && (
        <UserPerformanceModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

    </div>
  );
};
