<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute secteur_id à la table departements.
     *
     * Un département appartient à UN seul secteur principal.
     * Ce secteur doit être un secteur déjà rattaché à l'entreprise
     * via la table pivot entreprise_secteur.
     *
     * Nullable pour ne pas bloquer les données existantes.
     */
    public function up(): void
    {
        Schema::table('departements', function (Blueprint $table) {
            $table->foreignId('secteur_id')
                  ->nullable()
                  ->after('entreprise_id')
                  ->constrained('secteurs')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('departements', function (Blueprint $table) {
            $table->dropForeign(['secteur_id']);
            $table->dropColumn('secteur_id');
        });
    }
};
