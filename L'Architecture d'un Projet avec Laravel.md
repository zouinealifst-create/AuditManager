# 🏗️ L'Architecture d'un Projet avec Laravel

> **Projet :** AuditManager — Backend Laravel
> **Date :** Août 2026

---

## 📌 Vue d'ensemble

Laravel suit le patron architectural **MVC (Model – View – Controller)**, enrichi par des couches supplémentaires comme les Middlewares, les Providers, les Routes, etc. Chaque dossier a un rôle précis et bien défini dans le cycle de vie d'une requête HTTP.

```
AuditManager/Backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   ├── Models/
│   └── Providers/
├── bootstrap/
├── config/
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── public/
├── resources/
│   ├── css/
│   └── js/
├── routes/
│   ├── api.php
│   ├── console.php
│   └── web.php
├── storage/
├── tests/
└── vendor/
```

---

## 📂 Détail de chaque dossier et fichier

---

### 📁 `app/` — Le Cœur de l'Application

> C'est ici que vit toute la **logique métier** de votre application.
> C'est le dossier le plus important du projet.

---

#### 📁 `app/Http/Controllers/`

**Rôle :** Contient les **contrôleurs** de l'application.

Un contrôleur est le **chef d'orchestre** : il reçoit la requête HTTP de l'utilisateur, appelle les modèles pour récupérer/modifier des données, puis retourne une réponse (JSON pour une API, ou une vue pour le web).

**Exemple concret :**
```php
// app/Http/Controllers/AuditController.php
class AuditController extends Controller
{
    public function index()
    {
        $audits = Audit::all(); // Demande au modèle
        return response()->json($audits); // Retourne la réponse
    }
}
```

**Bonnes pratiques :**
- Un contrôleur par ressource (ex: `UserController`, `AuditController`)
- Utiliser les **Resource Controllers** avec les 7 méthodes CRUD : `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`
- Ne pas mettre de logique métier complexe ici → déléguer aux **Services** ou **Repositories**

---

#### 📁 `app/Http/Middleware/` *(à créer selon besoin)*

**Rôle :** Filtres qui s'exécutent **avant ou après** une requête HTTP.

Les middlewares agissent comme des **gardiens** : ils inspectent chaque requête et peuvent l'accepter, la modifier ou la rejeter.

**Exemples de middlewares courants :**
- `auth` → Vérifie si l'utilisateur est connecté
- `cors` → Gère les en-têtes CORS pour les APIs
- `throttle` → Limite le nombre de requêtes (rate limiting)
- Middleware personnalisé → Ex: vérifier si l'utilisateur est un auditeur

```php
// Middleware personnalisé
public function handle(Request $request, Closure $next)
{
    if (!$request->user()->isAuditor()) {
        return response()->json(['error' => 'Accès refusé'], 403);
    }
    return $next($request); // Laisse passer la requête
}
```

---

#### 📁 `app/Models/`

**Rôle :** Contient les **modèles Eloquent** — la représentation PHP de vos tables de base de données.

Chaque modèle correspond à **une table** dans la base de données et permet d'interagir avec elle de façon orientée objet (sans écrire de SQL brut).

**Exemple :**
```php
// app/Models/User.php
class User extends Authenticatable
{
    protected $fillable = ['name', 'email', 'password'];

    // Relation : un utilisateur a plusieurs audits
    public function audits()
    {
        return $this->hasMany(Audit::class);
    }
}
```

**Fonctionnalités des modèles Eloquent :**
| Fonctionnalité | Description |
|---|---|
| `$fillable` | Champs autorisés à être remplis en masse |
| `$hidden` | Champs cachés dans les réponses JSON (ex: `password`) |
| `$casts` | Conversion automatique de types (ex: JSON → array) |
| Relations | `hasOne`, `hasMany`, `belongsTo`, `belongsToMany` |
| Scopes | Requêtes réutilisables (ex: `scopeActive`) |

---

#### 📁 `app/Providers/`

**Rôle :** Contient les **Service Providers** — le mécanisme de démarrage (bootstrap) de Laravel.

Les providers sont des **classes d'initialisation** chargées au démarrage de l'application. Ils enregistrent des services, des bindings dans le conteneur d'injection de dépendances, des routes, des vues, etc.

