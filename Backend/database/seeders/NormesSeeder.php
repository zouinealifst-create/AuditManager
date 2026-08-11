<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\normes\Norme;

class NormesSeeder extends Seeder
{
    /**
     * Seed la table normes depuis database/data/normes.csv
     * Utilise updateOrCreate pour eviter les doublons.
     * Peut etre execute plusieurs fois sans risque.
     */
    public function run(): void
    {
        $csvPath = database_path('data/normes.csv');

        if (!file_exists($csvPath)) {
            $this->command->error("Fichier CSV introuvable : " . $csvPath);
            return;
        }

        $handle = fopen($csvPath, 'r');
        if ($handle === false) {
            $this->command->error("Impossible d'ouvrir le fichier CSV.");
            return;
        }

        // Lecture des headers
        $headers = fgetcsv($handle, 0, ',');
        if ($headers === false) {
            $this->command->error("Fichier CSV vide ou invalide.");
            fclose($handle);
            return;
        }

        // Supprime le BOM UTF-8 eventuel
        $headers = array_map(fn($h) => ltrim($h, "\xEF\xBB\xBF"), $headers);
        $this->command->info("En-tetes CSV detectes : " . implode(', ', $headers));

        // Validation des colonnes requises
        $required = ['code', 'nom', 'description', 'version', 'organisme', 'statut', 'secteur'];
        foreach ($required as $col) {
            if (!in_array($col, $headers)) {
                $this->command->error("Colonne manquante dans le CSV : " . $col);
                fclose($handle);
                return;
            }
        }

        $imported = 0;
        $skipped  = 0;
        $errors   = 0;
        $line     = 1;

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            $line++;

            // Ligne incomplete
            if (count($row) < count($headers)) {
                $skipped++;
                continue;
            }

            $data = array_combine($headers, $row);
            $code = trim($data['code'] ?? '');

            // Ignore les lignes sans code (cle unique)
            if (empty($code)) {
                $skipped++;
                continue;
            }

            $nom         = mb_substr(trim($data['nom']         ?? ''), 0, 300);
            $description = mb_substr(trim($data['description'] ?? ''), 0, 500);
            $version     = mb_substr(trim($data['version']     ?? ''), 0, 50);
            $organisme   = mb_substr(trim($data['organisme']   ?? ''), 0, 100);
            $secteur     = mb_substr(trim($data['secteur']     ?? ''), 0, 100);
            $statut      = trim($data['statut'] ?? 'actif');

            if (!in_array($statut, ['actif', 'inactif'])) {
                $statut = 'actif';
            }

            try {
                Norme::updateOrCreate(
                    ['code' => $code],
                    [
                        'nom'         => $nom,
                        'description' => $description,
                        'version'     => $version,
                        'organisme'   => $organisme,
                        'secteur'     => $secteur,
                        'statut'      => $statut,
                    ]
                );
                $imported++;
            } catch (\Exception $e) {
                $this->command->warn("Ligne " . $line . " ignoree : " . $e->getMessage());
                $errors++;
            }
        }

        fclose($handle);

        $this->command->newLine();
        $this->command->info("╔══════════════════════════════════════════╗");
        $this->command->info("║      IMPORT NORMES — RESUME              ║");
        $this->command->info("╠══════════════════════════════════════════╣");
        $this->command->info("║  Importees / mises a jour : " . str_pad((string)$imported, 13) . " ║");
        $this->command->info("║  Lignes ignorees          : " . str_pad((string)$skipped,  13) . " ║");
        $this->command->info("║  Erreurs                  : " . str_pad((string)$errors,   13) . " ║");
        $this->command->info("╚══════════════════════════════════════════╝");
        $this->command->newLine();
    }
}
