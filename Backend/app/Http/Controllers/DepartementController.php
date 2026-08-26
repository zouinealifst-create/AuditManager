<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepartementRequest;
use App\Http\Resources\DepartementResource;
use App\Models\Departement;
use Illuminate\Http\Request;

class DepartementController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);

        $departements = Departement::with(['entreprise', 'responsable', 'secteur'])
            ->withCount('users')
            ->latest()
            ->paginate($perPage);

        return DepartementResource::collection($departements);
    }

    public function store(DepartementRequest $request)
    {
        $departement = Departement::create($request->validated());

        return new DepartementResource($departement->load(['entreprise', 'responsable', 'secteur']));
    }

    public function show(Departement $departement)
    {
        return new DepartementResource(
            $departement->load(['entreprise', 'responsable', 'secteur'])->loadCount('users')
        );
    }

    public function update(DepartementRequest $request, Departement $departement)
    {
        $departement->update($request->validated());

        return new DepartementResource($departement->load(['entreprise', 'responsable', 'secteur']));
    }

    public function destroy(Departement $departement)
    {
        $departement->delete();

        return response()->json(['message' => 'Département supprimé avec succès.']);
    }
}