**Fichier présent dans votre projet :**
- `AppServiceProvider.php` → Point d'entrée principal pour enregistrer vos services personnalisés

```php
// app/Providers/AppServiceProvider.php
public function register(): void
{
    // Lier une interface à une implémentation concrète
    $this->app->bind(AuditRepositoryInterface::class, AuditRepository::class);
}

public function boot(): void
{
    // Code exécuté après le chargement de tous les providers
    // Ex: enregistrer des observers, des gates de sécurité...
}
```

**Providers à ajouter selon les besoins :**
- `AuthServiceProvider` → Politiques d'autorisation (Policies et Gates)
- `RouteServiceProvider` → Configuration avancée des routes
- `EventServiceProvider` → Liaison événements/écouteurs

---

### 📁 `bootstrap/` — Démarrage du Framework

**Rôle :** Contient les fichiers nécessaires au **démarrage (bootstrap) de Laravel**.

- `app.php` → Crée l'instance principale de l'application Laravel
- `cache/` → Contient les fichiers de cache générés (`config.php`, `routes.php`) pour améliorer les performances en production

> ⚠️ **Ne jamais modifier manuellement** les fichiers dans `bootstrap/cache/`. Ils sont auto-générés via `php artisan config:cache` et `php artisan route:cache`.

---

### 📁 `config/` — Configuration Centralisée

**Rôle :** Contient tous les **fichiers de configuration** de l'application.

Chaque fichier correspond à un aspect spécifique du système :

| Fichier | Rôle |
|---|---|
| `app.php` | Configuration générale (nom, timezone, locale, providers) |
| `auth.php` | Authentification (guards, providers, passwords) |
| `cache.php` | Pilote de cache (Redis, Memcached, file, database) |
| `cors.php` | Configuration CORS pour votre API (origines autorisées) |
| `database.php` | Connexions aux bases de données (MySQL, SQLite, PostgreSQL) |
| `filesystems.php` | Stockage de fichiers (local, S3, etc.) |
| `logging.php` | Canaux de journalisation (stack, daily, Slack, Sentry) |
| `mail.php` | Configuration email (SMTP, Mailgun, SES) |
| `queue.php` | Files d'attente (database, Redis, SQS) |
| `sanctum.php` | Configuration de Sanctum (authentification API par tokens) |
| `services.php` | Clés de services tiers (Stripe, Mailgun, AWS...) |
| `session.php` | Gestion des sessions (durée, pilote, sécurité) |

**Bonne pratique :** Les valeurs sensibles (mots de passe, clés API) ne vont **jamais** dans ces fichiers directement — elles passent par le fichier `.env` :
```php
// Dans config/database.php
'password' => env('DB_PASSWORD'), // ✅ Sécurisé
'password' => 'monmotdepasse',    // ❌ Dangereux
```

---

### 📁 `database/` — Gestion de la Base de Données

**Rôle :** Contient tout ce qui concerne la **création et le peuplement** de la base de données.

---

#### 📁 `database/migrations/`

**Rôle :** Les **migrations** sont des scripts de création/modification de tables, écrits en PHP.

Elles servent de **contrôle de version pour la base de données** : chaque développeur peut reproduire exactement la même structure de BDD.

```php
// Exemple de migration
public function up(): void
{
    Schema::create('audits', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->text('description')->nullable();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->timestamps();
    });
}
```

**Commandes utiles :**
```bash
php artisan migrate              # Exécuter les migrations
php artisan migrate:rollback     # Annuler la dernière migration
php artisan migrate:fresh        # Recréer toutes les tables
php artisan make:migration create_audits_table
```

---

#### 📁 `database/seeders/`

**Rôle :** Les **seeders** peuplent la base de données avec des données de test ou des données initiales.

```php
// database/seeders/DatabaseSeeder.php
public function run(): void
{
    User::factory(10)->create(); // Crée 10 utilisateurs fictifs
    $this->call(AuditSeeder::class); // Appelle un seeder spécifique
}
```

```bash
php artisan db:seed              # Exécuter tous les seeders
php artisan db:seed --class=AuditSeeder
```

---

#### 📁 `database/factories/`

**Rôle :** Les **factories** définissent des modèles de données fictives pour les tests et le seeding.

