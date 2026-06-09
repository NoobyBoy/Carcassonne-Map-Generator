# Carcassonne Map Generator

Site web statique pour la génération de cartes Carcassonne avec manipulation d'images.

## Structure du projet

- `index.html` - Page principale avec layout à deux zones
- `style.css` - Styles CSS pour le layout
- `script.ts` - Code TypeScript pour la manipulation d'images et paramètres
- `tsconfig.json` - Configuration TypeScript
- `package.json` - Dépendances Node.js
- `images/` - Dossier pour stocker les images

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Compiler le TypeScript :
```bash
npm run build
```

Pour compiler automatiquement lors des modifications :
```bash
npm run watch
```

## Layout

Le projet contient deux zones principales :
- **Zone principale** (gauche) : Zone de manipulation d'images avec une grille interactive pour placer des tuiles
- **Zone de paramètres** (droite) : Zone pour les paramètres (actuellement avec placeholders)

## Système de Grille

La zone principale contient une grille interactive où vous pouvez placer des tuiles Carcassonne.

### Fonctionnalités de l'ImageManipulator

- `createGrid(rows, cols)` - Crée une grille de dimensions spécifiées
- `placeTile(x, y, tileId)` - Place une tuile à des coordonnées (x, y)
- `removeTile(x, y)` - Supprime une tuile à des coordonnées spécifiques
- `clearGrid()` - Efface toute la grille
- `getGridState()` - Retourne l'état actuel de la grille

### Exemple d'utilisation

```javascript
const imageManipulator = new ImageManipulator(10, 10);

// Placer des tuiles
imageManipulator.placeTile(0, 0, 1);  // Place la tuile 1 à (0,0)
imageManipulator.placeTile(1, 0, 2);  // Place la tuile 2 à (1,0)

// Supprimer une tuile
imageManipulator.removeTile(0, 0);

// Effacer toute la grille
imageManipulator.clearGrid();
```

### Coordonnées

- Origine (0,0) en haut à gauche
- Les tuiles sont chargées depuis `images/Tiles/{tileId}.jpg`
- 24 tuiles disponibles (1.jpg à 24.jpg)

## Ouvrir le site

Ouvrez simplement le fichier `index.html` dans votre navigateur.
