<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'password' => $this->isMethod('post') ? 'required|string|min:8' : 'nullable|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'departement_id' => 'nullable|exists:departements,id',
            'statut' => 'nullable|in:actif,inactif',
        ];
    }
}