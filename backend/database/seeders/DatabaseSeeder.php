<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\TicketCategory;
use App\Models\Ticket;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Super Admin Seeder
        $superAdmin = User::updateOrCreate(
            ['email' => 'bbysoft21@gmail.com'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Süper Admin',
                'email' => 'bbysoft21@gmail.com',
                'password' => Hash::make('Aliefe2021.'),
                'role' => 'super_admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Db Editör (Admin)
        $dbEditor = User::updateOrCreate(
            ['email' => 'dbeditor@deathko.com'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Db Editörü',
                'email' => 'dbeditor@deathko.com',
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'status' => 'active',
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                'email_verified_at' => now(),
            ]
        );

        // Damage Sorumlusu (Damage Editor)
        $dmgEditor = User::updateOrCreate(
            ['email' => 'damage@deathko.com'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Damage Sorumlusu',
                'email' => 'damage@deathko.com',
                'password' => Hash::make('123456'),
                'role' => 'damage_editor',
                'status' => 'active',
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'email_verified_at' => now(),
            ]
        );

        // Rehber Sorumlusu (Guide Editor)
        $guideEditor = User::updateOrCreate(
            ['email' => 'rehber@deathko.com'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Rehber Sorumlusu',
                'email' => 'rehber@deathko.com',
                'password' => Hash::make('123456'),
                'role' => 'guide_editor',
                'status' => 'active',
                'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                'email_verified_at' => now(),
            ]
        );

        // Game Master (User)
        $gmUser = User::updateOrCreate(
            ['email' => 'gmuser@deathko.com'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Game Master CaeL',
                'email' => 'gmuser@deathko.com',
                'password' => Hash::make('123456'),
                'role' => 'user',
                'status' => 'active',
                'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                'email_verified_at' => now(),
            ]
        );

        // Ticket Categories
        $cat1 = TicketCategory::updateOrCreate(['slug' => 'oyun-ici-sorunlar'], ['uuid' => (string) Str::uuid(), 'name' => 'Oyun İçi Sorunlar', 'description' => 'Drop, KC, Pus ve Görev Hataları']);
        $cat2 = TicketCategory::updateOrCreate(['slug' => 'hesap-guvenligi'], ['uuid' => (string) Str::uuid(), 'name' => 'Hesap Güvenliği', 'description' => 'Şifre Sıfırlama, OTP & E-Posta İşlemleri']);
        $cat3 = TicketCategory::updateOrCreate(['slug' => 'odeme-pus-islemleri'], ['uuid' => (string) Str::uuid(), 'name' => 'Ödeme & PUS İşlemleri', 'description' => 'Bakiye, KC ve Alışveriş Talepleri']);
        $cat4 = TicketCategory::updateOrCreate(['slug' => 'teknik-hata-baglanti'], ['uuid' => (string) Str::uuid(), 'name' => 'Teknik Hata & Bağlantı', 'description' => 'Client Kapanma, DC ve Ping Sorunları']);
        $cat5 = TicketCategory::updateOrCreate(['slug' => 'database-sorunlari'], ['uuid' => (string) Str::uuid(), 'name' => 'Database Sorunları', 'description' => 'Veritabanı, karakter, eşya kaybı ve DB kayıt hataları']);
        $cat6 = TicketCategory::updateOrCreate(['slug' => 'damage-sorunlari'], ['uuid' => (string) Str::uuid(), 'name' => 'Damage Sorunları', 'description' => 'Skill, silah, zırh ve karakter hasar/damage dengesizliği bildirimleri']);
        $cat7 = TicketCategory::updateOrCreate(['slug' => 'rehber-forum-sorunu'], ['uuid' => (string) Str::uuid(), 'name' => 'Rehber Forum Sorunu', 'description' => 'Forum rehberleri, içerik güncellemeleri ve forum sorun bildirimleri']);

        // Sample Tickets for Firedrake Solution Center
        Ticket::create([
            'uuid' => (string) Str::uuid(),
            'ticket_category_id' => $cat1->id,
            'user_id' => $gmUser->id,
            'assigned_to_id' => $dbEditor->id,
            'subject' => 'Firedrake Görev Ödülü Yüklenmedi',
            'message' => 'Firedrake sunucusundaki 70 görevini bitirmeme rağmen ödül kutusu envanterime gelmedi.',
            'solution_center' => 'firedrake',
            'priority' => 'high',
            'status' => 'open',
        ]);

        // Sample Tickets for Myko Solution Center
        Ticket::create([
            'uuid' => (string) Str::uuid(),
            'ticket_category_id' => $cat3->id,
            'user_id' => $gmUser->id,
            'assigned_to_id' => $dmgEditor->id,
            'subject' => 'Myko KC Bakiyem Hesaba Geçmedi',
            'message' => 'Myko çözüm merkezine özel satın aldığım 2000 KC kodu yükleme sonrası hata verdi.',
            'solution_center' => 'myko',
            'priority' => 'urgent',
            'status' => 'in_progress',
            'assigned_at' => now()->subMinutes(30),
        ]);

        // Sample Tickets for Light Farm Solution Center
        Ticket::create([
            'uuid' => (string) Str::uuid(),
            'ticket_category_id' => $cat4->id,
            'user_id' => $gmUser->id,
            'assigned_to_id' => $guideEditor->id,
            'resolved_by_id' => $guideEditor->id,
            'subject' => 'Light Farm Client DC Sorunu',
            'message' => 'Light Farm zindan bölgesine girince client aniden kapanıyor.',
            'solution_center' => 'light-farm',
            'priority' => 'medium',
            'status' => 'resolved',
            'admin_response' => 'Güncelleme paketi yayınlandı, sorun giderildi.',
            'assigned_at' => now()->subHours(2),
            'in_progress_at' => now()->subHours(1)->subMinutes(30),
            'resolved_at' => now()->subMinutes(15),
        ]);
    }
}
