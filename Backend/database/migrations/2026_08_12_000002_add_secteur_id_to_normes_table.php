<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table pivot entre normes et secteurs.
     * Une norme peut appartenir à plusieurs secteurs (ex : ISO 45001 → Santé + Industrie).
     * Ne jamais supprimer de lignes dans la table maître normes.
     */
    public function up(): void
    {
        Schema::create('norme_secteur', function (Blueprint $table) {
            $table->id();
            $table->foreignId('norme_id')
                  ->constrained('normes')
                  ->cascadeOnDelete();
            $table->foreignId('secteur_id')
                  ->constrained('secteurs')
                  ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['norme_id', 'secteur_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('norme_secteur');
    }
};
