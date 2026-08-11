<?php

namespace App\Http\Controllers;

use App\Http\Requests\EntrepriseRequest;
use App\Http\Resources\EntrepriseResource;
use App\Models\Entreprise;

class EntrepriseController extends Controller
{
    public function index()
    {
        $entreprises = Entreprise::withCount('departements')->latest()->paginate(10);

        return EntrepriseResource::collection($entreprises);
    }

    public function store(EntrepriseRequest $request)
    {
        $entreprise = Entreprise::create($request->validated());

        return new EntrepriseResource($entreprise);
    }

    public function show(Entreprise $entreprise)
    {
        return new EntrepriseResource($entreprise->loadCount('departements'));
    }

    public function update(EntrepriseRequest $request, Entreprise $entreprise)
    {
        $entreprise->update($request->validated());

        return new EntrepriseResource($entreprise);
    }

    public function destroy(Entreprise $entreprise)
    {
        $entreprise->delete();

        return response()->json(['message' => 'Entreprise supprimée avec succès.']);
    }
}