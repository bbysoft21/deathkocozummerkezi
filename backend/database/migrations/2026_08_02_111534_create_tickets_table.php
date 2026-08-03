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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('ticket_category_id')->constrained('ticket_categories')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('resolved_by_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('subject');
            $table->text('message');
            $table->string('image_path')->nullable();
            $table->enum('solution_center', ['firedrake', 'myko', 'light-farm'])->index();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium')->index();
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open')->index();
            $table->text('admin_response')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
