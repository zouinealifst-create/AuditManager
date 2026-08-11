<?php

$csvPath  = 'database/data/normes.csv';
$tempPath = 'database/data/normes_temp.csv';

if (!file_exists($csvPath)) {
    die("Fichier CSV introuvable.\n");
}

$in  = fopen($csvPath, 'r');
$out = fopen($tempPath, 'w');

$headers = fgetcsv($in, 0, ',', '"', '\\');
if ($headers === false) {
    die("CSV vide.\n");
}

fputcsv($out, $headers, ',', '"', '\\');

$nomIndex     = array_search('nom', $headers);
$secteurIndex = array_search('secteur', $headers);

if ($nomIndex === false || $secteurIndex === false) {
    die("Colonnes 'nom' ou 'secteur' introuvables.\n");
}

// ─────────────────────────────────────────────────────────────────────
//  Mappings complets basés sur l'analyse réelle du CSV (447 normes)
//  Chaque secteur liste ses mots-clés en français + anglais
//  Les secteurs sont testés dans l'ordre → le premier match gagne
// ─────────────────────────────────────────────────────────────────────
function determineSecteur(string $nom): string
{
    $low = mb_strtolower($nom, 'UTF-8');

    $mappings = [

        // ── TIC & Numérique ──────────────────────────────────────────
        'Informatique & Technologies' => [
            'informatique', 'logiciel', 'données', 'numérique', 'ordinateur',
            'réseau', 'internet', 'intelligence artificielle', 'téléinformatique',
            'programmation', 'technologies de l\'information', 'quantique', 'quantum',
            'biométrie', 'cloud', 'cybersécurité', 'cryptograph',
            'internet des objets', 'jumeau numérique', 'plate-forme',
            'interfaces utilisateur', 'codage', 'multimedia', 'hypermédia',
            'identification automatique', 'interconnexion', 'interfaces cerveau',
            'passeport numérique', 'vie privée', 'langages de programmation',
            'description des documents', 'traitement de l\'information',
            'sécurité de l\'information', 'électronique', 'pharmacie',
            'audit data', 'géomatique', 'information géographique',
            'nanotechnolog', 'fabrication additive',
        ],

        // ── Alimentation ─────────────────────────────────────────────
        'Agroalimentaire' => [
            'aliment', 'fruit', 'légume', 'céréale', 'viande', 'poisson',
            'cacao', 'épice', 'lait', 'sensoriel', 'alimentaire',
            'produits apicoles', 'microbiologie', 'denrées', 'gaspillage',
            'biomarqueurs moléculaires', 'pêches', 'aquaculture',
        ],

        // ── Agriculture ──────────────────────────────────────────────
        'Agriculture & Foresterie' => [
            'tracteur', 'forestier', 'récolte', 'irrigation',
            'machines agricoles', 'animaux', 'agroforest', 'bambou', 'rotin',
        ],

        // ── Pétrole, Gaz & Énergie ───────────────────────────────────
        'Énergie & Ressources' => [
            'pétrole', 'combustible', 'lubrifiant', 'gaz naturel', 'gaz à effet',
            'émissions', 'développement durable', 'hydroélectrique', 'lithium',
            'terres rares', 'métaux et minéraux', 'mechanical energy storage',
            'recyclage des eaux', 'valorisation', 'recyclage', 'élimination',
        ],

        // ── Environnement ─────────────────────────────────────────────
        'Environnement & Développement durable' => [
            'environnement', 'climatique', 'énergie', 'écologique', 'pollution',
            'durable', 'déchet', 'débit', 'mesurage des combustibles',
            'mesure de débit', 'villes intelligentes', 'communautés intelligentes',
            'biodiversité', 'karst', 'eau potable', 'assainissement',
            'eaux pluviales', 'cycle de vie',
        ],

        // ── Industrie & Fabrication ───────────────────────────────────
        'Industrie & Mécanique' => [
            'acier', 'métal', 'mécanique', 'tube', 'chaudière', 'récipient',
            'roulement', 'pâtes et papiers', 'papier', 'textile', 'fibre',
            'étoffes', 'soudage', 'peinture', 'inoxydable',
            'essais, mesurage', 'normes de référence', 'conventions générales',
            'coke', 'fonderie', 'machines d\'emballage', 'machine', 'usines',
            'tuyauteries', 'équipement', 'fours industriels', 'artificies',
        ],

        // ── Maritime ─────────────────────────────────────────────────
        'Maritime' => [
            'navire', 'maritime', 'bateau', 'port', 'yacht', 'navigation',
        ],

        // ── Aéronautique & Espace ─────────────────────────────────────
        'Aéronautique & Espace' => [
            'aéronautique', 'aéronef', 'aéroport', 'spatial', 'aéronefs sans pilote',
            'systèmes spatiaux',
        ],

        // ── Automobile & Transports ───────────────────────────────────
        'Automobile & Transports' => [
            'véhicule', 'automobile', 'voiture', 'camion', 'motocycle',
            'propulsion', 'poids lourds', 'éclairage et visibilité',
            'combustibles gazeux', 'transport intelligent', 'intermodal',
            'ferroviaire', 'logistique', 'service express', 'chaîne du froid',
        ],

        // ── Santé ─────────────────────────────────────────────────────
        'Santé & Médecine' => [
            'santé', 'médical', 'médecine', 'laboratoire', 'diagnostic',
            'médecine traditionnelle', 'ayurveda', 'pharmacie',
            'wound dressing', 'biotechnolog', 'médicament', 'puériculture',
            'systèmes microphysiologiques',
        ],

        // ── Sécurité & Prévention ─────────────────────────────────────
        'Sécurité & Protection' => [
            'sécurité', 'ergonomie', 'acoustique', 'incendie', 'extincteur',
            'lutte contre l\'incendie', 'fumée', 'détection d\'incendie',
            'risque', 'hygiène', 'gestion des urgences', 'plates-formes élévatrices',
            'biocides', 'antimicrobiennes', 'criminalistique',
        ],

        // ── Construction ──────────────────────────────────────────────
        'Construction & BTP' => [
            'construction', 'bâtiment', 'architecture', 'infrastructure',
            'documentation de construction', 'structure en acier',
            'lumière et éclairage', 'éclairage',
        ],

        // ── Métrologie & Sciences ─────────────────────────────────────
        'Métrologie & Sciences' => [
            'spectroscopie', 'microscopie', 'métrologie', 'rayons x',
            'microfaisceaux', 'analytique', 'méthodes analytiques',
            'évaluation', 'essai', 'spécifications dimensionnelles',
            'géométriques', 'instruments de mesure', 'échantillonnage',
            'classifications et spécifications', 'méthodes de vitesse',
            'méthodes volumétriques',
        ],

        // ── Services & Management ─────────────────────────────────────
        'Services & Management' => [
            'terminologie', 'traduction', 'management', 'gouvernance',
            'ingénierie du logiciel', 'systèmes de management', 'information et documentation',
            'bibliothèque', 'archives', 'ressources linguistiques', 'interprétation',
            'apprentissage', 'éducation', 'conditions générales', 'lignes directrices',
            'gestion des actifs', 'conformité', 'excellence de service',
            'centres de contact', 'droits de l\'enfant', 'dignité humaine',
            'gestion de la conformité', 'économie du partage',
            'tourisme', 'services connexes', 'assurance',
            'commerce électronique', 'documentation technique',
            'documentation pour les usines', 'commandes, symboles',
            'gestion des ressources', 'interopérabilité technique',
            'statistiques', 'identification et description', 'stockage et conservation',
        ],
    ];

    foreach ($mappings as $secteur => $keywords) {
        foreach ($keywords as $kw) {
            if (mb_strpos($low, $kw, 0, 'UTF-8') !== false) {
                return $secteur;
            }
        }
    }

    return 'Autre / Général';
}

$updated = 0;
while (($row = fgetcsv($in, 0, ',', '"', '\\')) !== false) {
    while (count($row) < count($headers)) {
        $row[] = '';
    }
    $row[$secteurIndex] = determineSecteur($row[$nomIndex]);
    fputcsv($out, $row, ',', '"', '\\');
    $updated++;
}

fclose($in);
fclose($out);
rename($tempPath, $csvPath);

// --- Afficher un résumé rapide ---
echo "✔ Secteurs mis a jour pour $updated normes.\n\n";

$f = fopen($csvPath, 'r');
fgetcsv($f, 0, ',', '"', '\\'); // skip header
$stats = [];
while (($row = fgetcsv($f, 0, ',', '"', '\\')) !== false) {
    $s = $row[$secteurIndex] ?? '';
    $stats[$s] = ($stats[$s] ?? 0) + 1;
}
fclose($f);
arsort($stats);
echo str_pad("Secteur", 45) . "Nb\n";
echo str_repeat('-', 52) . "\n";
foreach ($stats as $s => $n) {
    echo str_pad($s, 45) . $n . "\n";
}
echo str_repeat('-', 52) . "\n";
echo str_pad("TOTAL", 45) . array_sum($stats) . "\n";
