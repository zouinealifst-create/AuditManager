<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Http\Resources\UserResource;

echo "========================================\n";
echo "   TEST SYSTEME DE PERMISSIONS\n";
echo "========================================\n\n";

// ── Test 1 : Utilisateur Admin ──
$admin = User::with(['role', 'permissions'])->where('email', 'admin@audit.com')->first();
echo "👤 ADMIN (admin@audit.com)\n";
echo "   Rôle: " . $admin->role->name . "\n";
echo "   Permissions: " . $admin->permissions->count() . " (via seeder)\n";

// Test hasPermission pour Admin
$testKeys = ['dashboard.view', 'users.create', 'audits.delete', 'fake.permission'];
foreach ($testKeys as $key) {
    $result = $admin->hasPermission($key) ? '✅ AUTORISÉ' : '❌ REFUSÉ';
    echo "   [$result] $key\n";
}

echo "\n";

// ── Test 2 : Utilisateur Test RQ ──
$rq = User::with(['role', 'permissions'])->where('email', 'rq@test.com')->first();
echo "👤 TEST RQ (rq@test.com)\n";
echo "   Rôle: " . $rq->role->name . "\n";
echo "   Permissions accordées:\n";
foreach ($rq->permissions as $p) {
    echo "   ✅ " . $p->key . "\n";
}

echo "\n   Tests de vérification:\n";
$testsRQ = [
    'dashboard_rq.view'  => true,   // autorisé
    'checklists.view'    => true,   // autorisé
    'checklists.create'  => true,   // autorisé
    'departements.view'  => true,   // autorisé (voir seulement)
    'dashboard.view'     => false,  // refusé
    'users.view'         => false,  // refusé
    'checklists.delete'  => false,  // refusé
    'departements.create'=> false,  // refusé
    'audits.view'        => false,  // refusé
    'entreprise.view'    => false,  // refusé
];

$allPass = true;
foreach ($testsRQ as $key => $expected) {
    $actual = $rq->hasPermission($key);
    $match = $actual === $expected;
    if (!$match) $allPass = false;
    $status = $match ? '✅ PASS' : '❌ FAIL';
    $got = $actual ? 'autorisé' : 'refusé';
    $exp = $expected ? 'autorisé' : 'refusé';
    echo "   [$status] $key → obtenu:$got | attendu:$exp\n";
}

echo "\n";
echo ($allPass ? "🎉 TOUS LES TESTS PASSENT !" : "⚠️  CERTAINS TESTS ONT ÉCHOUÉ") . "\n";

echo "\n";
echo "========================================\n";
echo "   SIMULATION SIDEBAR pour rq@test.com\n";
echo "========================================\n";
$sidebarItems = [
    ['label' => 'Dashboard admin', 'permission' => 'dashboard.view'],
    ['label' => 'Dashboard RQ',    'permission' => 'dashboard_rq.view'],
    ['label' => 'Mon entreprise',  'permission' => 'entreprise.view'],
    ['label' => 'Départements',    'permission' => 'departements.view'],
    ['label' => 'Utilisateurs',    'permission' => 'users.view'],
    ['label' => 'Rôles',           'permission' => 'users.view'],
    ['label' => 'Checklists',      'permission' => 'checklists.view'],
    ['label' => 'Audits',          'permission' => 'audits.view'],
];

echo "\nÉléments visibles dans la sidebar:\n";
foreach ($sidebarItems as $item) {
    $visible = $rq->hasPermission($item['permission']);
    $icon = $visible ? '👁️  VISIBLE' : '🙈 CACHÉ';
    echo "   [$icon] " . $item['label'] . "\n";
}
