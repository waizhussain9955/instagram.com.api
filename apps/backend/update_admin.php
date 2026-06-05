<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

try {
    echo "=== UPDATING ADMIN CREDENTIALS ===\n";
    
    // Find or create admin user with email admin@gmail.com
    $admin = User::where('email', 'admin@gmail.com')->first();
    
    if (!$admin) {
        // If not found, let's look for any admin
        $admin = User::where('role', 'admin')->first();
    }

    if ($admin) {
        $admin->email = 'admin@gmail.com';
        $admin->password = Hash::make('admin123');
        $admin->role = 'admin';
        $admin->save();
        echo "Updated existing admin user account to:\n";
        echo "Email: admin@gmail.com\n";
        echo "Password: admin123\n";
    } else {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin'
        ]);
        echo "Created new admin user account:\n";
        echo "Email: admin@gmail.com\n";
        echo "Password: admin123\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
