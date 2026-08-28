# Fiche d'Erreurs et de Résolution de Bugs (Guide pour Débutant)

Cette fiche répertorie les erreurs que nous avons rencontrées lors du développement de **AuditManager**, expliquées de manière simple pour comprendre pourquoi elles sont apparues et comment nous les avons corrigées.

---

## 1. L'erreur du bouton "Planifier" (Erreur de Validation)

> **Message d'erreur :** "Impossible. Un auditeur, un département et une date prévue sont requis pour planifier."

* **La Raison :** 
Le système (le backend) est strict : pour valider la planification d'un audit, il a absolument besoin qu'on lui fournisse une **date prévue**. Or, lorsque vous cliquiez sur le bouton "Planifier", l'application envoyait la demande sans cette date, ce qui provoquait le refus immédiat du système.
* **La Solution :** 
Nous avons modifié le code du bouton pour afficher une petite fenêtre pop-up (avec `SweetAlert2` / `Swal.fire`). Désormais, lorsque vous cliquez sur le bouton, l'application vous demande de choisir une date via un calendrier avant d'envoyer la requête au serveur.

---

## 2. Erreur 500 : "Internal Server Error" (Problème de Base de Données / Migration)

> **Symptôme :** La page chargeait mal ou affichait une erreur 500 dans la console. Les logs (journaux) de Laravel indiquaient qu'il manquait une colonne `ice` dans la table `entreprises`.

* **La Raison :** 
L'un de vos collègues a développé une nouvelle fonctionnalité nécessitant un nouveau champ (`ice`) dans la base de données. Il a créé un fichier de "migration" pour cela et l'a envoyé sur Github. En faisant `git pull`, vous avez récupéré son code, **mais votre base de données locale (sur votre machine) n'était pas encore au courant de ce changement**. Le code cherchait la colonne `ice`, ne la trouvait pas, et plantait.
* **La Solution :** 
Il suffisait de dire à la base de données de se mettre à jour avec le nouveau code en exécutant la commande : `php artisan migrate`. Cette commande a créé la colonne manquante.

---

## 3. Erreur 500 sur le serveur Frontend Vite (Fichier écrasé par erreur)

> **Symptôme :** `EntrepriseProfil.jsx:1 Failed to load resource: the server responded with a status of 500 (Internal Server Error)`. L'écran devenait blanc ou la compilation de Vite plantait.

* **La Raison :** 
C'était une erreur humaine lors du travail en équipe. Un développeur a accidentellement copié tout le code de la page `Departements.jsx` et l'a collé dans `EntrepriseProfil.jsx` avant d'envoyer son code sur Github. 
Du coup, `EntrepriseProfil.jsx` essayait de charger un fichier de style `Departements.css` qui n'existait pas dans son dossier. Le serveur frontend (Vite) ne trouvant pas ce fichier, il "crashait" complètement et renvoyait une erreur 500 au navigateur web.
* **La Solution :** 
Grâce à Git (qui garde un historique de tout), nous sommes remontés dans le temps juste pour ce fichier. Nous avons utilisé la commande `git checkout HEAD~1 -- Frontend/.../EntrepriseProfil.jsx` pour annuler la bêtise du collègue et restaurer la page de profil à son état normal.

---

## 4. L'erreur Git : "Merge Conflicts" (Conflits de Fusion)

> **Message d'erreur :** `CONFLICT (content): Merge conflict in Frontend/src/components/Sidebar.jsx ... Pulling is not possible because you have unmerged files.`

* **La Raison :** 
Imaginez que vous écriviez la fin d'un chapitre sur la page 10 d'un livre, pendant qu'un collègue écrit un autre texte, exactement sur la même page 10, à la même ligne. Lorsque vous essayez de rassembler vos deux travaux (avec `git pull` ou `git stash pop`), Git est bloqué : il ne sait pas quelle phrase garder. Il met donc l'application en pause, ajoute des balises "bizarres" dans votre code (`<<<<<<<`, `=======`, `>>>>>>>`) et vous dit : *"C'est à vous de choisir"*.
* **La Solution :** 
Pour résoudre cela, il faut aller manuellement dans les fichiers en conflit (comme `store.js` ou `Sidebar.jsx`), supprimer les balises de Git (`<<<<<<<`, etc.), et "mélanger" intelligemment le code (par exemple, garder les ajouts de votre collègue ET vos propres ajouts). Une fois le fichier nettoyé, on dit à Git que c'est résolu en l'ajoutant (`git add`) et en le validant (`git commit`).

---

## 5. Erreur de syntaxe et d'affichage (Marqueurs de conflit Git laissés dans App.jsx / JSX)

> **Symptôme :** Écran blanc ou erreur "500 Internal Server Error" dans la console signalant des caractères inattendus (`<<<<<<< HEAD`) dans `App.jsx` ou `EntrepriseProfil.jsx`.

* **La Raison :** 
Après un "Merge Conflict" (comme expliqué au point précédent), le fichier a été sauvegardé sans que les marqueurs générés par Git (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) n'aient été retirés. Comme ces marqueurs ne sont pas du code JavaScript/JSX valide, le compilateur frontend (Vite) n'arrive plus à lire le fichier et l'application "crashe" au démarrage.
* **La Solution :** 
Nous avons ouvert le fichier problématique, repéré ces balises de conflit, et nous les avons supprimées en choisissant avec soin quelle version du code conserver (par exemple, nous avons gardé les imports de RTK Query plus récents). Une fois le fichier nettoyé des balises Git, l'application s'est remise à fonctionner instantanément.
