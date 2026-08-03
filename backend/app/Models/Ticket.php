<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'uuid', 
    'ticket_category_id', 
    'user_id', 
    'assigned_to_id',
    'reassigned_from_id',
    'assigned_at',
    'in_progress_at',
    'reassigned_at',
    'resolved_by_id',
    'subject', 
    'message', 
    'image_path',
    'solution_center', 
    'priority', 
    'status', 
    'admin_response', 
    'resolved_at'
])]
class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'assigned_at' => 'datetime',
        'in_progress_at' => 'datetime',
        'reassigned_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(TicketCategory::class, 'ticket_category_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    public function reassignedFrom()
    {
        return $this->belongsTo(User::class, 'reassigned_from_id');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by_id');
    }
}
