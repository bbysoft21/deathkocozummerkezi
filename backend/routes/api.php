<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\TicketController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/me/profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // User Management API (Super Admin)
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::post('/users/clean-database', [UserController::class, 'cleanNonSuperAdminData']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // Solution Centers Tickets API
        Route::get('/tickets/stats', [TicketController::class, 'stats']);
        Route::get('/tickets/performance-analytics', [TicketController::class, 'performanceAnalytics']);
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::post('/tickets', [TicketController::class, 'store']);
        Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus']);
        Route::post('/tickets/{id}/reassign', [TicketController::class, 'reassign']);
        Route::get('/ticket-categories', [TicketController::class, 'categories']);

        // User Personal Notifications API
        Route::get('/user/notifications', [TicketController::class, 'notifications']);
        Route::patch('/user/notifications/{id}/read', [TicketController::class, 'markNotificationRead']);
    });
});
