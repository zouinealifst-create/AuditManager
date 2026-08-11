<?php

namespace App\Services;

use App\Models\normes\Norme;

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
}
