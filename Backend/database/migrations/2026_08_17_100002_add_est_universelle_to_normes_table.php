<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute est_universelle à la table normes.
     *
     * Une norme universelle (est_universelle = true) est proposée
     * à TOUS les départements, quel que soit leur secteur.
     *
     * Exemples : normes transversales type ISO 31000 (Risk Management).
     *
     * NE PAS confondre avec statut = 'actif' / 'inactif'.
     * est_universelle ne modifie pas le catalogue global ; c'est
     * une propriété de la norme qui dit qu'elle s'applique partout.
     */
    public function up(): void
    {
        Schema::table('normes', function (Blueprint $table) {
            $table->boolean('est_universelle')
                  ->default(false)
                  ->after('statut')
                  ->comment('Si true, la norme est proposée à tous les départements quel que soit leur secteur.');
        });
    }

    public function down(): void
    {
        Schema::table('normes', function (Blueprint $table) {
            $table->dropColumn('est_universelle');
        });
    }
};
