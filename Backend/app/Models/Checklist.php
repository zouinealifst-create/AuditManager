<?php

namespace App\Models;

use App\Models\normes\Norme;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Checklist extends Model
{
    use HasFactory;

    protected $fillable = [
        'norme_id',
        'titre',
        'description',
        'cree_par',
        'statut',
    ];



    /**
     * La norme évaluée par cette checklist.
     */
    public function norme()
    {
        return $this->belongsTo(Norme::class);
    }

    /**
     * Les questions de cette checklist, triées par ordre.
     */
    public function questions()
    {
        return $this->hasMany(Question::class)->orderBy('ordre');
    }

    /**
     * L'utilisateur ayant créé cette checklist.
     */
    public function createur()
    {
        return $this->belongsTo(User::class, 'cree_par');
    }

    /**
     * Les audits basés sur cette checklist.
     */
    public function audits()
    {
        return $this->belongsToMany(Audit::class, 'audit_checklist')->withTimestamps();
    }
}
