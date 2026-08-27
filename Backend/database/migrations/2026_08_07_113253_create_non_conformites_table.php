<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('non_conformites', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reponse_id')->constrained('reponses')->onDelete('cascade');
            $table->foreignId('responsable_id')->nullable()->constrained('users')->onDelete('set null');

            $table->text('description');
            $table->enum('gravite', ['mineure', 'majeure', 'critique']);
            $table->enum('statut', ['ouverte', 'en_cours', 'resolue', 'validee'])->default('ouverte');

            $table->date('date_detection');
            $table->date('date_limite')->nullable();

            $table->text('commentaire_resolution')->nullable();
            $table->string('justificatif')->nullable();
            $table->date('date_resolution')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('non_conformites');
    }
};