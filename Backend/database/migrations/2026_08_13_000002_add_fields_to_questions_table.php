<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes métier à la table questions (stub créée le 07/08).
     *
     * Une question appartient à UNE checklist ; cascadeOnDelete car une
     * question n'a pas de sens sans sa checklist.
     */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('checklist_id')->after('id')
                  ->constrained('checklists')
                  ->cascadeOnDelete();

            $table->text('texte')->after('checklist_id');

            $table->unsignedInteger('ordre')->default(0)->after('texte');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['checklist_id']);
            $table->dropColumn(['checklist_id', 'texte', 'ordre']);
        });
    }
};
