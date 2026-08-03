<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Kullanıcı Listesi (Sadece super_admin)
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bu işlem için yetkiniz bulunmamaktadır.'
            ], 403);
        }

        $query = User::query();

        // Arama (İsim veya Email)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Rol Filtresi
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Durum Filtresi
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Yeni Kullanıcı / GM Oluşturma
     */
    public function store(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bu işlem için yetkiniz bulunmamaktadır.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in(['super_admin', 'admin', 'damage_editor', 'guide_editor', 'user'])],
            'status' => ['required', Rule::in(['active', 'passive', 'banned'])],
            'avatar' => 'nullable|string'
        ]);

        $user = User::create([
            'uuid' => (string) Str::uuid(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => $validated['status'],
            'avatar' => $validated['avatar'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcı başarıyla oluşturuldu.',
            'data' => $user
        ], 201);
    }

    /**
     * Kullanıcı Güncelleme
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bu işlem için yetkiniz bulunmamaktadır.'
            ], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role' => ['required', Rule::in(['super_admin', 'admin', 'damage_editor', 'guide_editor', 'user'])],
            'status' => ['required', Rule::in(['active', 'passive', 'banned'])],
            'avatar' => 'nullable|string'
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'status' => $validated['status'],
            'avatar' => $validated['avatar'] ?? $user->avatar,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcı başarıyla güncellendi.',
            'data' => $user
        ]);
    }

    /**
     * Kullanıcı Silme
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bu işlem için yetkiniz bulunmamaktadır.'
            ], 403);
        }

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Kendi hesabınızı silemezsiniz.'
            ], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcı silindi.'
        ]);
    }

    /**
     * Veritabanı Optimizasyonu ve Temizleme (Sadece super_admin)
     * Süper Admin hariç tüm verileri (biletler, bildirimler ve yetkili/GM kullanıcıları) güvenli bir şekilde siler.
     */
    public function cleanNonSuperAdminData(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bu kritik işlem için yetkiniz bulunmamaktadır.'
            ], 403);
        }

        try {
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // 1. Tüm açılan ve çözülen destek talepleri/biletleri ve silinenleri tamamen temizle
            \Illuminate\Support\Facades\DB::table('tickets')->truncate();

            // 2. Yetkili performans raporlarında kullanılan bildirim geçmişini tamamen temizle
            \Illuminate\Support\Facades\DB::table('user_notifications')->truncate();

            // 3. Geçersiz oturum anahtarlarını (Sanctum Tokens) tamamen temizle
            \Illuminate\Support\Facades\DB::table('personal_access_tokens')->truncate();

            // 4. Süper Admin hariç tüm kullanıcıları ve yetkilileri sil
            User::where('role', '!=', 'super_admin')->delete();

            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            // 5. Veritabanı Tablo İndekslerini ve Önlekleri Optimize Et
            \Illuminate\Support\Facades\DB::statement("OPTIMIZE TABLE tickets, user_notifications, users, personal_access_tokens");

            return response()->json([
                'success' => true,
                'message' => 'Veritabanı optimizasyonu başarıyla gerçekleştirildi. Tüm biletler, kullanıcı panellerindeki açılan sorunlar, performans raporları ve Süper Admin hariç tüm hesaplar temizlendi.'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            return response()->json([
                'success' => false,
                'message' => 'Optimizasyon sırasında bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }
}
