<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['uuid', 'name', 'slug', 'description'])]
class TicketCategory extends Model
{
    use HasFactory, SoftDeletes;

    public function tickets()
    {
        return $table->hasMany(Ticket::class);
    }
}
