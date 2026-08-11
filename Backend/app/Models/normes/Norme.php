<?php

namespace App\Models\normes;

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
    ];

    protected $casts = [
        'statut' => 'string',
    ];
}
