<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pivot entreprise <-> secteur (many-to-many).
     * Une entreprise peut appartenir à plusieurs secteurs simultanément.
     */
    public function up(): void
    {
        Schema::create('entreprise_secteur', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')
                  ->constrained('entreprises')
                  ->cascadeOnDelete();
            $table->foreignId('secteur_id')
                  ->constrained('secteurs')
                  ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['entreprise_id', 'secteur_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entreprise_secteur');
    }
};
