<?php

namespace App\Http\Controllers;

use App\Models\NonConformite;
use Illuminate\Http\Request;

class NonConformiteController extends Controller
{
    public function index(Request $request)
    {
        $query = NonConformite::with(['reponse', 'responsable']);

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('gravite')) {
            $query->where('gravite', $request->gravite);
        }

        if ($request->has('responsable_id')) {
            $query->where('responsable_id', $request->responsable_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reponse_id' => 'required|exists:reponses,id',
            'responsable_id' => 'nullable|exists:users,id',
            'description' => 'required|string',
            'gravite' => 'required|in:mineure,majeure,critique',
            'date_detection' => 'required|date',
            'date_limite' => 'nullable|date',
        ]);

        $nonConformite = NonConformite::create($validated);

        return response()->json($nonConformite, 201);
    }

    public function show(NonConformite $nonConformite)
    {
        return response()->json($nonConformite->load(['reponse', 'responsable']));
    }

    public function update(Request $request, NonConformite $nonConformite)
    {
        $validated = $request->validate([
            'responsable_id' => 'sometimes|nullable|exists:users,id',
            'statut' => 'sometimes|in:ouverte,en_cours,resolue,validee',
            'date_limite' => 'sometimes|nullable|date',
            'commentaire_resolution' => 'sometimes|nullable|string',
            'justificatif' => 'sometimes|nullable|string',
            'date_resolution' => 'sometimes|nullable|date',
        ]);

        $nonConformite->update($validated);

        return response()->json($nonConformite);
    }

    public function destroy(NonConformite $nonConformite)
    {
        $nonConformite->delete();

        return response()->json(null, 204);
    }
}