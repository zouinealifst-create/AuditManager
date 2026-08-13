<?php

namespace App\Services;

use App\Models\Entreprise;
use App\Models\normes\Norme;
use Illuminate\Support\Facades\DB;

class NormeService
{
    /**
     * Récupérer toutes les normes.
     */
    public function getAllNormes()
    {
        return Norme::all();
    }

    /**
     * Créer une nouvelle norme.
     */
    public function createNorme(array $data)
    {
        return Norme::create($data);
    }

    /**
     * Trouver une norme par son ID.
     */
    public function getNormeById(int $id)
    {
        return Norme::find($id);
    }

    /**
     * Mettre à jour une norme.
     */
    public function updateNorme(Norme $norme, array $data)
    {
        $norme->update($data);
        return $norme;
    }

    /**
     * Désactiver une norme (suppression logique).
     */
    public function deactivateNorme(Norme $norme)
    {
        $norme->update([
            'statut' => 'inactif'
        ]);

        return $norme;
    }

    /**
     * Synchronise les secteurs d'une entreprise et met à jour automatiquement
     * l'ensemble de ses normes actives en conséquence.
     *
     * Cette méthode ne touche QUE les tables pivots (entreprise_secteur et
     * entreprise_norme). Elle ne modifie jamais la table maître `normes` ni
     * le pivot `norme_secteur` qui lie les normes à leurs secteurs de référence.
     *
     * Comportement :
     * - Les secteurs de l'entreprise sont remplacés intégralement par $secteurIds.
     * - Les normes actives (statut = 'actif') appartenant à au moins un des
     *   secteurs sélectionnés sont attachées à l'entreprise via entreprise_norme.
     * - Les normes qui ne correspondent plus à aucun secteur sélectionné sont
     *   détachées du pivot entreprise_norme (mais restent intactes dans normes).
     *
     * @param  Entreprise  $entreprise   L'entreprise dont on synchronise les secteurs.
     * @param  array       $secteurIds   Liste des IDs de secteurs à affecter.
     * @return array                     Résultat du sync Eloquent (attached/detached/updated).
     */
    public function syncSecteursForEntreprise(Entreprise $entreprise, array $secteurIds): array
    {
        return DB::transaction(function () use ($entreprise, $secteurIds) {
            $entreprise->secteurs()->sync($secteurIds);

            $normeIds = Norme::whereHas('secteurs', function ($q) use ($secteurIds) {
                    $q->whereIn('secteurs.id', $secteurIds);
                })
                ->where('statut', 'actif')
                ->pluck('normes.id');

            $syncResult = $entreprise->normes()->sync($normeIds);

            return $syncResult;
        });
    }
}
