<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EntrepriseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'description' => $this->description,
            'adresse' => $this->adresse,
            'statut' => $this->statut,
            'nombre_departements' => $this->whenCounted('departements'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}