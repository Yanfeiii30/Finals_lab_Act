<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // A list of tech-related names to make it look realistic
        $adjectives = ['Wireless', 'Gaming', 'Mechanical', '4K', 'Bluetooth', 'USB-C', 'Smart', 'Ergonomic', 'Portable', 'Noise-Cancelling'];
        $nouns = ['Mouse', 'Keyboard', 'Monitor', 'Headset', 'Laptop', 'Webcam', 'Router', 'SSD', 'Tablet', 'Speaker'];

        for ($i = 0; $i < 100; $i++) {
            // Pick a random combo (e.g., "Wireless Keyboard")
            $name = $adjectives[array_rand($adjectives)] . ' ' . $nouns[array_rand($nouns)] . ' ' . rand(100, 900);
            
            DB::table('products')->insert([
                'name' => $name,
                'current_inventory' => rand(0, 100), // Random stock
                'avg_sales' => rand(10, 50),         // Random sales/week
                'lead_time' => rand(1, 14),          // Days to replenish
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}