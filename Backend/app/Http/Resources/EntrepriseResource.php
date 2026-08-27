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
        'telephone' => $this->telephone,
        'email' => $this->email,
        'secteur_activite' => $this->secteur_activite,
        'statut' => $this->statut,
        'logo_url' => $this->logo ? asset('storage/' . $this->logo) : null,
        'site_web' => $this->site_web,               
        'ice' => $this->ice,                           
        'registre_commerce' => $this->registre_commerce,
        'nombre_departements' => $this->whenCounted('departements'),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
        ];
    }
}