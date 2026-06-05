<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\ApiKey;
use App\Models\Setting;
use App\Models\BlogPost;
use App\Models\Page;
use Illuminate\Support\Facades\Hash;

try {
    echo "=== TESTING NEON POSTGRESQL CONNECTION ===\n";
    $userCount = User::count();
    echo "Neon PostgreSQL Connected successfully! User Count: {$userCount}\n";

    // Ensure there is at least one admin user
    $admin = User::where('role', 'admin')->first();
    if (!$admin) {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@instasave.local',
            'password' => Hash::make('admin123'),
            'role' => 'admin'
        ]);
        echo "Created default admin user: admin@instasave.local / admin123\n";
    } else {
        echo "Admin user exists: {$admin->email}\n";
    }

    // Ensure an API key exists for this admin
    $apiKey = ApiKey::where('user_id', $admin->id)->first();
    if (!$apiKey) {
        $apiKey = ApiKey::create([
            'user_id' => $admin->id,
            'name' => 'Default WordPress Key',
            'key' => 'wp_instasave_api_key_demo_987654321',
            'is_active' => true
        ]);
        echo "Created default API key: wp_instasave_api_key_demo_987654321\n";
    } else {
        echo "API key exists: {$apiKey->key}\n";
    }

    // Ensure some blog posts exist
    if (BlogPost::count() === 0) {
        BlogPost::create([
            'author_id' => $admin->id,
            'title' => 'How to Download Instagram Reels Safely & Privately',
            'slug' => 'how-to-download-instagram-reels-safely',
            'content' => 'Learn the core techniques for downloading Instagram reels without exposing your account details...',
            'featured_image' => 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80',
            'is_published' => true,
            'published_at' => now()
        ]);
        BlogPost::create([
            'author_id' => $admin->id,
            'title' => 'Understanding Instagram\'s Anti-Bot Scraping Limits',
            'slug' => 'understanding-instagram-anti-bot-limits',
            'content' => 'Discover how session cookies, proxy rotation, and headers prevent rate limit bans during high speed media parsing...',
            'featured_image' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
            'is_published' => true,
            'published_at' => now()
        ]);
        echo "Seeded database blog posts\n";
    }

    // Ensure setup wizard is marked completed
    Setting::updateOrCreate(['key' => 'setup_wizard_completed'], ['value' => '1']);
    echo "Marked setup wizard as completed in settings table\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
