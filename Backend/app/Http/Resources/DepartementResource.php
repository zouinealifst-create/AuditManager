<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'nom'         => $this->nom,
            'description' => $this->description,
            // secteur_id exposé directement pour le filtrage des normes côté frontend
            'secteur_id'  => $this->secteur_id,
            'secteur'     => $this->whenLoaded('secteur', function () {
                return [
                    'id'  => $this->secteur->id,
                    'nom' => $this->secteur->nom,
                ];
            }),
            'entreprise' => [
                'id'  => $this->entreprise->id,
                'nom' => $this->entreprise->nom,
            ],
            'responsable' => $this->when($this->responsable, function () {
                return [
                    'id'   => $this->responsable->id,
                    'name' => $this->responsable->name,
                ];
            }),
            'nombre_employes' => $this->whenCounted('users'),
            'created_at'      => $this->created_at,
            'updated_at'      => $this->updated_at,
        ];
    }
}