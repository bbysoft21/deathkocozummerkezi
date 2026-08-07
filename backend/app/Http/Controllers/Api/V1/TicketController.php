<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    /**
     * Belirli çözüm merkezine ait biletleri getir (firedrake, myko, light-farm)
     */
    /**
     * Belirli çözüm merkezine ait biletleri getir (firedrake, myko, light-farm)
     */
    public function index(Request $request)
    {
        $solutionCenter = $request->query('center');

        $query = Ticket::with(['category', 'user', 'assignedTo', 'reassignedFrom', 'resolver']);

        if ($solutionCenter) {
            $query->where('solution_center', $solutionCenter);
        }

        if ($request->query('status')) {
            $query->where('status', $request->query('status'));
        }

        $tickets = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $tickets
        ]);
    }

    /**
     * Genel Bakış İstatistikleri (Kullanıcı Rolüne Göre Özelleştirilmiş)
     */
    public function stats()
    {
        $user = auth('sanctum')->user();

        // Eğer kullanıcı super_admin veya Game Master (user) ise tüm bilet istatistiklerini/sorunları görür!
        // Eğer kullanıcı yetkili ise (admin, damage_editor, guide_editor) sadece kendisine atanan/çözdüğü biletlerin sayılarını görür!
        $query = Ticket::query();

        if ($user && in_array($user->role, ['admin', 'damage_editor', 'guide_editor'])) {
            // Yetkiliye özel: Kendisine atanan veya kendisi tarafından çözülenler
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to_id', $user->id)
                  ->orWhere('resolved_by_id', $user->id);
            });
        }

        $resolvedCount = (clone $query)->where('status', 'resolved')->count();
        $pendingCount = (clone $query)->where('status', 'open')->count();
        $inProgressCount = (clone $query)->where('status', 'in_progress')->count();
        $closedCount = (clone $query)->where('status', 'closed')->count();
        $totalCount = (clone $query)->count();

        // Her çözüm merkezindeki aktif (open veya in_progress) sorun sayıları
        $firedrakeActive = (clone $query)->where('solution_center', 'firedrake')->whereIn('status', ['open', 'in_progress'])->count();
        $mykoActive = (clone $query)->where('solution_center', 'myko')->whereIn('status', ['open', 'in_progress'])->count();
        $lightFarmActive = (clone $query)->where('solution_center', 'light-farm')->whereIn('status', ['open', 'in_progress'])->count();

        return response()->json([
            'success' => true,
            'data' => [
                'resolved' => $resolvedCount,
                'pending' => $pendingCount,
                'in_progress' => $inProgressCount,
                'closed' => $closedCount,
                'total' => $totalCount,
                'centers' => [
                    'firedrake' => $firedrakeActive,
                    'myko' => $mykoActive,
                    'light_farm' => $lightFarmActive,
                ]
            ]
        ]);
    }

    /**
     * Kategorileri ve Atanabilir Kullanıcıları Getir
     */
    public function categories()
    {
        // 'guncelleme' kategorisinin varligindan emin ol
        TicketCategory::updateOrCreate(
            ['slug' => 'guncelleme'],
            [
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'name' => 'Güncelleme',
                'description' => 'Sistem güncellemeleri, versiyon/yama değişiklikleri ve güncellemeler'
            ]
        );

        $categories = TicketCategory::all();

        // Sadece Db Editörlerini ('admin') getir
        $assignableUsers = \App\Models\User::where('role', 'admin')
            ->where('status', 'active')
            ->select('id', 'name', 'email', 'role', 'avatar')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $categories,
                'assignable_users' => $assignableUsers
            ]
        ]);
    }

    /**
     * Yeni bilet / sorun bildirimi oluştur (Görsel yükleme ve Yetkiliye Atama destekli)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'solution_center' => 'required|in:firedrake,myko,light-farm',
            'ticket_category_id' => 'required|exists:ticket_categories,id',
            'assigned_to_id' => 'nullable|exists:users,id',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('tickets', 'public');
        }

        $assignedToId = $validated['assigned_to_id'] ?? null;

        $ticket = Ticket::create([
            'uuid' => (string) Str::uuid(),
            'ticket_category_id' => $validated['ticket_category_id'],
            'user_id' => auth('sanctum')->id(),
            'assigned_to_id' => $assignedToId,
            'assigned_at' => $assignedToId ? now() : null,
            'solution_center' => $validated['solution_center'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'image_path' => $imagePath ? '/storage/' . $imagePath : null,
            'priority' => $validated['priority'] ?? 'medium',
            'status' => 'open',
        ]);

        // Eğer bilet bir yetkiliye atandıysa o kişiye özel bildirim oluştur
        if ($ticket->assigned_to_id) {
            \App\Models\UserNotification::create([
                'user_id' => $ticket->assigned_to_id,
                'ticket_id' => $ticket->id,
                'title' => 'Size Yeni Bir Sorun Atandı! 🚨',
                'message' => '"' . $ticket->subject . '" başlıklı sorun müdahale etmeniz için size aktarıldı.',
                'is_read' => false
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sorun bildirimi başarıyla oluşturuldu.',
            'data' => $ticket->load(['category', 'user', 'assignedTo'])
        ], 201);
    }

    /**
     * Bilet Durumu Güncelle veya Yanıtla
     */
    public function updateStatus(Request $request, $id)
    {
        $user = auth('sanctum')->user();
        $ticket = Ticket::findOrFail($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Yetkisiz erişim.'
            ], 401);
        }

        // Yetkilendirme Kuralları:
        // 1. super_admin her durumu güncelleyebilir.
        // 2. admin / damage_editor / guide_editor durum güncelleyebilir.
        // 3. Bir sorun kişiye atandıysa (assigned_to_id), SADECE atanan yetkili veya super_admin çözebilir/kapatabilir!
        if ($ticket->assigned_to_id && $ticket->assigned_to_id !== $user->id && $user->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bu sorun özel olarak başka bir yetkiliye tanımlanmıştır. Yalnızca tanımlı kişi (' . ($ticket->assignedTo->name ?? 'Yetkili') . ') ve Süper Admin müdahale edebilir.'
            ], 403);
        }

        if (!in_array($user->role, ['super_admin', 'admin', 'damage_editor', 'guide_editor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Bu işlemi yapmaya yetkiniz bulunmamaktadır.'
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
            'admin_response' => 'nullable|string',
        ]);
        
        $ticket->status = $validated['status'];
        if (isset($validated['admin_response'])) {
            $ticket->admin_response = $validated['admin_response'];
        }

        // İlk defa işleme alınıyorsa in_progress_at kaydet
        if ($validated['status'] === 'in_progress' && !$ticket->in_progress_at) {
            $ticket->in_progress_at = now();
        }

        // Çözüldü veya Kapatıldı ise resolved_at kaydet
        if ($validated['status'] === 'resolved' || $validated['status'] === 'closed') {
            if (!$ticket->in_progress_at) {
                $ticket->in_progress_at = now();
            }
            $ticket->resolved_at = now();
            $ticket->resolved_by_id = auth('sanctum')->id();
        }

        $ticket->save();

        // Sadece bildirimi oluşturan kullanıcıya (ticket owner) özel bildirim oluştur
        if ($ticket->user_id) {
            $statusText = match ($validated['status']) {
                'in_progress' => 'İşleme Alındı',
                'resolved' => 'Çözüldü',
                'closed' => 'Kapatıldı',
                default => 'Güncellendi'
            };

            \App\Models\UserNotification::create([
                'user_id' => $ticket->user_id,
                'ticket_id' => $ticket->id,
                'title' => "Sorun Bildiriminiz " . $statusText,
                'message' => "'{$ticket->subject}' konulu bildiriminiz Süper Admin tarafından '{$statusText}' durumuna getirildi." . (isset($validated['admin_response']) ? " Yanıt: {$validated['admin_response']}" : ''),
                'is_read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bilet durumu başarıyla güncellendi.',
            'data' => $ticket->load(['category', 'user', 'assignedTo', 'reassignedFrom', 'resolver'])
        ]);
    }

    /**
     * Bilet / Kart Devretme (Super Admin veya Admin/Editör rolündekiler başka adminlere devredebilir)
     */
    public function reassign(Request $request, $id)
    {
        $user = auth('sanctum')->user();
        $ticket = Ticket::findOrFail($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Yetkisiz erişim.'
            ], 401);
        }

        // Kartı devreden kişinin yetkili (admin/super_admin/editor) olması gerekir
        if (!in_array($user->role, ['super_admin', 'admin', 'damage_editor', 'guide_editor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Kart devretme yetkiniz bulunmamaktadır.'
            ], 403);
        }

        // Eğer bilet başkasına atanmışsa ve devretmeye çalışan kişi o kişi/super_admin değilse engelle
        if ($ticket->assigned_to_id && $ticket->assigned_to_id !== $user->id && $user->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Yalnızca kartın atandığı yetkili veya Süper Admin kartı başkasına devredebilir.'
            ], 403);
        }

        $validated = $request->validate([
            'assigned_to_id' => 'required|exists:users,id',
        ]);

        $newAssignee = \App\Models\User::findOrFail($validated['assigned_to_id']);

        if ($newAssignee->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Kart sadece Db Editörü rolündeki yetkililere devredilebilir.'
            ], 422);
        }

        $previousAssigneeId = $ticket->assigned_to_id ?? $user->id;

        // Devir Bilgilerini Güncelle:
        // Devreden kişi recorded
        $ticket->reassigned_from_id = $previousAssigneeId;
        $ticket->assigned_to_id = $newAssignee->id;
        $ticket->assigned_at = now();
        $ticket->reassigned_at = now();
        
        // Önemli: Devredildiği andan itibaren devredilen admin için rapor/performans süresi sıfırdan başlasın
        // Dolayısıyla in_progress_at sıfırlanır, devredilen admin kartı tekrar işleme aldığında in_progress_at yeni zaman olur.
        $ticket->in_progress_at = null;
        $ticket->save();

        // Devredilen Yeni Yetkiliye Bildirim
        \App\Models\UserNotification::create([
            'user_id' => $newAssignee->id,
            'ticket_id' => $ticket->id,
            'title' => 'Devredilen Yeni Kart! 🔄',
            'message' => "'{$ticket->subject}' konulu kart {$user->name} tarafından size devredildi.",
            'is_read' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Kart başarıyla {$newAssignee->name} yetkilisine devredildi.",
            'data' => $ticket->load(['category', 'user', 'assignedTo', 'reassignedFrom', 'resolver'])
        ]);
    }

    /**
     * Kullanıcının Kendi Özel Bildirimlerini Getir
     */
    public function notifications()
    {
        $userId = auth('sanctum')->id();
        $notifications = \App\Models\UserNotification::where('user_id', $userId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }

    /**
     * Bildirimi Okundu Olarak İşaretle
     */
    public function markNotificationRead($id)
    {
        $userId = auth('sanctum')->id();
        $notification = \App\Models\UserNotification::where('user_id', $userId)->findOrFail($id);
        $notification->is_read = true;
        $notification->save();

        return response()->json([
            'success' => true,
            'message' => 'Bildirim okundu olarak işaretlendi.'
        ]);
    }

    /**
     * Süper Admin Performans ve Analiz Raporu
     * Süreler: Atamadan işleme alma süresi (Response Time), İşlemden tamamlamaya süresi (Resolution Time)
     * Analizler: Haftalık değişim (ilerleme/gerileme), Geçen hafta vs Bu Hafta ve Aylık kıyaslama
     */
    public function performanceAnalytics(Request $request)
    {
        $user = auth('sanctum')->user();
        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bu rapora yalnızca Süper Adminler erişebilir.'
            ], 403);
        }

        $now = now();
        $thisWeekStart = $now->copy()->startOfWeek();
        $lastWeekStart = $now->copy()->subWeek()->startOfWeek();
        $lastWeekEnd = $now->copy()->subWeek()->endOfWeek();
        $thisMonthStart = $now->copy()->startOfMonth();

        // 1. Yetkili Bazlı Performans Detayları (Son Biletler)
        $tickets = Ticket::with(['assignedTo', 'reassignedFrom', 'user', 'category'])
            ->whereNotNull('assigned_to_id')
            ->latest()
            ->get();

        $ticketLogs = $tickets->map(function ($t) {
            // Eğer kart bir başkası tarafından devredilmişse, devredilen admin için süre devir anından (reassigned_at / assigned_at) başlar
            $assignTime = $t->assigned_at ? $t->assigned_at : $t->created_at;
            
            // Atamadan İşleme Alınma Süresi (Dakika)
            $responseMinutes = null;
            if ($t->in_progress_at) {
                $responseMinutes = round(\Carbon\Carbon::parse($assignTime)->diffInMinutes(\Carbon\Carbon::parse($t->in_progress_at)));
            }

            // İşlemden Tamamlanmaya Süresi (Dakika)
            $resolutionMinutes = null;
            if ($t->in_progress_at && $t->resolved_at) {
                $resolutionMinutes = round(\Carbon\Carbon::parse($t->in_progress_at)->diffInMinutes(\Carbon\Carbon::parse($t->resolved_at)));
            }

            // Toplam Çözüm Süresi (Devir/Atama anından Tamamlanmaya - Dakika)
            $totalMinutes = null;
            if ($t->resolved_at) {
                $totalMinutes = round(\Carbon\Carbon::parse($assignTime)->diffInMinutes(\Carbon\Carbon::parse($t->resolved_at)));
            }

            return [
                'id' => $t->id,
                'subject' => $t->subject,
                'status' => $t->status,
                'assigned_to' => $t->assignedTo ? [
                    'id' => $t->assignedTo->id,
                    'name' => $t->assignedTo->name,
                    'role' => $t->assignedTo->role,
                    'avatar' => $t->assignedTo->avatar,
                ] : null,
                'created_at' => \Carbon\Carbon::parse($t->created_at)->toDateTimeString(),
                'assigned_at' => $t->assigned_at ? \Carbon\Carbon::parse($t->assigned_at)->toDateTimeString() : \Carbon\Carbon::parse($t->created_at)->toDateTimeString(),
                'in_progress_at' => $t->in_progress_at ? \Carbon\Carbon::parse($t->in_progress_at)->toDateTimeString() : null,
                'resolved_at' => $t->resolved_at ? \Carbon\Carbon::parse($t->resolved_at)->toDateTimeString() : null,
                'response_time_minutes' => $responseMinutes,
                'resolution_time_minutes' => $resolutionMinutes,
                'total_time_minutes' => $totalMinutes,
            ];
        });

        // 2. Yetkili Bazında İlerleme / Gerileme Analizi (Süper Admin Hariç: Db Editör, Damage Sorumlusu, Rehber Sorumlusu vb.)
        $staffMembers = \App\Models\User::whereIn('role', ['admin', 'damage_editor', 'guide_editor'])->get();

        $staffPerformance = $staffMembers->map(function ($staff) use ($thisWeekStart, $lastWeekStart, $lastWeekEnd, $thisMonthStart) {
            // Bu Hafta Çözülenler
            $thisWeekResolved = Ticket::where('assigned_to_id', $staff->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->where('resolved_at', '>=', $thisWeekStart)
                ->get();

            // Geçen Hafta Çözülenler
            $lastWeekResolved = Ticket::where('assigned_to_id', $staff->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->whereBetween('resolved_at', [$lastWeekStart, $lastWeekEnd])
                ->get();

            // Bu Ay Çözülenler
            $thisMonthResolved = Ticket::where('assigned_to_id', $staff->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->where('resolved_at', '>=', $thisMonthStart)
                ->get();

            // Ortalama Çözüm Süresi Hesabı (Bu Hafta vs Geçen Hafta)
            $calcAvgResolution = function ($collection) {
                if ($collection->isEmpty()) return 0;
                $totalMins = 0;
                $count = 0;
                foreach ($collection as $t) {
                    if ($t->resolved_at) {
                        $start = $t->assigned_at ?: $t->created_at;
                        $totalMins += \Carbon\Carbon::parse($start)->diffInMinutes(\Carbon\Carbon::parse($t->resolved_at));
                        $count++;
                    }
                }
                return $count > 0 ? round($totalMins / $count, 1) : 0;
            };

            $thisWeekAvgMins = $calcAvgResolution($thisWeekResolved);
            $lastWeekAvgMins = $calcAvgResolution($lastWeekResolved);
            $monthAvgMins = $calcAvgResolution($thisMonthResolved);

            // İlerleme / Gerileme Trend Analizi (% Değişim)
            $countDiff = $thisWeekResolved->count() - $lastWeekResolved->count();
            $trend = 'equal';
            if ($countDiff > 0 || ($thisWeekAvgMins > 0 && $thisWeekAvgMins < $lastWeekAvgMins)) {
                $trend = 'improving'; // İlerliyor
            } else if ($countDiff < 0 || ($thisWeekAvgMins > $lastWeekAvgMins && $lastWeekAvgMins > 0)) {
                $trend = 'declining'; // Geriliyor
            }

            return [
                'user' => [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'role' => $staff->role,
                    'avatar' => $staff->avatar,
                ],
                'this_week_resolved_count' => $thisWeekResolved->count(),
                'last_week_resolved_count' => $lastWeekResolved->count(),
                'this_month_resolved_count' => $thisMonthResolved->count(),
                'this_week_avg_minutes' => $thisWeekAvgMins,
                'last_week_avg_minutes' => $lastWeekAvgMins,
                'this_month_avg_minutes' => $monthAvgMins,
                'trend' => $trend,
                'count_change_percent' => $lastWeekResolved->count() > 0 
                    ? round((($thisWeekResolved->count() - $lastWeekResolved->count()) / $lastWeekResolved->count()) * 100, 1)
                    : ($thisWeekResolved->count() > 0 ? 100 : 0)
            ];
        });

        // 3. Game Master'ların (GM / User) Haftalık ve Aylık Açtığı Konu/Sorun Sayısı Analizi
        $gameMasters = \App\Models\User::where('role', 'user')->get();

        $gmAnalytics = $gameMasters->map(function ($gm) use ($thisWeekStart, $lastWeekStart, $lastWeekEnd, $thisMonthStart) {
            $thisWeekCreated = Ticket::where('user_id', $gm->id)->where('created_at', '>=', $thisWeekStart)->count();
            $lastWeekCreated = Ticket::where('user_id', $gm->id)->whereBetween('created_at', [$lastWeekStart, $lastWeekEnd])->count();
            $thisMonthCreated = Ticket::where('user_id', $gm->id)->where('created_at', '>=', $thisMonthStart)->count();
            $totalCreated = Ticket::where('user_id', $gm->id)->count();

            return [
                'user' => [
                    'id' => $gm->id,
                    'name' => $gm->name,
                    'role' => $gm->role,
                    'avatar' => $gm->avatar,
                ],
                'this_week_created_count' => $thisWeekCreated,
                'last_week_created_count' => $lastWeekCreated,
                'this_month_created_count' => $thisMonthCreated,
                'total_created_count' => $totalCreated,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'recent_logs' => $ticketLogs,
                'staff_analytics' => $staffPerformance,
                'gm_analytics' => $gmAnalytics
            ]
        ]);
    }

    public function userPerformanceDetail(Request $request, $userId)
    {
        $currentUser = auth('sanctum')->user();
        if (!$currentUser || $currentUser->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bu rapora yalnızca Süper Adminler erişebilir.'
            ], 403);
        }

        $targetUser = \App\Models\User::find($userId);
        if (!$targetUser) {
            return response()->json([
                'success' => false,
                'message' => 'Kullanıcı bulunamadı.'
            ], 404);
        }

        // Açtığı konular (Created Tickets)
        $openedTickets = Ticket::with(['assignedTo', 'category'])
            ->where('user_id', $userId)
            ->latest()
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'subject' => $t->subject,
                    'status' => $t->status,
                    'priority' => $t->priority,
                    'solution_center' => $t->solution_center,
                    'category' => $t->category ? $t->category->name : null,
                    'assigned_to' => $t->assignedTo ? $t->assignedTo->name : null,
                    'created_at' => \Carbon\Carbon::parse($t->created_at)->toDateTimeString(),
                    'resolved_at' => $t->resolved_at ? \Carbon\Carbon::parse($t->resolved_at)->toDateTimeString() : null,
                ];
            });

        // Çözdüğü / Üstlendiği konular (Assigned & Resolved Tickets)
        $resolvedTickets = Ticket::with(['user', 'category'])
            ->where('assigned_to_id', $userId)
            ->latest()
            ->get()
            ->map(function ($t) {
                $assignTime = $t->assigned_at ?: $t->created_at;
                $resolutionMinutes = null;
                if ($t->resolved_at) {
                    $resolutionMinutes = round(\Carbon\Carbon::parse($assignTime)->diffInMinutes(\Carbon\Carbon::parse($t->resolved_at)));
                }

                return [
                    'id' => $t->id,
                    'subject' => $t->subject,
                    'status' => $t->status,
                    'priority' => $t->priority,
                    'solution_center' => $t->solution_center,
                    'category' => $t->category ? $t->category->name : null,
                    'opened_by' => $t->user ? $t->user->name : 'Anonim',
                    'created_at' => \Carbon\Carbon::parse($t->created_at)->toDateTimeString(),
                    'resolved_at' => $t->resolved_at ? \Carbon\Carbon::parse($t->resolved_at)->toDateTimeString() : null,
                    'resolution_minutes' => $resolutionMinutes,
                ];
            });

        // Son 14 Günlük Aktivite Grafiği Verisi
        $chartData = [];
        $startDate = now()->subDays(13)->startOfDay();

        for ($i = 0; $i < 14; $i++) {
            $currentDate = $startDate->copy()->addDays($i);
            $dayString = $currentDate->format('Y-m-d');
            $displayDate = $currentDate->format('d M');

            $openedCount = Ticket::where('user_id', $userId)
                ->whereDate('created_at', $dayString)
                ->count();

            $resolvedCount = Ticket::where('assigned_to_id', $userId)
                ->whereIn('status', ['resolved', 'closed'])
                ->whereDate('resolved_at', $dayString)
                ->count();

            $chartData[] = [
                'date' => $displayDate,
                'opened' => $openedCount,
                'resolved' => $resolvedCount,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'role' => $targetUser->role,
                    'avatar' => $targetUser->avatar,
                ],
                'opened_tickets' => $openedTickets,
                'resolved_tickets' => $resolvedTickets,
                'chart_data' => $chartData,
            ]
        ]);
    }
}
