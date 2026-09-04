<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Role;
use App\Models\User;
use App\Models\Permission;

// Delete old test user if exists
User::where('email', 'rq@test.com')->forceDelete();

$role = Role::where('name', '!=', 'Admin')->first();
$user = User::create([
    'name' => 'Test RQ',
    'email' => 'rq@test.com',
    'password' => bcrypt('password123'),
    'role_id' => $role->id,
    'statut' => 'actif',
]);

$perms = Permission::whereIn('key', [
    'dashboard_rq.view',
    'checklists.view',
    'checklists.create',
    'departements.view',
])->pluck('id');

$user->permissions()->sync($perms);

echo "✅ Created: " . $user->email . PHP_EOL;
echo "   Role: " . $role->name . PHP_EOL;
echo "   Permissions: " . $perms->count() . PHP_EOL;

$loaded = User::with(['role', 'permissions'])->find($user->id);
foreach ($loaded->permissions as $p) {
    echo "   - " . $p->key . PHP_EOL;
}
