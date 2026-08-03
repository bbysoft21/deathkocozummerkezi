<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Kullanıcı Girişi (Login)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Girdiğiniz e-posta veya şifre hatalı.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Hesabınız aktif durumda değil. Lütfen yönetici ile iletişime geçin.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Giriş başarılı.',
            'data' => [
                'user' => [
                    'uuid' => $user->uuid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'avatar' => $user->avatar,
                ],
                'access_token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    /**
     * Giriş Yapan Kullanıcı Bilgileri (Me)
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'uuid' => $user->uuid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'avatar' => $user->avatar,
                ]
            ]
        ]);
    }

    /**
     * Kullanıcı Kendi Profil Bilgilerini Güncelleme (Mail hariç: İsim, Avatar ve Şifre)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'avatar' => 'nullable|string',
            'avatar_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'current_password' => 'nullable|required_with:new_password|string',
            'new_password' => 'nullable|string|min:6',
        ]);

        // Şifre değiştirilmek isteniyorsa mevcut şifreyi doğrula
        if (!empty($validated['new_password'])) {
            if (empty($validated['current_password']) || !Hash::check($validated['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Mevcut şifreniz hatalı.'],
                ]);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->name = $validated['name'];
        
        // Eğer bilgisayardan dosya yüklendiyse onu kaydet
        if ($request->hasFile('avatar_file')) {
            $avatarPath = $request->file('avatar_file')->store('avatars', 'public');
            $user->avatar = '/storage/' . $avatarPath;
        } else if (isset($validated['avatar'])) {
            $user->avatar = $validated['avatar'];
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil bilgileriniz başarıyla güncellendi.',
            'data' => [
                'user' => [
                    'uuid' => $user->uuid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'avatar' => $user->avatar,
                ]
            ]
        ]);
    }

    /**
     * Çıkış (Logout)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Başarıyla çıkış yapıldı.'
        ]);
    }
}
