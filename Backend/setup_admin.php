<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$admin = App\Models\User::where('email', 'admin@audit.com')->first();
if ($admin) {
    $permissions = App\Models\Permission::pluck('id');
    $admin->permissions()->sync($permissions);
    echo "Permissions attachées à l'Admin.\n";
} else {
    echo "Admin introuvable.\n";
}
