<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NormesSeeder extends Seeder
{
    /**
     * Seed la table normes depuis database/data/normes.csv
     *
     * Utilise des upserts par lots (CHUNK_SIZE lignes) pour etre rapide
     * meme avec 38 000+ normes.
     *
     * Apres l'import des normes, synchronise la table pivot norme_secteur :
     * - Cree les secteurs manquants dans la table secteurs.
     * - Insere dans norme_secteur sans jamais supprimer les liens existants.
     */
    private const CHUNK_SIZE = 500;

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

        $now      = Carbon::now();
        $chunk    = [];
        $total    = 0;
        $skipped  = 0;
        $seenCodes = [];

        // -- PASSE 1 : upsert des normes par lots --
        $this->command->info("Import des normes en cours...");

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            if (count($row) < count($headers)) {
                $skipped++;
                continue;
            }

            $data = array_combine($headers, $row);
            $code = trim($data['code'] ?? '');

            if (empty($code) || isset($seenCodes[$code])) {
                $skipped++;
                continue;
            }
            $seenCodes[$code] = true;

            $statut = trim($data['statut'] ?? 'actif');
            if (!in_array($statut, ['actif', 'inactif'])) {
                $statut = 'actif';
            }

            $chunk[] = [
                'code'        => $code,
                'nom'         => mb_substr(trim($data['nom']         ?? ''), 0, 300),
                'description' => mb_substr(trim($data['description'] ?? ''), 0, 500),
                'version'     => mb_substr(trim($data['version']     ?? ''), 0, 50),
                'organisme'   => mb_substr(trim($data['organisme']   ?? ''), 0, 100),
                'secteur'     => mb_substr(trim($data['secteur']     ?? ''), 0, 100),
                'statut'      => $statut,
                'created_at'  => $now,
                'updated_at'  => $now,
            ];
            $total++;

            if (count($chunk) >= self::CHUNK_SIZE) {
                DB::table('normes')->upsert(
                    $chunk,
                    ['code'],
                    ['nom', 'description', 'version', 'organisme', 'secteur', 'statut', 'updated_at']
                );
                $this->command->info("  -> " . $total . " normes traitees...");
                $chunk = [];
            }
        }

        // Flush du dernier lot
        if (!empty($chunk)) {
            DB::table('normes')->upsert(
                $chunk,
                ['code'],
                ['nom', 'description', 'version', 'organisme', 'secteur', 'statut', 'updated_at']
            );
        }

        fclose($handle);

        $this->command->info("  -> " . $total . " normes traitees (termine).");

        // -- PASSE 2 : synchronisation de la table pivot norme_secteur --
        $this->command->info("Synchronisation du pivot norme_secteur...");

        // Charger les normes avec leur secteur (colonne legacy)
        $normes = DB::table('normes')
            ->whereNotNull('secteur')
            ->where('secteur', '!=', '')
            ->select('id', 'secteur')
            ->get();

        // Creer/recuperer tous les secteurs uniques
        $secteursUniques = $normes->pluck('secteur')->unique()->filter()->values();
        $secteurMap = [];

        foreach ($secteursUniques as $nomSecteur) {
            DB::table('secteurs')->insertOrIgnore([
                'nom'        => $nomSecteur,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $id = DB::table('secteurs')->where('nom', $nomSecteur)->value('id');
            $secteurMap[$nomSecteur] = $id;
        }

        $this->command->info("  -> " . count($secteurMap) . " secteurs dans la table.");

        // Inserer dans norme_secteur par lots (ignore les doublons)
        $pivotChunk = [];
        $pivotTotal = 0;

        foreach ($normes as $norme) {
            $secteurId = $secteurMap[$norme->secteur] ?? null;
            if (!$secteurId) {
                continue;
            }
            $pivotChunk[] = [
                'norme_id'   => $norme->id,
                'secteur_id' => $secteurId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $pivotTotal++;

            if (count($pivotChunk) >= self::CHUNK_SIZE) {
                DB::table('norme_secteur')->insertOrIgnore($pivotChunk);
                $pivotChunk = [];
            }
        }

        if (!empty($pivotChunk)) {
            DB::table('norme_secteur')->insertOrIgnore($pivotChunk);
        }

        $this->command->newLine();
        $this->command->info("╔══════════════════════════════════════════╗");
        $this->command->info("║      IMPORT NORMES — RESUME              ║");
        $this->command->info("╠══════════════════════════════════════════╣");
        $this->command->info("║  Normes importees / mises a jour : " . str_pad((string)$total,   6) . " ║");
        $this->command->info("║  Lignes ignorees                 : " . str_pad((string)$skipped, 6) . " ║");
        $this->command->info("║  Secteurs crees                  : " . str_pad((string)count($secteurMap), 6) . " ║");
        $this->command->info("║  Liens norme_secteur             : " . str_pad((string)$pivotTotal, 6) . " ║");
        $this->command->info("╚══════════════════════════════════════════╝");
        $this->command->newLine();
    }
}
