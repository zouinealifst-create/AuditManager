<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes métier à la table audits (stub créée le 07/08).
     *
     * Un audit est basé sur UNE checklist (et accède à la norme via celle-ci).
     * L'entreprise est implicite (déploiement single-tenant, une DB par entreprise).
     */
    public function up(): void
    {
        Schema::table('audits', function (Blueprint $table) {
            $table->foreignId('checklist_id')->after('id')
                  ->constrained('checklists')
                  ->restrictOnDelete();

            $table->string('titre')->after('checklist_id');

            $table->foreignId('departement_id')->nullable()->after('titre')
                  ->constrained('departements')
                  ->nullOnDelete();

            // auditeur_id et responsable_qualite_id : unsignedBigInteger sans FK
            // constraint, conformément à la convention existante dans ce projet
            // (voir cree_par dans checklists, role_id et departement_id dans users).
            $table->unsignedBigInteger('auditeur_id')->nullable()->after('departement_id');
            $table->unsignedBigInteger('responsable_qualite_id')->nullable()->after('auditeur_id');

            $table->date('date_prevue')->nullable()->after('responsable_qualite_id');
            $table->date('date_realisation')->nullable()->after('date_prevue');

            // Cycle de vie : brouillon → planifie → en_cours → termine → cloture
            // "termine" est positionné par le module d'exécution (Dev 3), pas par ce contrôleur.
            $table->string('statut')->default('brouillon')->after('date_realisation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audits', function (Blueprint $table) {
            $table->dropForeign(['checklist_id']);
            $table->dropForeign(['departement_id']);
            $table->dropColumn([
                'checklist_id',
                'titre',
                'departement_id',
                'auditeur_id',
                'responsable_qualite_id',
                'date_prevue',
                'date_realisation',
                'statut',
            ]);
        });
    }
};
