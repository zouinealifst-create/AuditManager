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



Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test', function () {
    return response()->json(['message' => 'Connexion Laravel-React réussie !']);
});

// Routes CRUD pour les Utilisateurs
Route::apiResource('users', UserController::class);

// Routes pour les Rôles (lecture seule)
Route::get('roles', [RoleController::class, 'index']);

// Routes CRUD pour les Départements
Route::apiResource('departements', DepartementController::class);

// Routes CRUD pour les Entreprises
Route::apiResource('entreprises', EntrepriseController::class);

// Routes CRUD pour les Départements
Route::apiResource('departements', DepartementController::class);

// Routes CRUD pour les Normes
Route::apiResource('normes', NormeController::class);

// Synchroniser les secteurs (et normes actives dérivées) d'une entreprise
Route::post('entreprises/{entrepriseId}/secteurs', [EntrepriseController::class, 'syncSecteurs']);

// ── Checklists & Questions (sans auth pour les tests dev) ────────────
// TODO : remettre auth:sanctum quand le système de login sera branché au frontend
Route::apiResource('checklists', ChecklistController::class);
Route::apiResource('checklists.questions', QuestionController::class)->shallow();

// ── Audits (protégés par auth:sanctum) ───────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('audits', AuditController::class);
    Route::patch('audits/{id}/planifier',           [AuditController::class, 'planifier']);
    Route::patch('audits/{id}/affecter-auditeur',   [AuditController::class, 'affecterAuditeur']);
    Route::patch('audits/{id}/affecter-departement',[AuditController::class, 'affecterDepartement']);
    Route::patch('audits/{id}/demarrer',            [AuditController::class, 'demarrer']);
    Route::patch('audits/{id}/cloturer',            [AuditController::class, 'cloturer']);
    Route::get('secteurs', [SecteurController::class, 'index']);
});

// Auth Routes 
Route::post('login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
});