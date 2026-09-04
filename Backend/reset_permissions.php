<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Role;
use App\Models\User;

// Supprimer les permissions DB de l'Admin (bypass via rôle, pas besoin en DB)
$adminRole = Role::where('name', 'Admin')->first();
if ($adminRole) {
    $admins = User::where('role_id', $adminRole->id)->get();
    foreach ($admins as $admin) {
        $admin->permissions()->detach(); // vide la table pivot pour les admins
        echo "✅ Permissions DB supprimées pour Admin: " . $admin->email . " (bypass actif via rôle)\n";
    }
}

// Supprimer l'utilisateur de test créé manuellement
$test = User::where('email', 'rq@test.com')->first();
if ($test) {
    $test->permissions()->detach();
    $test->delete();
    echo "🗑️  Utilisateur test supprimé: rq@test.com\n";
}

// Vérification finale
echo "\n=== État final ===\n";
$allUsers = User::with(['role', 'permissions'])->get();
foreach ($allUsers as $user) {
    $permCount = $user->permissions->count();
    $isAdmin   = $user->role?->name === 'Admin';
    $access    = $isAdmin ? 'BYPASS ADMIN (accès total)' : ($permCount . ' permissions définies');
    echo "  👤 " . $user->email . " → " . $access . "\n";
}
echo "\nDésormais : AUCUNE permission pré-assignée. L'admin les définit manuellement via le formulaire.\n";