```php
// database/factories/UserFactory.php
public function definition(): array
{
    return [
        'name'     => fake()->name(),
        'email'    => fake()->unique()->safeEmail(),
        'password' => bcrypt('password'),
    ];
}
```

---

### 📁 `public/` — Point d'Entrée Public

**Rôle :** C'est le **seul dossier accessible publiquement** par le navigateur / serveur web.

- `index.php` → **Point d'entrée unique** de toute l'application (le Front Controller). Toutes les requêtes HTTP passent par là.
- `favicon.ico` → Icône du site
- Assets compilés (CSS, JS) → Générés par Vite/Mix

> 🔒 **Sécurité :** Le serveur web (Apache/Nginx) doit pointer **uniquement** vers ce dossier. Les autres dossiers (`app/`, `config/`, `.env`) ne doivent jamais être accessibles directement depuis Internet.

**Configuration Nginx recommandée :**
```nginx
root /var/www/html/AuditManager/Backend/public;
```

---

### 📁 `resources/` — Ressources Frontend Non-Compilées

**Rôle :** Contient les **fichiers source** du frontend (avant compilation).

#### 📁 `resources/css/`
Fichiers CSS source (SASS, CSS natif). Compilés et optimisés par Vite vers `public/build/`.

#### 📁 `resources/js/`
Fichiers JavaScript/Vue/React source. Compilés par Vite vers `public/build/`.

#### 📁 `resources/views/` *(standard Laravel — si vous utilisez Blade)*
Templates **Blade** de Laravel (moteur de templates PHP).
```php
{{-- resources/views/welcome.blade.php --}}
<h1>Bonjour, {{ $user->name }}</h1>

@if($user->isAdmin())
    <p>Vous êtes administrateur.</p>
@endif
```

> 📌 **Pour votre projet API :** Si le backend est une API pure (consommée par un frontend séparé React/Vue), les dossiers `resources/views/`, `resources/css/` et `resources/js/` sont peu utilisés.

---

### 📁 `routes/` — Définition des Routes

**Rôle :** Définit **tous les points d'entrée URL** de l'application.

---

#### 📄 `routes/api.php`

**Rôle :** Routes pour votre **API REST**.

Ces routes sont automatiquement préfixées par `/api` et utilisent les middlewares `api` (stateless, sans session).

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('audits', AuditController::class);
    Route::get('/user', fn(Request $r) => $r->user());
});

// Accès : GET /api/audits
//         POST /api/audits
//         PUT /api/audits/{id}
//         DELETE /api/audits/{id}
```

---

#### 📄 `routes/web.php`

**Rôle :** Routes pour les **pages web traditionnelles** avec sessions, cookies, CSRF.

```php
// routes/web.php
Route::get('/', function () {
    return view('welcome');
});
```

---

#### 📄 `routes/console.php`

**Rôle :** Définit les **commandes Artisan personnalisées** accessibles en ligne de commande.

```php
// routes/console.php
Artisan::command('audit:generate-report', function () {
    $this->info('Génération du rapport d\'audit...');
})->purpose('Génère un rapport mensuel d\'audit');
```

```bash
php artisan audit:generate-report
```

---

### 📁 `storage/` — Stockage Interne

**Rôle :** Stocke tous les **fichiers générés par l'application** (logs, cache, uploads, sessions).

```
storage/
├── app/
│   └── public/      → Fichiers uploadés (accessibles via lien symbolique)
├── framework/
│   ├── cache/       → Cache de l'application
│   ├── sessions/    → Sessions utilisateurs
│   └── views/       → Vues Blade compilées (cache)
└── logs/
    └── laravel.log  → Journal des erreurs et événements
