<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EntrepriseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'adresse' => 'nullable|string|max:255',
            'telephone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'secteur_activite' => 'nullable|string|max:255',
            'statut' => 'nullable|in:actif,inactif',
        ];
    }
}