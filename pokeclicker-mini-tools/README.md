# PokéClicker Mini Tools FR

Script Tampermonkey en français, version **1.3.0**.

## Installation

Ouvrez le script **[installer PokéTools](https://raw.githubusercontent.com/Ironakatina33/Clicker-game/main/pokeclicker-mini-tools/PokeClicker_Mini_Tools.user.js)** et laissez Tampermonkey l'installer. Dans Chrome, autorisez les scripts utilisateur pour Tampermonkey. Désactivez les versions en doublon, puis rechargez PokéClicker.

Les contrôles `@updateURL` / `@downloadURL` permettent à Tampermonkey de télécharger les futures versions selon sa fréquence de vérification. Les mises à jour ne sont pas instantanées.

## Modules

| Module | Fonction |
|---|---|
| 🥚 Œufs | Contenu des œufs par région, progression, suggestions et reproduction |
| 🔎 Pokémon | Recherche d'espèces et lieux d'obtention avec conditions connues |
| ⚡ Auto | Autoclicker (1 à 20 clics/s, limites natives respectées) |
| ✨ Shiny | Chances, durée indicative, suivi ciblé et stats par espèce |
| 📗 Pokédex | Manquants, filtre de routes accessibles, détail d'obtention |
| 🧭 Routes | Rotation parmi les routes déverrouillées de la région actuelle |
| 🔴 Balls | Choix de ball facultatif selon shiny, rareté, capture antérieure et stock |
| 📋 Quêtes | Progression, démarrage et validation, auto-validation facultative |
| 📊 Stats | Stats de session, cadence et rendement |
| ⚙ Options | Modules visibles, favoris, mini-menu, notifications et Alt + P |

Les modes auto-route et Pokéballs intelligentes sont désactivés après chaque actualisation. Les filtres Pokéballs natifs ne sont pas enregistrés ni modifiés par la fonction d'automatisation ; le choix natif est rétabli lors de sa désactivation. La Master Ball n'est choisie automatiquement que si l'utilisateur a activé expressément cette option. L'option de validation automatique des quêtes est mémorisée.

Les probabilités shiny ne prédisent pas le prochain shiny : elles indiquent seulement des chances statistiques. Le temps estimé pour une espèce dépend du rythme observé de ses rencontres sur la route.

## Vérification

Syntaxe vérifiée avec Node.js et dix écrans ouverts sans erreur lors de tests automatisés dans Chromium avec une simulation des objets du jeu. Pas de test de bout en bout dans une vraie partie de PokéClicker : si l'API du jeu change, une correction peut être nécessaire.

Version 1.2.0 archivée dans [`archive/`](./archive/).