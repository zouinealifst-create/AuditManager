<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->string('site_web')->nullable()->after('logo');
            $table->string('ice')->nullable()->after('site_web');
            $table->string('registre_commerce')->nullable()->after('ice');
        });
    }

    public function down(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->dropColumn(['site_web', 'ice', 'registre_commerce']);
        });
    }
};