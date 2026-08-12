<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reponse extends Model
{
    protected $fillable = [
        'audit_id',
        'question_id',
        'statut',
        'commentaire',
        'preuve',
    ];

    public function audit(): BelongsTo
    {
        return $this->belongsTo(Audit::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function nonConformite(): HasMany
    {
        return $this->hasMany(NonConformite::class);
    }
}