<?php

namespace App\Models;

use App\Models\normes\Norme;
use Illuminate\Database\Eloquent\Model;

class Secteur extends Model
{
    protected $fillable = ['nom'];

    /**
     * Les normes appartenant à ce secteur (many-to-many).
     */
    public function normes()
    {
        return $this->belongsToMany(Norme::class, 'norme_secteur');
    }

    /**
     * Les entreprises ayant sélectionné ce secteur (many-to-many).
     */
    public function entreprises()
    {
        return $this->belongsToMany(Entreprise::class, 'entreprise_secteur');
    }
}
