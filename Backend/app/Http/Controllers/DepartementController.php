<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepartementRequest;
use App\Http\Resources\DepartementResource;
use App\Models\Departement;

class DepartementController extends Controller
{
    public function index()
    {
        $departements = Departement::with(['entreprise', 'responsable'])
            ->withCount('users')
            ->latest()
            ->paginate(10);

        return DepartementResource::collection($departements);
    }

    public function store(DepartementRequest $request)
    {
        $departement = Departement::create($request->validated());

        return new DepartementResource($departement->load(['entreprise', 'responsable']));
    }

    public function show(Departement $departement)
    {
        return new DepartementResource(
            $departement->load(['entreprise', 'responsable'])->loadCount('users')
        );
    }

    public function update(DepartementRequest $request, Departement $departement)
    {
        $departement->update($request->validated());

        return new DepartementResource($departement->load(['entreprise', 'responsable']));
    }

    public function destroy(Departement $departement)
    {
        $departement->delete();

        return response()->json(['message' => 'Département supprimé avec succès.']);
    }
}