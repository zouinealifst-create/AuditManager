<?php

namespace App\Http\Controllers;

use App\Models\Reponse;
use Illuminate\Http\Request;

class ReponseController extends Controller
{
    public function index(Request $request)
    {
        $query = Reponse::with(['question', 'nonConformite']);

        if ($request->has('audit_id')) {
            $query->where('audit_id', $request->audit_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'audit_id' => 'required|exists:audits,id',
            'question_id' => 'required|exists:questions,id',
            'statut' => 'required|in:conforme,non_conforme,non_applicable',
            'commentaire' => 'nullable|string',
            'preuve' => 'nullable|string',
        ]);

        $reponse = Reponse::create($validated);

        return response()->json($reponse, 201);
    }

    public function show(Reponse $reponse)
    {
        return response()->json($reponse->load(['question', 'nonConformite']));
    }

    public function update(Request $request, Reponse $reponse)
    {
        $validated = $request->validate([
            'statut' => 'sometimes|in:conforme,non_conforme,non_applicable',
            'commentaire' => 'nullable|string',
            'preuve' => 'nullable|string',
        ]);

        $reponse->update($validated);

        return response()->json($reponse);
    }

    public function destroy(Reponse $reponse)
    {
        $reponse->delete();

        return response()->json(null, 204);
    }
}