<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes métier à la table checklists.
     *
     * Une checklist évalue une norme et appartient à une entreprise.
     * La norme est conservée dans le catalogue même lorsqu'elle devient inactive.
     */
    public function up(): void
    {
        Schema::table('checklists', function (Blueprint $table) {

            $table->foreignId('norme_id')
                ->after('id')
                ->constrained('normes')
                ->restrictOnDelete();

            $table->string('titre')
                ->after('norme_id');

            $table->text('description')
                ->nullable()
                ->after('titre');

            // ID du créateur selon la convention existante
            $table->unsignedBigInteger('cree_par')
                ->nullable()
                ->after('description');

            // brouillon | actif | archive
            $table->string('statut')
                ->default('brouillon')
                ->after('cree_par');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checklists', function (Blueprint $table) {
            $table->dropForeign(['norme_id']);

            $table->dropColumn([
                'norme_id',
                'titre',
                'description',
                'cree_par',
                'statut',
            ]);
        });
    }
};