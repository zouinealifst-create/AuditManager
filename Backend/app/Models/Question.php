<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'checklist_id',
        'texte',
        'ordre',
    ];

    /**
     * La checklist à laquelle appartient cette question.
     */
    public function checklist()
    {
        return $this->belongsTo(Checklist::class);
    }
}
