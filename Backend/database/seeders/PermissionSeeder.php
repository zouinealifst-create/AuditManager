<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            'dashboard' => ['view'],
            'dashboard_rq' => ['view'],
            'entreprise' => ['view', 'edit'],
            'departements' => ['view', 'create', 'edit', 'delete'],
            'users' => ['view', 'create', 'edit', 'delete'],
            'checklists' => ['view', 'create', 'edit', 'delete'],
            'audits' => ['view', 'create', 'edit', 'delete'],
        ];

        $labels = [
            'view' => 'Voir',
            'create' => 'Créer',
            'edit' => 'Modifier',
            'delete' => 'Supprimer',
        ];

        $allPermissions = [];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                $key = "{$module}.{$action}";
                $moduleName = ucfirst(str_replace('_', ' ', $module));
                $label = "{$labels[$action]} {$moduleName}";
                
                Permission::firstOrCreate(
                    ['key' => $key],
                    [
                        'module' => $module,
                        'action' => $action,
                        'label'  => $label
                    ]
                );
            }
        }

        // Note: Aucune permission n'est pré-assignée à qui que ce soit.
        // - Les Admins ont un bypass automatique via leur rôle (hasPermission retourne toujours true).
        // - Pour tous les autres utilisateurs, l'Admin assigne manuellement les permissions via le formulaire.
    }
}
