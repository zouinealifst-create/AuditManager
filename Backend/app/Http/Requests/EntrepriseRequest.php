<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EntrepriseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(
            collect($this->only([
                'description', 'adresse', 'telephone',
                'email', 'secteur_activite', 'statut',
            ]))->map(fn ($v) => $v === '' ? null : $v)->all()
        );
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
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'site_web' => 'nullable|string|max:255',
            'ice' => 'nullable|string|max:50',
            'registre_commerce' => 'nullable|string|max:100',
        ];
    }
}