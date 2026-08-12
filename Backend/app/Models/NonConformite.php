<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NonConformite extends Model
{
    protected $fillable = [
        'reponse_id',
        'responsable_id',
        'description',
        'gravite',
        'statut',
        'date_detection',
        'date_limite',
        'commentaire_resolution',
        'justificatif',
        'date_resolution',
    ];

    public function reponse(): BelongsTo
    {
        return $this->belongsTo(Reponse::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }
}