# Seek — population de véhicules

Ouvrir `index.html` dans un navigateur (ou servir ce dossier avec un serveur HTTP local).

- 20 véhicules au démarrage, réglables de 1 à 200 avec le slider, pendant le glissement.
- La vitesse maximale et la force maximale de tous les véhicules se règlent avec leurs sliders ; les véhicules créés ensuite reprennent également les valeurs choisies.
- Le fond radial animé de style LSD peut être activé ou désactivé avec le bouton dans la barre de contrôle.
- La musique générative démarre après activation par le bouton ; elle synthétise une mélodie aléatoire avec Web Audio et peut être arrêtée à tout moment.
- La cible rouge suit le pointeur, ou le bouton permet de passer à des cibles autonomes qui choisissent des points aléatoires et utilisent `Vehicle.flee()` pour éviter les véhicules proches.
- En mode cible autonome, le pointeur n'a aucun effet sur la cible ; le bouton permet de revenir au pilotage à la souris.
- En mode cible autonome, le slider règle le nombre de cibles fuyantes de 1 à 20. Leur cercle montre leur rayon d'évitement (160 px) ; elles réagissent progressivement à tous les véhicules dans ce rayon.
- Les véhicules réapparaissent au bord opposé grâce à `Vehicle.edges()`.
- À 16 px ou moins de la cible, le véhicule réapparaît ailleurs avec une vitesse et une accélération nulles.
- Les véhicules conservés lors d'un changement d'effectif gardent leur état.

`vehicle.js` et `target.js` restent inchangés. `MouseTarget` remplace la cible autonome pour cette scène. Les fonctions de gestion de population sont dans `population.js` ; la boucle p5 et les interactions sont dans `sketch.js`.

## Tests

Depuis ce dossier, avec Node.js (18 ou plus) :

```sh
node --test tests/*.test.mjs
```

Aucune dépendance à installer. Les tests exécutent le vrai `vehicle.js` avec un adaptateur vectoriel minimal et un aléatoire déterministe. La validation du rendu avec p5 et du glissement réel se fait également dans le navigateur.

La [spécification](EXO1_SPECIFICATION.md) décrit les règles, le workflow et les cas limites. Elle constitue le document de conception initial ; l'implémentation et les tests sont maintenant présents.
