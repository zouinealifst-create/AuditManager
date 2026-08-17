<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DepartementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entreprise_id' => 'required|exists:entreprises,id',
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'responsable_id' => 'nullable|exists:users,id',
        ];
    }
}