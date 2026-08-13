<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pivot entreprise <-> norme (many-to-many).
     * Permet de lier des normes spécifiques à une entreprise.
     * Peut aussi être alimenté automatiquement depuis les secteurs choisis.
     */
    public function up(): void
    {
        Schema::create('entreprise_norme', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')
                  ->constrained('entreprises')
                  ->cascadeOnDelete();
            $table->foreignId('norme_id')
                  ->constrained('normes')
                  ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['entreprise_id', 'norme_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entreprise_norme');
    }
};