```

> 🔑 **Important :** Pour rendre les fichiers uploadés accessibles publiquement, exécutez :
> ```bash
> php artisan storage:link
> ```
> Cela crée un lien symbolique `public/storage` vers `storage/app/public`

---

### 📁 `tests/` — Tests Automatisés

**Rôle :** Contient tous les **tests automatisés** du projet.

```
tests/
├── Feature/     → Tests d'intégration (testent des flux complets HTTP)
└── Unit/        → Tests unitaires (testent une fonction/classe isolée)
```

**Exemple de test Feature pour votre API :**
```php
// tests/Feature/AuditTest.php
public function test_authenticated_user_can_list_audits(): void
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)
                     ->getJson('/api/audits');

    $response->assertStatus(200)
             ->assertJsonStructure(['data' => [['id', 'title']]]);
}
```

```bash
php artisan test                 # Lancer tous les tests
php artisan test --filter=Audit  # Lancer les tests d'audit seulement
```

---

### 📁 `vendor/` — Dépendances Composer

**Rôle :** Contient **toutes les bibliothèques tierces** installées via Composer (le gestionnaire de paquets PHP).

- Laravel lui-même se trouve dans `vendor/laravel/framework/`
- Sanctum : `vendor/laravel/sanctum/`
- PHPUnit : `vendor/phpunit/phpunit/`

> ⛔ **Règle absolue :** Ne **jamais modifier** les fichiers dans `vendor/`. Ne jamais committer ce dossier dans Git (il est dans `.gitignore`).
>
> Pour restaurer : `composer install`

---

## 📄 Fichiers Racine Importants

| Fichier | Rôle |
|---|---|
| `.env` | Variables d'environnement (BDD, mail, clés API). **Ne jamais committer !** |
| `.env.example` | Modèle du `.env` à partager avec l'équipe (sans valeurs sensibles) |
| `artisan` | Interface en ligne de commande de Laravel |
| `composer.json` | Liste des dépendances PHP + scripts |
| `composer.lock` | Versions exactes des dépendances installées (à committer) |
| `package.json` | Dépendances JavaScript (Vite, etc.) |
| `phpunit.xml` | Configuration des tests PHPUnit |
| `vite.config.js` | Configuration du bundler Vite pour les assets frontend |

---

## 🔄 Cycle de Vie d'une Requête Laravel

```
Navigateur / Client API
        │
        ▼
  public/index.php          ← Point d'entrée unique
        │
        ▼
  bootstrap/app.php         ← Création de l'application
        │
        ▼
  app/Http/Kernel.php       ← Chargement des Middlewares globaux
        │
        ▼
  routes/api.php            ← Correspondance de la route
        │
        ▼
  Middlewares de route      ← Ex: auth:sanctum, throttle
        │
        ▼
  app/Http/Controllers/     ← Traitement de la logique
        │
        ▼
  app/Models/               ← Interaction avec la base de données
        │
        ▼
  Réponse JSON / View       ← Retour au client
```

---

## 🗂️ Dossiers à Créer Selon les Besoins

Pour un projet API comme **AuditManager**, voici les dossiers recommandés à ajouter :

| Dossier | Rôle |
|---|---|
| `app/Http/Requests/` | Form Requests — Validation centralisée des données entrantes |
| `app/Http/Resources/` | API Resources — Transformation des modèles en JSON structuré |
| `app/Http/Middleware/` | Middlewares personnalisés |
| `app/Services/` | Logique métier complexe (séparation des responsabilités) |
| `app/Repositories/` | Abstraction de l'accès aux données |
| `app/Exceptions/` | Gestion personnalisée des exceptions |
| `app/Events/` | Événements de l'application |
| `app/Listeners/` | Écouteurs des événements |
| `app/Jobs/` | Tâches en arrière-plan (queues) |
| `app/Policies/` | Politiques d'autorisation par modèle |

---

## 💡 Résumé

```
┌─────────────────────────────────────────────────────────┐
│                    LARAVEL MVC                          │
├──────────┬──────────────┬──────────────────────────────┤
│  MODEL   │     VIEW     │         CONTROLLER           │
│          │              │                              │
│ app/     │ resources/   │ app/Http/Controllers/        │
│ Models/  │ views/       │                              │
│          │              │                              │
│ Eloquent │ Blade        │ Reçoit requête               │
│ ORM      │ Templates    │ Appelle Model                │
│          │              │ Retourne réponse             │
└──────────┴──────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE                          │
├──────────────┬──────────────┬──────────────────────────┤
│   routes/    │   config/    │        database/         │
│              │              │                          │
│ URLs → Ctrl  │ Paramètres   │ migrations/ → Structure  │
│ api.php      │ BDD, Mail,   │ seeders/   → Données     │
│ web.php      │ Auth, Cache  │ factories/ → Faux data   │
└──────────────┴──────────────┴──────────────────────────┘
```

---

*Document généré pour le projet AuditManager — Stage 2026*
