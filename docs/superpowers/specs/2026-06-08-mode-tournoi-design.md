# Mode Tournoi — Design

Date : 2026-06-08
Branche : `tournois`

## Objectif

Ajouter un **mode tournoi** à ScoreSmash, séparé du mode classique. On configure une
liste de joueurs, on enchaîne des matchs de poule au hasard (personne n'est éliminé),
puis les meilleurs s'affrontent dans une phase finale à élimination directe jusqu'au
champion. Les matchs s'enchaînent automatiquement avec annonce vocale et pause.

Pensé pour être joué de façon conviviale, typiquement à 3-4 joueurs.

## Principe

Tournoi en deux temps :

1. **Poule** : un nombre fixe de matchs, paires tirées au hasard, **aucune élimination**,
   on compte les victoires.
2. **Phase finale** : les N meilleurs entrent dans un **vrai tableau à élimination directe**
   (type tennis), gagnant avance / perdant éliminé, jusqu'au champion.

Chaque « match » du tournoi est un match classique complet (mêmes points/sets/jeux que le
mode existant), joué sur l'écran `/badminton` en réutilisant la classe `Badminton`.

## Configuration

Nouvelle page de config tournoi, atteinte via un bouton **« Mode tournoi »** ajouté sur
`start.html`.

Paramètres :

- **Joueurs** : liste dynamique (ajout ➕ / suppression 🗑️), **minimum 2**, sans maximum.
- **Nombre de matchs de poule** : champ numérique (ex : 8).
- **Phase finale** : menu déroulant **limité selon le nombre de joueurs**. On ne propose que
  les tailles réalisables, c.-à-d. les puissances de 2 inférieures ou égales au nombre de
  joueurs ajoutés :
  - 2 joueurs → *Finale* (2)
  - 3 joueurs → *Finale* (2)
  - 4-5-6-7 joueurs → *Finale* (2) ou *Demi-finale* (4)
  - 8-15 joueurs → jusqu'au *Quart* (8)
  - 16+ → jusqu'au *Huitième* (16), etc.

  Labels : Finale = 2, Demi-finale = 4, Quart = 8, Huitième = 16, Seizième = 32.
- **Paramètres classiques** (identiques au mode existant) : points par set, sets par jeu,
  jeux par match, échauffement + durée, pauses (début / set / jeu).

## Déroulé

1. **Confirmation** : un **tableau** récapitulatif s'affiche (joueurs, nombre de matchs de
   poule, forme de la phase finale). Bouton **« Démarrer le tournoi »** pour lancer.
2. **Poule** : on joue le nombre de matchs fixé. À chaque match, **2 joueurs distincts tirés
   au hasard**, en évitant de rejouer exactement la même paire deux fois de suite tant que
   c'est possible. Personne n'est éliminé. On incrémente les victoires du gagnant.
3. **Qualification** : à la fin de la poule, classement par nombre de victoires décroissant.
   Les **N meilleurs** (N = taille de la phase finale) sont qualifiés. Gestion des égalités :
   voir ci-dessous.
4. **Phase finale** : tableau à élimination directe entre les N qualifiés. Placement par
   tête de série (1er du classement vs dernier qualifié, 2e vs avant-dernier, etc.). Gagnant
   avance, perdant éliminé, jusqu'à la finale et au **champion** 🏆.
5. **Enchaînement** : entre chaque match (poule, barrage ou phase finale), la voix annonce le
   prochain match, un **compte à rebours de pause** s'écoule (paramètre « pause entre les
   jeux »), puis le match suivant **démarre automatiquement**.

## Départage des égalités (barrage)

Une égalité ne pose problème que lorsqu'elle décide d'une qualification, c.-à-d. quand des
joueurs à égalité de victoires se disputent les dernières places qualificatives (l'égalité
« à cheval » sur la barre de qualification).

