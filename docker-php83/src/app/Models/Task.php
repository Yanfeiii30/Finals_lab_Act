<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // <-- You can add this too
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory; // <-- Good to add for seeders/testing

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'status',
        'due_date',
    ];
}