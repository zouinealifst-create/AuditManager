<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\normes\Norme;
use App\Models\Secteur;

class SecteurBackfillSeeder extends Seeder
{
    /**
     * Backfill idempotent : attache chaque norme existante à son secteur via le pivot
     * norme_secteur, en se basant sur la colonne `secteur` (chaîne) déjà présente.
     *
     * Seules les normes qui n'ont pas encore de ligne dans norme_secteur pour le secteur
     * correspondant sont traitées — syncWithoutDetaching garantit l'idempotence totale.
     * Ne modifie jamais la table maître `normes`.
     */
    public function run(): void
    {
        $normes = Norme::whereNotNull('secteur')
            ->where('secteur', '!=', '')
            ->get();

        $backfilled = 0;
        $skipped    = 0;

        foreach ($normes as $norme) {
            // Vérifie si ce secteur est déjà attaché à cette norme
            $secteurObj = Secteur::firstOrCreate(['nom' => $norme->secteur]);
            $alreadyLinked = $norme->secteurs()
                ->where('secteurs.id', $secteurObj->id)
                ->exists();

            if ($alreadyLinked) {
                $skipped++;
                continue;
            }

            $norme->secteurs()->syncWithoutDetaching([$secteurObj->id]);
            $backfilled++;
        }

        $this->command->newLine();
        $this->command->info("╔══════════════════════════════════════════╗");
        $this->command->info("║    BACKFILL SECTEURS — RESUME            ║");
        $this->command->info("╠══════════════════════════════════════════╣");
        $this->command->info("║  Normes backfillees   : " . str_pad((string)$backfilled, 17) . " ║");
        $this->command->info("║  Deja liees (ignorees): " . str_pad((string)$skipped,    17) . " ║");
        $this->command->info("╚══════════════════════════════════════════╝");
        $this->command->newLine();
    }
}
