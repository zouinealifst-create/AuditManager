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
        Schema::table('entreprises', function (Blueprint $table) {
            $table->string('telephone')->nullable()->after('adresse');
            $table->string('email')->nullable()->after('telephone');
            $table->string('secteur_activite')->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->dropColumn(['telephone', 'email', 'secteur_activite']);
        });
    }
};
