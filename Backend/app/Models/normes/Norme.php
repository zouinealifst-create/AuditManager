<?php

namespace App\Models\normes;

use App\Models\Secteur;
use Illuminate\Database\Eloquent\Model;

class Norme extends Model
{
    protected $table = 'normes';

    protected $fillable = [
        'code',
        'nom',
        'description',
        'version',
        'organisme',
        'secteur',
        'statut',
        'est_universelle',
    ];

    protected $casts = [
        'statut'          => 'string',
        'est_universelle' => 'boolean',
    ];

    /**
     * Les secteurs auxquels appartient cette norme (many-to-many).
     * Une norme peut couvrir plusieurs secteurs (ex : ISO 45001 → Santé + Industrie).
     */
    public function secteurs()
    {
        return $this->belongsToMany(Secteur::class, 'norme_secteur');
    }
}
