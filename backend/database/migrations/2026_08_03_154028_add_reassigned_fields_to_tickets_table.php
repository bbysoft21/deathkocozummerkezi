<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('reassigned_from_id')->nullable()->after('assigned_to_id')->constrained('users')->onDelete('set null');
            $table->timestamp('reassigned_at')->nullable()->after('in_progress_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['reassigned_from_id']);
            $table->dropColumn(['reassigned_from_id', 'reassigned_at']);
        });
    }
};
