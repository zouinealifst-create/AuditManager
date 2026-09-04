<?php

use App\Http\Controllers\AuditController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\DepartementController;
use App\Http\Controllers\NormeController;
use App\Http\Controllers\QuestionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EntrepriseController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SecteurController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ReponseController;
use App\Http\Controllers\NonConformiteController;

Route::get('/test', function () {
    return response()->json(['message' => 'Connexion Laravel-React réussie !']);
});

// ── Authentification ──────────────────────────────────────────────
Route::post('login', [AuthController::class, 'login']);

// ── Checklists & Questions ──
// Les routes ont été déplacées dans le groupe auth:sanctum

// ── Toutes les routes protégées (nécessitent un token valide) ──────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    // Permissions
    Route::get('permissions', [PermissionController::class, 'index']);

    // Utilisateurs
    Route::patch('users/{user}/toggle-statut', [UserController::class, 'toggleStatut'])->middleware('permission:users.edit');
    Route::apiResource('users', UserController::class)->only(['index', 'show'])->middleware('permission:users.view');
    Route::post('users', [UserController::class, 'store'])->middleware('permission:users.create');
    Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:users.edit');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete');

    // Rôles (lecture seule)
    Route::get('roles', [RoleController::class, 'index']);

    // Secteurs (lecture seule)
    Route::get('secteurs', [SecteurController::class, 'index']);

    // Entreprises
    Route::post('entreprises/{entrepriseId}/secteurs', [EntrepriseController::class, 'syncSecteurs'])->middleware('permission:entreprise.edit');
    Route::apiResource('entreprises', EntrepriseController::class)->only(['index', 'show'])->middleware('permission:entreprise.view');
    Route::put('entreprises/{entreprise}', [EntrepriseController::class, 'update'])->middleware('permission:entreprise.edit');

    // Départements
    Route::apiResource('departements', DepartementController::class)->only(['index', 'show'])->middleware('permission:departements.view');
    Route::post('departements', [DepartementController::class, 'store'])->middleware('permission:departements.create');
    Route::put('departements/{departement}', [DepartementController::class, 'update'])->middleware('permission:departements.edit');
    Route::delete('departements/{departement}', [DepartementController::class, 'destroy'])->middleware('permission:departements.delete');

    // Normes
    Route::apiResource('normes', NormeController::class);

    // Checklists & Questions
    Route::apiResource('checklists', ChecklistController::class)->only(['index', 'show'])->middleware('permission:checklists.view');
    Route::post('checklists', [ChecklistController::class, 'store'])->middleware('permission:checklists.create');
    Route::put('checklists/{checklist}', [ChecklistController::class, 'update'])->middleware('permission:checklists.edit');
    Route::delete('checklists/{checklist}', [ChecklistController::class, 'destroy'])->middleware('permission:checklists.delete');
    Route::apiResource('checklists.questions', QuestionController::class)->shallow();

    // Audits
    Route::apiResource('audits', AuditController::class)->only(['index', 'show'])->middleware('permission:audits.view');
    Route::post('audits', [AuditController::class, 'store'])->middleware('permission:audits.create');
    Route::put('audits/{audit}', [AuditController::class, 'update'])->middleware('permission:audits.edit');
    Route::delete('audits/{audit}', [AuditController::class, 'destroy'])->middleware('permission:audits.delete');

    Route::patch('audits/{id}/planifier',            [AuditController::class, 'planifier'])->middleware('permission:audits.edit');
    Route::patch('audits/{id}/affecter-auditeur',    [AuditController::class, 'affecterAuditeur'])->middleware('permission:audits.edit');
    Route::patch('audits/{id}/affecter-departement', [AuditController::class, 'affecterDepartement'])->middleware('permission:audits.edit');
    Route::patch('audits/{id}/demarrer',             [AuditController::class, 'demarrer'])->middleware('permission:audits.edit');
    Route::patch('audits/{id}/cloturer',             [AuditController::class, 'cloturer'])->middleware('permission:audits.edit');

    // Réponses
    Route::apiResource('reponses', ReponseController::class);

    // Non-conformités
    Route::apiResource('non-conformites', NonConformiteController::class);
});