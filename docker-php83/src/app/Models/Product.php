<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // This is required for your Seeder to work!
    protected $fillable = [
        'name',
        'current_inventory',
        'avg_sales',
        'lead_time',
    ];
}