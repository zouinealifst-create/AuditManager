<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::create('normes', function (Blueprint $table) {
        $table->id();

        $table->string('code')
              ->unique()
              ->comment('Ex: ISO 9001, ISO 14001');

        $table->string('nom');

        $table->text('description')
              ->nullable();

        $table->string('version')
              ->nullable()
              ->comment('Ex: 2015, 2019');

        $table->string('organisme')
              ->nullable()
              ->comment('Ex: ISO, AFNOR, IEC');

        $table->string('secteur')
              ->nullable()
              ->comment('Ex: Industrie, Informatique, Santé');

        $table->enum('statut', ['actif', 'inactif'])
              ->default('actif');

        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('normes');
    }
};
