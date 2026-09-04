<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Permission;
use Illuminate\Support\Facades\Http;

echo "========================================\n";
echo "   TEST DE SECURITE DES API (HTTP)\n";
echo "========================================\n";

$apiUrl = 'http://127.0.0.1:8000/api';

// 1. Créer un Utilisateur de Test directement en base
$permDepView = Permission::where('key', 'departements.view')->first()->id;
$permCheckView = Permission::where('key', 'checklists.view')->first()->id;
$permCheckCreate = Permission::where('key', 'checklists.create')->first()->id;

$roleId = App\Models\Role::where('name', '!=', 'Admin')->first()->id;
$testEmail = 'api_test_'.time().'@audit.com';

$user = User::create([
    'name' => 'API Tester',
    'email' => $testEmail,
    'password' => bcrypt('password123'),
    'role_id' => $roleId,
    'statut' => 'actif',
]);

$user->permissions()->sync([$permDepView, $permCheckView, $permCheckCreate]);

// 2. Générer un token Sanctum pour ce test
$testToken = $user->createToken('test_token')->plainTextToken;
echo "✅ Utilisateur de test créé et authentifié (Dep View, Check View, Check Create).\n";

// 4. Test des routes
echo "\n--- TESTS D'ACCES ---\n";

function testRoute($name, $method, $url, $token, $expectedStatus, $payload = []) {
    $res = Http::acceptJson()->withToken($token);
    if($method === 'GET') $res = $res->get($url);
    if($method === 'POST') $res = $res->post($url, $payload);
    if($method === 'DELETE') $res = $res->delete($url);
    
    $status = $res->status();
    $match = $status === $expectedStatus;
    $icon = $match ? '✅' : '❌';
    echo "$icon $name ($method $url) => $status (Attendu: $expectedStatus)\n";
    if(!$match) echo "     Réponse: " . $res->body() . "\n";
    return $match;
}

$allPass = true;
// Departements: View (allowed), Create (forbidden)
$allPass &= testRoute('Voir Départements', 'GET', "$apiUrl/departements", $testToken, 200);
$allPass &= testRoute('Créer Département', 'POST', "$apiUrl/departements", $testToken, 403, ['nom'=>'Test']);

// Checklists: View (allowed), Create (allowed), Delete (forbidden)
$allPass &= testRoute('Voir Checklists', 'GET', "$apiUrl/checklists", $testToken, 200);
$allPass &= testRoute('Créer Checklist', 'POST', "$apiUrl/checklists", $testToken, 201, ['titre'=>'Test', 'description'=>'desc']);
// Pour tester delete, on essaie l'ID 999
$allPass &= testRoute('Supprimer Checklist', 'DELETE', "$apiUrl/checklists/999", $testToken, 403);

// Users: View (forbidden), Create (forbidden)
$allPass &= testRoute('Voir Utilisateurs', 'GET', "$apiUrl/users", $testToken, 403);
$allPass &= testRoute('Créer Utilisateur', 'POST', "$apiUrl/users", $testToken, 403, ['name'=>'Hack']);

echo "\n========================================\n";
if ($allPass) {
    echo "🎉 TOUS LES TESTS DE SECURITE API SONT REUSSIS !\n";
} else {
    echo "⚠️ CERTAINS TESTS ONT ECHOUE.\n";
}

// Cleanup
User::where('email', $testEmail)->delete();
