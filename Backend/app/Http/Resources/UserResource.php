<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'statut' => $this->statut,
            'role' => $this->when($this->role, function () {
                return [
                    'id' => $this->role->id,
                    'name' => $this->role->name,
                ];
            }),
            'departement' => $this->when($this->departement, function () {
                return [
                    'id' => $this->departement->id,
                    'nom' => $this->departement->nom,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}