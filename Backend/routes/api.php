<?php

use App\Http\Controllers\AuditController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\NormeController;
use App\Http\Controllers\QuestionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EntrepriseController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test', function () {
    return response()->json(['message' => 'Connexion Laravel-React réussie !']);
});

Route::apiResource('entreprises', EntrepriseController::class);

// Routes CRUD pour les Normes
Route::apiResource('normes', NormeController::class);

// Synchroniser les secteurs (et normes actives dérivées) d'une entreprise
Route::post('entreprises/{entrepriseId}/secteurs', [EntrepriseController::class, 'syncSecteurs']);

// ── Checklists, Questions & Audits (protégés par auth:sanctum) ───────
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('checklists', ChecklistController::class);
    Route::apiResource('checklists.questions', QuestionController::class)->shallow();

    Route::apiResource('audits', AuditController::class);
    Route::patch('audits/{id}/planifier',           [AuditController::class, 'planifier']);
    Route::patch('audits/{id}/affecter-auditeur',   [AuditController::class, 'affecterAuditeur']);
    Route::patch('audits/{id}/affecter-departement',[AuditController::class, 'affecterDepartement']);
    Route::patch('audits/{id}/demarrer',            [AuditController::class, 'demarrer']);
    Route::patch('audits/{id}/cloturer',            [AuditController::class, 'cloturer']);
});