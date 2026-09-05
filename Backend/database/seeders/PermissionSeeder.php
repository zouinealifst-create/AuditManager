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
            'normes' => ['view', 'create', 'edit', 'delete'],
            'checklists' => ['view', 'create', 'edit', 'delete'],
            'audits' => ['view', 'create', 'edit', 'delete'],
            'non-conformites' => ['view', 'create', 'edit', 'delete'],
            'actions_correctives' => ['view', 'create', 'edit', 'delete'],
        ];

        $labels = [
            'view' => 'Voir',
            'create' => 'Créer',
            'edit' => 'Modifier',
            'delete' => 'Supprimer',
        ];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                $key = "{$module}.{$action}";
                $moduleName = ucfirst(str_replace(['_', '-'], ' ', $module));
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

        // Ajouter la permission spéciale pour gérer toutes les checklists
        $manageAllChecklists = Permission::firstOrCreate(
            ['key' => 'checklists.manage_all'],
            [
                'module' => 'checklists',
                'action' => 'manage_all',
                'label'  => 'Gérer toutes les checklists (tous utilisateurs)'
            ]
        );

        // Note: Aucune permission n'est pré-assignée à qui que ce soit, sauf exception :
        // - Les Admins ont un bypass automatique via leur rôle (hasPermission retourne toujours true),
        // mais nous leur assignons tout de même explicitement `checklists.manage_all` pour suivre la consigne.
        $adminRole = Role::where('name', 'Admin')->first();
        if ($adminRole) {
            $adminUsers = User::where('role_id', $adminRole->id)->get();
            foreach ($adminUsers as $adminUser) {
                $adminUser->permissions()->syncWithoutDetaching([$manageAllChecklists->id]);
            }
        }
    }
}