- Les joueurs strictement au-dessus de la barre sont qualifiés directement.
- Si T joueurs sont à égalité pour R places restantes (R < T), ils jouent un **mini
  round-robin** entre eux (chaque joueur à égalité affronte les autres une fois) ; on
  reclasse ce sous-groupe par victoires de barrage et on prend les R premiers.
  - Cas courant (2 joueurs pour 1 place) : un **seul match de barrage** décide.
- Si une égalité subsiste après ce barrage (rare), elle est tranchée par **tirage au sort**
  en dernier recours.

Les matchs de barrage sont des matchs classiques complets, annoncés par la voix, soumis à la
pause et au démarrage auto comme les autres, et affichés comme **« Barrage »** sur le tableau.

## Le tableau (affichage type tennis)

Vue persistante qui se **remplit au fur et à mesure** :

- Liste des matchs de poule joués avec leur score, et le match en cours / à venir mis en avant.
- **Classement** en direct (victoires par joueur).
- **Arbre de la phase finale** avec les labels de tour (*Quart / Demi / Finale*), rempli au
  fil des résultats.
- Éventuels matchs de **barrage**.

Affichée au démarrage (écran de confirmation) et **entre chaque match** pendant la pause.

## Architecture

Respect de la structure existante. Fichiers touchés / créés :

- **`src/view/tournoi.html`** (nouveau, seule nouvelle vue) : gère les états config →
  tableau/confirmation → entre-match → fin, dans une seule page.
- **`src/js/bad.ts`** (existant) : ajout d'un orchestrateur `Tournoi` (joueurs, calendrier,
  tirages, classement, état de la phase finale, persistance) et du branchement « mode
  tournoi » du match. La classe `Badminton` reste réutilisée telle quelle pour jouer un match.
- **`app.ts`** (existant) : ajout d'une route `/tournoi`.
- **`src/view/start.html`** (existant) : ajout du bouton « Mode tournoi ».
- **`src/css/style.css`** (existant) : styles du tableau et de la config tournoi.

Aucun autre fichier créé.

### Flux entre les pages

L'état du tournoi vit en `localStorage` (même esprit que `savedGame`).

1. `start.html` → bouton « Mode tournoi » → `/tournoi` (état config).
2. Création du tournoi → `/tournoi` (état tableau/confirmation) → « Démarrer ».
3. L'orchestrateur prépare le prochain match (les 2 joueurs + les paramètres classiques) et
   navigue vers `/badminton`.
4. `/badminton` joue le match (classe `Badminton`). En mode tournoi, à la fin du match, au
   lieu d'afficher le PDF, on enregistre le vainqueur dans l'état du tournoi et on revient
   vers `/tournoi`.
5. `/tournoi` (état entre-match) met à jour le tableau, annonce le prochain match, déroule la
   pause, puis renvoie vers `/badminton` — jusqu'à la fin du tournoi (état champion).

### Points d'intégration sur l'existant

- En mode tournoi, le chargement de `/badminton` **ne propose pas** la reprise du match
  (`savedGame`) : il charge directement le match assigné.
- En mode tournoi, à `gameEnd` : on lit `logMatch.winner`, on le reporte à l'orchestrateur,
  puis on navigue vers `/tournoi` au lieu d'afficher le bouton PDF.
- L'avertissement `beforeunload` est **désactivé pendant les navigations automatiques** du
  tournoi (sinon une confirmation bloquerait l'enchaînement).
- Le wake lock (anti-veille) reste actif pendant les matchs.

### Reprise après rechargement

- Le tournoi est sauvegardé en `localStorage` : un rechargement reprend au **tableau, entre
  deux matchs**.
- La reprise **en plein match** reste celle qui existe déjà (sauvegarde par match).

## Hors-scope v1

- Pas de PDF de tournoi (les matchs s'enchaînent automatiquement).
- Pas de seeding manuel (placement par classement uniquement).
- Pas de classement final détaillé au-delà du champion et du tableau affiché.
