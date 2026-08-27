<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Audit extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'departement_id',
        'auditeur_id',
        'responsable_qualite_id',
        'date_prevue',
        'date_realisation',
        'statut',
    ];

    protected $casts = [
        'date_prevue'       => 'date',
        'date_realisation'  => 'date',
    ];

    /**
     * Les checklists sur lesquelles est basé cet audit.
     */
    public function checklists()
    {
        return $this->belongsToMany(Checklist::class, 'audit_checklist')->withTimestamps();
    }

    /**
     * Les normes couvertes par cet audit.
     * Les normes NE SONT PAS stockées directement sur l'audit — elles sont toujours
     * dérivées des checklists associées.
     * Utiliser : $audit->normes
     */
    public function getNormesAttribute()
    {
        return $this->checklists->pluck('norme')->filter()->unique('id')->values();
    }

    /**
     * Le département audité (optionnel, affecté après création).
     */
    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }

    /**
     * L'auditeur chargé de réaliser cet audit (rôle "Auditeur").
     */
    public function auditeur()
    {
        return $this->belongsTo(User::class, 'auditeur_id');
    }

    /**
     * Le Responsable Qualité ayant créé et piloté cet audit.
     */
    public function responsableQualite()
    {
        return $this->belongsTo(User::class, 'responsable_qualite_id');
    }
}
