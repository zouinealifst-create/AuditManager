<?php

use App\Http\Controllers\NormeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EntrepriseController;
use App\Http\Controllers\ReponseController;
use App\Http\Controllers\NonConformiteController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test', function () {
    return response()->json(['message' => 'Connexion Laravel-React réussie !']);
});

Route::apiResource('entreprises', EntrepriseController::class);

// Routes CRUD pour les Normes
Route::apiResource('normes', NormeController::class);

// Routes CRUD pour les Réponses
Route::apiResource('reponses', ReponseController::class);

// Routes CRUD pour les Non-conformités
Route::apiResource('non-conformites', NonConformiteController::class);