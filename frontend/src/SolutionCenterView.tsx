import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2,
  User, 
  UserCheck,
  RefreshCw,
  X,
  Calendar,
  Image as ImageIcon,
  Upload,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface AssignableUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Ticket {
  id: number;
  uuid: string;
  subject: string;
  message: string;
  image_path?: string;
  solution_center: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_response?: string;
  created_at: string;
  resolved_at?: string;
  reassigned_at?: string;
  category?: Category;
  user?: UserInfo;
  assignedTo?: UserInfo;
  reassignedFrom?: UserInfo;
  resolver?: UserInfo;
}

interface SolutionCenterViewProps {
  centerKey: 'firedrake' | 'myko' | 'light-farm';
  title: string;
  description: string;
  icon: React.ReactNode;
  currentUser: { name: string; email: string; role: string };
  onTicketUpdated?: () => void;
}

export const SolutionCenterView: React.FC<SolutionCenterViewProps> = ({
  centerKey,
  title,
  description,
  icon,
  currentUser,
  onTicketUpdated
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal State for New Ticket
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<number | string>('');
  const [assignedToId, setAssignedToId] = useState<number | string>('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority] = useState<string>('medium');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Toast Notification State (Sağ alt bildirim)
  const [toastNotification, setToastNotification] = useState<{ show: boolean; creator: string; subject: string }>({
    show: false,
    creator: '',
    subject: ''
  });

  // Modal State for Admin Response / Status Change
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState<number | string>('');
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [centerKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      const [ticketsRes, catRes] = await Promise.all([
        axios.get(`/api/v1/tickets?center=${centerKey}`, { headers: authHeader }),
        axios.get('/api/v1/ticket-categories', { headers: authHeader })
      ]);

      if (ticketsRes.data.success) {
        setTickets(ticketsRes.data.data);
      }
      if (catRes.data.success) {
        const catData = catRes.data.data;
        if (Array.isArray(catData)) {
          setCategories(catData);
          if (catData.length > 0) setNewCategoryId(catData[0].id);
        } else if (catData.categories) {
          setCategories(catData.categories);
          if (catData.categories.length > 0) setNewCategoryId(catData.categories[0].id);
          if (catData.assignable_users) {
            setAssignableUsers(catData.assignable_users);
          }
        }
      }
    } catch (err: any) {
      console.error('Data fetch error:', err);
      if (err.response && err.response.status === 401) {
        // Token suresi dolmussa veya gecersizse oturumu otomatik yenilet/kapat
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const formData = new FormData();
      formData.append('solution_center', centerKey);
      formData.append('ticket_category_id', String(newCategoryId));
      formData.append('subject', newSubject);
      formData.append('message', newMessage);
      formData.append('priority', newPriority);
      if (assignedToId) {
        formData.append('assigned_to_id', String(assignedToId));
      }
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const response = await axios.post('/api/v1/tickets', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setIsModalOpen(false);
        setNewSubject('');
        setNewMessage('');
        setAssignedToId('');
        setSelectedFile(null);
        setImagePreview(null);
        
        // Sağ alt bildirim toastunu göster
        const createdTicket = response.data.data;
        const creatorName = createdTicket.user?.name || currentUser.name;
        setToastNotification({
          show: true,
          creator: creatorName,
          subject: createdTicket.subject
        });

        fetchData();
        if (onTicketUpdated) onTicketUpdated();

        // 5 saniye sonra bildirimi otomatik kapat
        setTimeout(() => {
          setToastNotification({ show: false, creator: '', subject: '' });
        }, 5000);
      }
    } catch (err: any) {
      console.error('Create ticket error:', err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDropStatusChange = async (ticketId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      // Optimistic UI Update (Sürükler sürüklemez ekranda anında taşı)
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus as any } : t));

      const response = await axios.patch(`/api/v1/tickets/${ticketId}/status`, {
        status: newStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        fetchData();
        if (onTicketUpdated) onTicketUpdated();
      }
    } catch (err: any) {
      console.error('Drag & Drop status update error:', err);
      fetchData(); // Hata durumunda eski verileri geri yükle
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.patch(`/api/v1/tickets/${selectedTicket.id}/status`, {
        status,
        admin_response: adminResponseText || selectedTicket.admin_response,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedTicket(null);
        setAdminResponseText('');
        fetchData();
        if (onTicketUpdated) onTicketUpdated();
      }
    } catch (err: any) {
      console.error('Update status error:', err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedTicket || !reassignTargetId) return;
    setIsReassigning(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`/api/v1/tickets/${selectedTicket.id}/reassign`, {
        assigned_to_id: reassignTargetId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedTicket(null);
        setReassignTargetId('');
        fetchData();
        if (onTicketUpdated) onTicketUpdated();
      }
    } catch (err: any) {
      console.error('Reassign ticket error:', err);
      alert(err.response?.data?.message || 'Kart devredilirken bir hata oluştu.');
    } finally {
      setIsReassigning(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const userName = t.user?.name || '';
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent': return <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase">Acil</span>;
      case 'high': return <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">Yüksek</span>;
      case 'medium': return <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase">Normal</span>;
      default: return <span className="px-2 py-0.5 rounded-md bg-[#2a2f34] text-slate-400 text-[10px] font-bold uppercase">Düşük</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'open': return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase flex items-center gap-1.5"><Clock className="w-3 h-3" /> Açık</span>;
      case 'in_progress': return <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" /> İşlemde</span>;
      case 'resolved': return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Çözüldü</span>;
      default: return <span className="px-2.5 py-1 rounded-full bg-[#2a2f34] text-slate-400 text-[10px] font-bold uppercase">Kapatıldı</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="p-6 rounded-3xl bg-[#22262a]/80 border border-[#2a2f34] backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase font-semibold">
                Çözüm Merkezi
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sorun Bildirimi</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#22262a]/40 border border-[#2a2f34]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Oluşturan yetkili veya bildirim ara..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1a1d1e]/80 border border-[#2a2f34] text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-[#22262a] text-slate-400 border border-[#2a2f34] hover:text-white'
              }`}
            >
              {status === 'all' ? 'Tümü' : status === 'open' ? 'Açık' : status === 'in_progress' ? 'İşlemde' : status === 'resolved' ? 'Çözüldü' : 'Kapatıldı'}
            </button>
          ))}
        </div>
      </div>

      {/* 3'lü Sütun Yapısı: Solda Beklemede (Açık), Ortada İşlemde Olan, Sağda Çözüldü */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. SÜTUN: BEKLEMEDE OLANLAR (open) */}
          {(() => {
            const pendingTickets = filteredTickets.filter(t => t.status === 'open');
            return (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const ticketId = e.dataTransfer.getData('ticketId');
                  if (ticketId) handleDropStatusChange(Number(ticketId), 'open');
                }}
                className="space-y-4 bg-[#22262a]/40 p-4 rounded-3xl border border-[#2a2f34]/80 min-h-[350px] transition-colors hover:border-amber-500/30"
              >
                <div className="flex items-center justify-between px-2 pb-2 border-b border-[#2a2f34]">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Beklemede Olanlar</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                    {pendingTickets.length}
                  </span>
                </div>

                {pendingTickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-[#1a1d1e]/40 rounded-2xl border border-[#2a2f34]/40 border-dashed">
                    Bekleyen talep yok (Buraya sürükleyebilirsiniz)
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingTickets.map((t) => (
                      <div 
                        key={t.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('ticketId', String(t.id));
                        }}
                        onClick={() => { setSelectedTicket(t); setAdminResponseText(t.admin_response || ''); }}
                        className="p-5 rounded-3xl bg-[#22262a]/70 border border-[#2a2f34] hover:border-amber-500/50 transition-all duration-200 cursor-grab active:cursor-grabbing flex flex-col justify-between space-y-4 group hover:shadow-xl hover:shadow-amber-500/5 relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(t.status)}
                              {getPriorityBadge(t.priority)}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">#{t.uuid.substring(0, 8)}</span>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                            {t.subject}
                          </h3>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {t.message}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#2a2f34]/80 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            {t.category ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#1a1d1e] text-slate-300 text-[10px] border border-[#2a2f34] font-medium">
                                {t.category.name}
                              </span>
                            ) : <span />}

                            {t.image_path && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Görsel
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">Açan: <b className="text-slate-200">{t.user?.name || 'Anonim'}</b></span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0 text-[10px] text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(t.created_at).toLocaleDateString('tr-TR')}
                            </span>
                          </div>

                          {t.assignedTo && (
                            <div className="flex items-center justify-between text-[11px] text-cyan-400 pt-1.5 border-t border-[#2a2f34]/40">
                              <span className="flex items-center gap-1.5 truncate">
                                <UserCheck className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                                <span className="truncate">
                                  Atanan Yetkili: <b className="text-cyan-300">{t.assignedTo.name}</b>
                                </span>
                              </span>
                            </div>
                          )}

                          {t.reassignedFrom && (
                            <div className="flex items-center justify-between text-[10px] text-amber-400/90 pt-1">
                              <span className="flex items-center gap-1 truncate">
                                <RefreshCw className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">Devreden: <b>{t.reassignedFrom.name}</b></span>
                              </span>
                              {t.reassigned_at && (
                                <span className="text-[9px] text-slate-500">
                                  {new Date(t.reassigned_at).toLocaleDateString('tr-TR')}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="pt-2 text-right">
                            <span className="text-xs text-amber-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                              İncele & Yanıtla &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 2. SÜTUN: İŞLEMDE OLANLAR (in_progress) */}
          {(() => {
            const inProgressTickets = filteredTickets.filter(t => t.status === 'in_progress');
            return (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const ticketId = e.dataTransfer.getData('ticketId');
                  if (ticketId) handleDropStatusChange(Number(ticketId), 'in_progress');
                }}
                className="space-y-4 bg-[#22262a]/40 p-4 rounded-3xl border border-[#2a2f34]/80 min-h-[350px] transition-colors hover:border-cyan-500/30"
              >
                <div className="flex items-center justify-between px-2 pb-2 border-b border-[#2a2f34]">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>İşlemde Olanlar</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                    {inProgressTickets.length}
                  </span>
                </div>

                {inProgressTickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-[#1a1d1e]/40 rounded-2xl border border-[#2a2f34]/40 border-dashed">
                    İşlemde olan talep yok (Buraya sürükleyebilirsiniz)
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inProgressTickets.map((t) => (
                      <div 
                        key={t.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('ticketId', String(t.id));
                        }}
                        onClick={() => { setSelectedTicket(t); setAdminResponseText(t.admin_response || ''); }}
                        className="p-5 rounded-3xl bg-[#22262a]/70 border border-[#2a2f34] hover:border-cyan-500/50 transition-all duration-200 cursor-grab active:cursor-grabbing flex flex-col justify-between space-y-4 group hover:shadow-xl hover:shadow-cyan-500/5 relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(t.status)}
                              {getPriorityBadge(t.priority)}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">#{t.uuid.substring(0, 8)}</span>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                            {t.subject}
                          </h3>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {t.message}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#2a2f34]/80 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            {t.category ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#1a1d1e] text-slate-300 text-[10px] border border-[#2a2f34] font-medium">
                                {t.category.name}
                              </span>
                            ) : <span />}

                            {t.image_path && (
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Görsel
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">Açan: <b className="text-slate-200">{t.user?.name || 'Anonim'}</b></span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0 text-[10px] text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(t.created_at).toLocaleDateString('tr-TR')}
                            </span>
                          </div>

                          {t.assignedTo && (
                            <div className="flex items-center justify-between text-[11px] text-cyan-400 pt-1.5 border-t border-[#2a2f34]/40">
                              <span className="flex items-center gap-1.5 truncate">
                                <UserCheck className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                                <span className="truncate">
                                  Atanan Yetkili: <b className="text-cyan-300">{t.assignedTo.name}</b>
                                </span>
                              </span>
                            </div>
                          )}

                          {t.reassignedFrom && (
                            <div className="flex items-center justify-between text-[10px] text-amber-400/90 pt-1">
                              <span className="flex items-center gap-1 truncate">
                                <RefreshCw className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">Devreden: <b>{t.reassignedFrom.name}</b></span>
                              </span>
                              {t.reassigned_at && (
                                <span className="text-[9px] text-slate-500">
                                  {new Date(t.reassigned_at).toLocaleDateString('tr-TR')}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="pt-2 text-right">
                            <span className="text-xs text-cyan-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                              İncele & Yanıtla &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. SÜTUN: ÇÖZÜLDÜ (resolved veya closed) */}
          {(() => {
            const resolvedTickets = filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
            return (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const ticketId = e.dataTransfer.getData('ticketId');
                  if (ticketId) handleDropStatusChange(Number(ticketId), 'resolved');
                }}
                className="space-y-4 bg-[#22262a]/40 p-4 rounded-3xl border border-[#2a2f34]/80 min-h-[350px] transition-colors hover:border-emerald-500/30"
              >
                <div className="flex items-center justify-between px-2 pb-2 border-b border-[#2a2f34]">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Çözüldü</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    {resolvedTickets.length}
                  </span>
                </div>

                {resolvedTickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-[#1a1d1e]/40 rounded-2xl border border-[#2a2f34]/40 border-dashed">
                    Çözülmüş talep yok (Buraya sürükleyebilirsiniz)
                  </div>
                ) : (
                  <div className="space-y-4">
                    {resolvedTickets.map((t) => (
                      <div 
                        key={t.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('ticketId', String(t.id));
                        }}
                        onClick={() => { setSelectedTicket(t); setAdminResponseText(t.admin_response || ''); }}
                        className="p-5 rounded-3xl bg-[#22262a]/70 border border-[#2a2f34] hover:border-emerald-500/50 transition-all duration-200 cursor-grab active:cursor-grabbing flex flex-col justify-between space-y-4 group hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(t.status)}
                              {getPriorityBadge(t.priority)}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">#{t.uuid.substring(0, 8)}</span>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                            {t.subject}
                          </h3>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {t.message}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#2a2f34]/80 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            {t.category ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#1a1d1e] text-slate-300 text-[10px] border border-[#2a2f34] font-medium">
                                {t.category.name}
                              </span>
                            ) : <span />}

                            {t.image_path && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Görsel
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">Açan: <b className="text-slate-200">{t.user?.name || 'Anonim'}</b></span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0 text-[10px] text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(t.created_at).toLocaleDateString('tr-TR')}
                            </span>
                          </div>

                          {t.resolver && (
                            <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-1 border-t border-[#2a2f34]/40">
                              <span className="flex items-center gap-1.5 truncate">
                                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Çözen: <b className="text-emerald-300">{t.resolver.name}</b></span>
                              </span>
                              {t.resolved_at && (
                                <span className="text-[10px] text-emerald-400/80">
                                  {new Date(t.resolved_at).toLocaleDateString('tr-TR')}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="pt-2 text-right">
                            <span className="text-xs text-emerald-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                              İncele & Yanıtla &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      )}

      {/* New Ticket Modal (Pop-up): Order: Başlık -> Kategori -> Mesaj -> Görsel Ekleme */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1d1e]/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#22262a] border border-[#2a2f34] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Yeni Sorun Bildirimi Oluştur</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              
              {/* 1. Başlık (Subject) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1d1e] border border-[#2a2f34] text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Örn: Görev Ödülü Yüklenmedi"
                />
              </div>

              {/* 2. Kategori (Category) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => {
                    const catId = Number(e.target.value);
                    setNewCategoryId(catId);
                    
                    const selectedCat = categories.find(c => c.id === catId);
                    if (selectedCat) {
                      const catName = selectedCat.name.toLowerCase();
                      if (catName.includes('database')) {
                        const dbEditor = assignableUsers.find(u => u.role === 'admin') || assignableUsers[0];
                        if (dbEditor) setAssignedToId(dbEditor.id);
                      } else if (catName.includes('damage')) {
                        const dmgEditor = assignableUsers.find(u => u.role === 'damage_editor') || assignableUsers[0];
                        if (dmgEditor) setAssignedToId(dmgEditor.id);
                      } else if (catName.includes('rehber')) {
                        const guideEditor = assignableUsers.find(u => u.role === 'guide_editor') || assignableUsers[0];
                        if (guideEditor) setAssignedToId(guideEditor.id);
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1d1e] border border-[#2a2f34] text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* 3. Soruna Müdahale Edecek Yetkili Seçimi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Müdahale Edecek Yetkili (İsteğe Bağlı)</span>
                  {categories.find(c => c.id === Number(newCategoryId))?.name.toLowerCase().includes('database') && (
                    <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                      ⚡ Db Editörler Listeleniyor
                    </span>
                  )}
                  {categories.find(c => c.id === Number(newCategoryId))?.name.toLowerCase().includes('damage') && (
                    <span className="text-[10px] text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30">
                      🎯 Damage Sorumluları Listeleniyor
                    </span>
                  )}
                  {categories.find(c => c.id === Number(newCategoryId))?.name.toLowerCase().includes('rehber') && (
                    <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                      📚 Rehber Sorumluları Listeleniyor
                    </span>
                  )}
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1d1e] border border-[#2a2f34] text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Herhangi Bir Yetkili / Genel --</option>
                  {assignableUsers
                    .filter(u => {
                      const selectedCat = categories.find(c => c.id === Number(newCategoryId));
                      if (!selectedCat) return true;
                      const catName = selectedCat.name.toLowerCase();
                      if (catName.includes('database')) {
                        return u.role === 'admin' || u.role === 'super_admin';
                      }
                      if (catName.includes('damage')) {
                        return u.role === 'damage_editor' || u.role === 'super_admin';
                      }
                      if (catName.includes('rehber')) {
                        return u.role === 'guide_editor' || u.role === 'super_admin';
                      }
                      return true;
                    })
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'admin' ? 'Db Editör' : u.role === 'damage_editor' ? 'Damage Sorumlusu' : u.role === 'guide_editor' ? 'Rehber Sorumlusu' : 'Yönetici'})
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Seçtiğiniz yetkiliye bu sorun konusu hakkında anında bildirim gönderilir.
                </p>
              </div>

              {/* 3. Mesaj Alanı (Message) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mesaj
                </label>
                <textarea
                  required
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1d1e] border border-[#2a2f34] text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Sorun detayını buraya açıklayın..."
                />
              </div>

              {/* 4. Görsel Ekleme Alanı (Image Upload) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Görsel Ekle (Opsiyonel Ekran Görüntüsü)
                </label>
                <div className="relative border-2 border-dashed border-[#2a2f34] hover:border-amber-500/50 rounded-xl p-4 text-center bg-[#1a1d1e] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  {imagePreview ? (
                    <div className="flex items-center justify-between gap-3">
                      <img src={imagePreview} alt="Önizleme" className="w-16 h-16 object-cover rounded-lg border border-[#343a40]" />
                      <div className="text-left flex-1">
                        <span className="text-xs font-semibold text-white block truncate">{selectedFile?.name}</span>
                        <span className="text-[10px] text-slate-500 block">Değiştirmek için tıklayın</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setImagePreview(null); }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                      <Upload className="w-5 h-5 text-amber-500" />
                      <span className="text-xs font-medium text-slate-300">Resim Yüklemek İçin Tıklayın veya Sürükleyin</span>
                      <span className="text-[10px] text-slate-600">PNG, JPG, WEBP (Max 5MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#2a2f34] text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {submitting ? 'Gönderiliyor...' : 'Bildirimi Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail / Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1d1e]/80 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-[#22262a] border border-[#2a2f34] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Bildirim Detayı</h2>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#1a1d1e] border border-[#2a2f34] space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 border-b border-[#2a2f34] pb-3">
                <div>Oluşturan Yetkili: <b className="text-white block">{selectedTicket.user?.name || 'Bilinmiyor'}</b></div>
                <div>Oluşturma Tarihi: <b className="text-white block">{new Date(selectedTicket.created_at).toLocaleString('tr-TR')}</b></div>
                {selectedTicket.resolver && (
                  <div>Çözen Yetkili: <b className="text-emerald-400 block">{selectedTicket.resolver.name}</b></div>
                )}
                {selectedTicket.resolved_at && (
                  <div>Çözüm Tarihi: <b className="text-emerald-400 block">{new Date(selectedTicket.resolved_at).toLocaleString('tr-TR')}</b></div>
                )}
              </div>
              
              <h3 className="text-sm font-bold text-amber-400">{selectedTicket.subject}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedTicket.message}</p>

              {/* Display Attached Image if exists */}
              {selectedTicket.image_path && (
                <div className="pt-2 border-t border-slate-900 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" /> Eklenen Ekran Görüntüsü:
                  </span>
                  <a href={selectedTicket.image_path} target="_blank" rel="noreferrer" className="block relative group">
                    <img 
                      src={selectedTicket.image_path} 
                      alt="Ekran Görüntüsü" 
                      className="w-full max-h-56 object-cover rounded-xl border border-[#2a2f34] group-hover:opacity-90 transition-opacity"
                    />
                    <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-[#1a1d1e]/80 text-amber-400 text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm">
                      Tam Boyut Gör <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                </div>
              )}
            </div>

            {/* Response Section */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Yönetici / Çözüm Yanıtı</label>
              <textarea
                rows={3}
                value={adminResponseText}
                onChange={(e) => setAdminResponseText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1d1e] border border-[#2a2f34] text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="Talebe yanıt yazın..."
              />
            </div>

            {/* Kartı Başka Adminde Devretme Alanı */}
            {['super_admin', 'admin', 'damage_editor', 'guide_editor'].includes(currentUser.role) && (
              selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? (
                <div className="p-3.5 rounded-2xl bg-[#1a1d1e]/50 border border-[#2a2f34]/50 space-y-2 opacity-70">
                  <label className="block text-xs font-semibold text-slate-400 flex items-center justify-between">
                    <span>Kartı Devretme (Kilitli) 🔒</span>
                  </label>
                  <p className="text-[10px] text-slate-500">Bu bildirim çözüldüğü için artık başka bir yetkiliye devredilemez.</p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 space-y-2">
                  <label className="block text-xs font-semibold text-cyan-300 flex items-center justify-between">
                    <span>Kartı Başka Bir Admin / Yetkiliye Devret 🔄</span>
                    <span className="text-[10px] text-cyan-400/80 font-normal">Devredildiği andan itibaren devredilen yetkilinin rapor süresi başlar</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={reassignTargetId}
                      onChange={(e) => setReassignTargetId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#1a1d1e] border border-[#2a2f34] text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Devredilecek Admin / Yetkili Seçin...</option>
                      {assignableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === 'admin' ? 'Db Editör' : u.role === 'damage_editor' ? 'Damage Sorumlusu' : u.role === 'guide_editor' ? 'Rehber Sorumlusu' : 'Yönetici'})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleReassign}
                      disabled={!reassignTargetId || isReassigning}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-md"
                    >
                      {isReassigning ? 'Devrediliyor...' : 'Kartı Devret'}
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Quick Status Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2">
              {currentUser.role === 'super_admin' ? (
                selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? (
                  <div className="text-xs text-emerald-400/90 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                    ✅ Bu bildirim çözüldüğü için işlem statüsü kilitlendi.
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus('in_progress')}
                      disabled={updatingStatus}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      {updatingStatus ? 'Güncelleniyor...' : 'İşleme Al'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={updatingStatus}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      {updatingStatus ? 'Güncelleniyor...' : 'Çözüldü İşaretle'}
                    </button>
                  </div>
                )
              ) : (
                <div className="text-xs text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                  ⚠️ Kartları işleme alma yetkisi yalnızca Süper Admin hesabı için geçerlidir.
                </div>
              )}

              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-[#2a2f34] text-slate-300 text-xs font-semibold cursor-pointer hover:bg-[#343a40]"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Right Toast Notification */}
      {toastNotification.show && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#22262a] border border-amber-500/40 text-slate-100 shadow-2xl shadow-amber-500/10 flex items-center gap-3.5 animate-bounce">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Yeni Sorun Bildirimi Eklendi</span>
            <span className="text-[11px] text-slate-400 block">
              <b className="text-amber-400">{toastNotification.creator}</b> tarafından: "{toastNotification.subject}"
            </span>
          </div>
          <button 
            onClick={() => setToastNotification({ show: false, creator: '', subject: '' })}
            className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};

