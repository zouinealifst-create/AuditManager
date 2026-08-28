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

    // Utilisateurs
    Route::patch('users/{user}/toggle-statut', [UserController::class, 'toggleStatut']);
    Route::apiResource('users', UserController::class);

    // Rôles (lecture seule)
    Route::get('roles', [RoleController::class, 'index']);

    // Secteurs (lecture seule)
    Route::get('secteurs', [SecteurController::class, 'index']);

    // Entreprises
    Route::post('entreprises/{entrepriseId}/secteurs', [EntrepriseController::class, 'syncSecteurs']);
    Route::apiResource('entreprises', EntrepriseController::class);

    // Départements
    Route::apiResource('departements', DepartementController::class);

    // Normes
    Route::apiResource('normes', NormeController::class);

    // Checklists & Questions
    Route::apiResource('checklists', ChecklistController::class);
    Route::apiResource('checklists.questions', QuestionController::class)->shallow();

    // Audits
    Route::apiResource('audits', AuditController::class);
    Route::patch('audits/{id}/planifier',            [AuditController::class, 'planifier']);
    Route::patch('audits/{id}/affecter-auditeur',    [AuditController::class, 'affecterAuditeur']);
    Route::patch('audits/{id}/affecter-departement', [AuditController::class, 'affecterDepartement']);
    Route::patch('audits/{id}/demarrer',             [AuditController::class, 'demarrer']);
    Route::patch('audits/{id}/cloturer',             [AuditController::class, 'cloturer']);

    // Réponses
    Route::apiResource('reponses', ReponseController::class);

    // Non-conformités
    Route::apiResource('non-conformites', NonConformiteController::class);
});