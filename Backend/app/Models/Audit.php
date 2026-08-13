<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Audit extends Model
{
    use HasFactory;

    protected $fillable = [
        'checklist_id',
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
     * La checklist sur laquelle est basé cet audit.
     */
    public function checklist()
    {
        return $this->belongsTo(Checklist::class);
    }

    /**
     * La norme de cet audit.
     * La norme N'EST PAS stockée directement sur l'audit — elle est toujours
     * dérivée de la checklist associée, conformément au modèle de données.
     * Utiliser : $audit->norme ou $audit->checklist->norme
     */
    public function getNormeAttribute()
    {
        return $this->checklist?->norme;
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
