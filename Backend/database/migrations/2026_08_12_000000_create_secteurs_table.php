<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table maître des secteurs d'activité.
     * Peuplée automatiquement par NormesSeeder et SecteurBackfillSeeder.
     * Un secteur peut être lié à plusieurs normes ET plusieurs entreprises.
     */
    public function up(): void
    {
        Schema::create('secteurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->unique()->comment('Ex: Informatique & Technologies');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('secteurs');
    }
};
