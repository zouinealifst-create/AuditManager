<?php

namespace App\Http\Controllers;

use App\Models\Secteur;

class SecteurController extends Controller
{
    public function index()
    {
        return Secteur::select('id', 'nom')->orderBy('nom')->get();
    }
}