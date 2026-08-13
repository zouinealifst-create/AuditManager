<?php

namespace App\Models;

use App\Models\normes\Norme;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Entreprise extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'description',
        'adresse',
        'statut',
    ];

    public function departements()
    {
        return $this->hasMany(Departement::class);
    }

    /**
     * Les secteurs sélectionnés par cette entreprise (many-to-many).
     */
    public function secteurs()
    {
        return $this->belongsToMany(Secteur::class, 'entreprise_secteur');
    }

    /**
     * Les normes actives de cette entreprise (many-to-many),
     * dérivées automatiquement de ses secteurs sélectionnés.
     */
    public function normes()
    {
        return $this->belongsToMany(Norme::class, 'entreprise_norme');
    }
}
