"use strict";
// TypeScript pour la manipulation d'images et des paramètres
// Système de grille pour placer des tuiles Carcassonne
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Coordinate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    toString() {
        return `${this.x},${this.y}`;
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    clone() {
        return new Coordinate(this.x, this.y);
    }
}
class ImageManipulator {
    constructor(rows = 10, cols = 10) {
        this.zoomLevel = 1;
        this.baseCellSize = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.imageArea = document.querySelector('.image-area');
        this.tileGrid = document.getElementById('tile-grid');
        this.gridState = {};
        this.rows = rows;
        this.cols = cols;
        this.cellSize = 60; // Gardé pour compatibilité mais non utilisé
        this.initialize();
    }
    initialize() {
        console.log('Image Manipulator initialized');
        this.createGrid(this.rows, this.cols);
        this.setupZoomControls();
        this.setupMouseControls();
        // Recalculate grid size on window resize
        window.addEventListener('resize', () => {
            this.createGrid(this.rows, this.cols);
            // Restore grid state after resize
            this.restoreGridState();
        });
    }
    // Créer la grille avec le nombre spécifié de lignes et colonnes
    createGrid(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        // Calculer la taille de cellule pour remplir l'espace disponible
        const imageAreaRect = this.imageArea.getBoundingClientRect();
        const availableWidth = imageAreaRect.width - 40; // padding
        const availableHeight = imageAreaRect.height - 40; // padding
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;
        const cellSize = Math.min(cellWidth, cellHeight);
        // console.log('CreateGrid - imageAreaRect:', imageAreaRect, 'availableWidth:', availableWidth, 'availableHeight:', availableHeight, 'cellWidth:', cellWidth, 'cellHeight:', cellHeight, 'finalCellSize:', cellSize);
        // Store base cell size for zoom calculations
        this.baseCellSize = cellSize;
        // Configurer le CSS Grid avec des tailles de cellules fixes
        this.applyZoom();
        // Vider la grille existante
        this.tileGrid.innerHTML = '';
        // Créer les cellules
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.x = x.toString();
                cell.dataset.y = y.toString();
                cell.addEventListener('click', () => this.handleCellClick(x, y));
                this.tileGrid.appendChild(cell);
            }
        }
        console.log(`Grid created: ${rows}x${cols}, cell size: ${cellSize}px`);
    }
    // Restaurer l'état de la grille après redimensionnement
    restoreGridState() {
        const state = this.getGridState();
        for (const key in state) {
            if (state.hasOwnProperty(key)) {
                const tileData = state[key];
                const [x, y] = key.split(',').map(Number);
                this.placeTile(new Coordinate(x, y), tileData.tileId, tileData.rotation);
            }
        }
    }
    // Setup zoom controls
    setupZoomControls() {
        const zoomInButton = document.getElementById('zoom-in');
        const zoomOutButton = document.getElementById('zoom-out');
        const zoomResetButton = document.getElementById('zoom-reset');
        if (zoomInButton) {
            zoomInButton.addEventListener('click', () => this.zoomIn());
        }
        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', () => this.zoomOut());
        }
        if (zoomResetButton) {
            zoomResetButton.addEventListener('click', () => this.zoomReset());
        }
    }
    // Apply zoom level to grid
    applyZoom() {
        const cellSize = this.baseCellSize * this.zoomLevel;
        // console.log('ApplyZoom - zoomLevel:', this.zoomLevel, 'baseCellSize:', this.baseCellSize, 'newCellSize:', cellSize);
        this.tileGrid.style.gridTemplateColumns = `repeat(${this.cols}, ${cellSize}px)`;
        this.tileGrid.style.gridTemplateRows = `repeat(${this.rows}, ${cellSize}px)`;
        this.tileGrid.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
        this.tileGrid.style.transformOrigin = 'center center';
    }
    // Zoom in
    zoomIn() {
        if (this.zoomLevel < 3) {
            this.zoomLevel += 0.25;
            this.applyZoom();
        }
    }
    // Zoom out
    zoomOut() {
        if (this.zoomLevel > 0.25) {
            this.zoomLevel -= 0.25;
            this.applyZoom();
        }
    }
    // Reset zoom
    zoomReset() {
        this.zoomLevel = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.applyZoom();
    }
    // Setup mouse controls (wheel zoom and right-click drag)
    setupMouseControls() {
        // Mouse wheel zoom
        this.imageArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.25 : 0.25;
            const newZoomLevel = this.zoomLevel + delta;
            if (newZoomLevel >= 0.25 && newZoomLevel <= 3) {
                // console.log('Zoom - current:', this.zoomLevel, 'delta:', delta, 'new:', newZoomLevel);
                this.zoomLevel = newZoomLevel;
                this.applyZoom();
            }
        });
        // Right-click drag to pan
        this.imageArea.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right mouse button
                e.preventDefault();
                this.isDragging = true;
                this.startX = e.pageX;
                this.startY = e.pageY;
                this.translateX = 0;
                this.translateY = 0;
                this.imageArea.style.cursor = 'grabbing';
                // console.log('Drag started - startX:', this.startX, 'startY:', this.startY, 'translateX:', this.translateX, 'translateY:', this.translateY);
            }
        });
        this.imageArea.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.imageArea.style.cursor = 'grab';
        });
        this.imageArea.addEventListener('mouseup', () => {
            if (this.isDragging) {
                // console.log('Drag ended - final translateX:', this.translateX, 'final translateY:', this.translateY);
            }
            this.isDragging = false;
            this.imageArea.style.cursor = 'grab';
        });
        this.imageArea.addEventListener('mousemove', (e) => {
            if (!this.isDragging)
                return;
            e.preventDefault();
            const deltaX = e.pageX - this.startX;
            const deltaY = e.pageY - this.startY;
            this.translateX = deltaX;
            this.translateY = deltaY;
            // console.log('Dragging - currentX:', e.pageX, 'currentY:', e.pageY, 'deltaX:', deltaX, 'deltaY:', deltaY, 'translateX:', this.translateX, 'translateY:', this.translateY);
            this.applyZoom();
        });
        // Prevent context menu on right-click in image area
        this.imageArea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    // Placer une tuile à des coordonnées spécifiques
    placeTile(coordinate, tileId, rotation = 0) {
        if (coordinate.x < 0 || coordinate.x >= this.cols || coordinate.y < 0 || coordinate.y >= this.rows) {
            console.error(`Invalid coordinates: (${coordinate.x}, ${coordinate.y})`);
            return;
        }
        const cellKey = coordinate.toString();
        const cell = this.getCell(coordinate.x, coordinate.y);
        if (!cell) {
            console.error(`Cell not found at (${coordinate.x}, ${coordinate.y})`);
            return;
        }
        // Charger l'image de la tuile
        const img = this.loadTileImage(tileId);
        if (img) {
            // Supprimer l'image existante si présente
            const existingImg = cell.querySelector('.tile-image');
            if (existingImg) {
                cell.removeChild(existingImg);
            }
            // Apply rotation
            img.style.transform = `rotate(${rotation}deg)`;
            cell.appendChild(img);
            cell.classList.add('occupied');
            // Calculate matchString based on tile data
            const tile = tilesData.tiles.find(t => t[tileId.toString()] !== undefined);
            let matchString = '';
            if (tile) {
                const up = tile.up;
                const right = tile.right;
                const down = tile.down;
                const left = tile.left;
                // Adjust matchString based on rotation
                switch (rotation) {
                    case 0:
                        matchString = `${up}-${right}-${down}-${left}`;
                        break;
                    case 90:
                        matchString = `${left}-${up}-${right}-${down}`;
                        break;
                    case 180:
                        matchString = `${down}-${left}-${up}-${right}`;
                        break;
                    case 270:
                        matchString = `${right}-${down}-${left}-${up}`;
                        break;
                }
            }
            this.gridState[cellKey] = { tileId, rotation, matchString };
            console.log(`Tile ${tileId} placed at (${coordinate.x}, ${coordinate.y}) with rotation ${rotation}deg and ${matchString}`);
        }
        else {
            console.error(`Failed to load tile image: ${tileId}.jpg`);
        }
    }
    // Charger une image de tuile depuis le dossier images/Tiles
    loadTileImage(tileId) {
        const img = new Image();
        img.className = 'tile-image';
        img.src = `images/Tiles/${tileId}.jpg`;
        img.alt = `Tile ${tileId}`;
        // Gérer les erreurs de chargement
        img.onerror = () => {
            console.error(`Failed to load tile image: ${tileId}.jpg`);
            return null;
        };
        return img;
    }
    // Supprimer une tuile à des coordonnées spécifiques
    removeTile(coordinate) {
        const cellKey = coordinate.toString();
        const cell = this.getCell(coordinate.x, coordinate.y);
        if (cell && cell.classList.contains('occupied')) {
            const img = cell.querySelector('.tile-image');
            if (img) {
                cell.removeChild(img);
            }
            cell.classList.remove('occupied');
            delete this.gridState[cellKey];
            console.log(`Tile removed at (${coordinate.x}, ${coordinate.y})`);
        }
    }
    // Effacer toute la grille
    clearGrid() {
        const cells = this.tileGrid.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const img = cell.querySelector('.tile-image');
            if (img) {
                cell.removeChild(img);
            }
            cell.classList.remove('occupied');
        });
        this.gridState = {};
        console.log('Grid cleared');
    }
    // Obtenir l'état actuel de la grille
    getGridState() {
        return Object.assign({}, this.gridState);
    }
    // Gérer le clic sur une cellule (placeholder pour interaction future)
    handleCellClick(x, y) {
        const coordinate = new Coordinate(x, y);
        console.log(`Cell clicked at (${coordinate.x}, ${coordinate.y})`);
        // Implémentation future pour la sélection/placement interactif
    }
    // Obtenir une cellule spécifique
    getCell(x, y) {
        const index = y * this.cols + x;
        return this.tileGrid.children[index] || null;
    }
    getCellTile(x, y, direction) {
        const cell = this.getCell(x, y);
        if (cell && !cell.classList.contains('occupied')) {
            return "[^-]";
        }
        const cellKey = `${x},${y}`;
        const tileData = this.gridState[cellKey];
        if (tileData === undefined) {
            return "[^-]";
        }
        // Find the tile in tilesData
        console.log('Fetching tile information at coordinates (x, y)', x, y, ':', tileData);
        const splitMatch = tileData.matchString.split('-');
        if (direction === "up") {
            console.log(splitMatch, direction, splitMatch[0]);
            return splitMatch[0];
        }
        else if (direction === "right") {
            console.log(splitMatch, direction, splitMatch[1]);
            return splitMatch[1];
        }
        else if (direction === "down") {
            console.log(splitMatch, direction, splitMatch[2]);
            return splitMatch[2];
        }
        else if (direction === "left") {
            console.log(splitMatch, direction, splitMatch[3]);
            return splitMatch[3];
        }
        return "[^-]";
    }
    // Placeholder pour charger une image (méthode conservée pour compatibilité)
    loadImage(imagePath) {
        console.log(`Loading image: ${imagePath}`);
        // Implémentation future
    }
    // Placeholder pour appliquer des filtres (méthode conservée pour compatibilité)
    applyFilter(filterType) {
        console.log(`Applying filter: ${filterType}`);
        // Implémentation future
    }
    // Placeholder pour redimensionner l'image (méthode conservée pour compatibilité)
    resizeImage(width, height) {
        console.log(`Resizing image to: ${width}x${height}`);
        // Implémentation future
    }
}
class ParameterManager {
    constructor(imageManipulator = null) {
        this.tileInputs = new Map();
        this.imageManipulator = null;
        this.parametersContent = document.querySelector('.parameters-content');
        this.tilesList = document.getElementById('tiles-list');
        this.imageManipulator = imageManipulator;
        this.initialize();
    }
    initialize() {
        console.log('Parameter Manager initialized');
        this.setupTabs();
        this.setupExportButton();
        this.setupGridSizeInputs();
        this.setupGenerateButton();
        this.setupGenerationSpeedSlider();
        this.loadTilesMapping();
    }
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });
    }
    switchTab(tabId) {
        // Remove active class from all buttons and panes
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        // Add active class to clicked button and corresponding pane
        const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        const activePane = document.getElementById(`tab-${tabId}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        if (activePane) {
            activePane.classList.add('active');
        }
    }
    loadTilesMapping() {
        this.displayTiles(tilesData.tiles);
    }
    setupExportButton() {
        const exportButton = document.getElementById('export-tiles');
        if (exportButton) {
            exportButton.addEventListener('click', () => {
                this.exportTilesData();
            });
        }
    }
    setupGridSizeInputs() {
        const applyButton = document.getElementById('apply-grid-size');
        if (applyButton) {
            applyButton.addEventListener('click', () => {
                const gridSizeXInput = document.getElementById('grid-size-x');
                const gridSizeYInput = document.getElementById('grid-size-y');
                if (gridSizeXInput && gridSizeYInput && this.imageManipulator) {
                    const sizeX = parseInt(gridSizeXInput.value);
                    const sizeY = parseInt(gridSizeYInput.value);
                    if (!isNaN(sizeX) && !isNaN(sizeY) && sizeX > 0 && sizeY > 0) {
                        this.imageManipulator.createGrid(sizeY, sizeX);
                        // Place first tile based on selected position
                        const position = this.calculateFirstTileCoordinates();
                        this.imageManipulator.placeTile(position, 11);
                        console.log(`Grid resized to ${sizeY}x${sizeX}, first tile at (${position.x}, ${position.y})`);
                    }
                    else {
                        console.error('Invalid grid size values');
                    }
                }
            });
        }
    }
    setupGenerateButton() {
        const generateButton = document.getElementById('generate-map');
        if (generateButton && this.imageManipulator) {
            generateButton.addEventListener('click', () => {
                const generator = new Generator(this.imageManipulator, this);
                generator.generate();
            });
        }
    }
    setupGenerationSpeedSlider() {
        const speedSlider = document.getElementById('generation-speed');
        const speedValue = document.getElementById('speed-value');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', () => {
                speedValue.textContent = speedSlider.value;
            });
        }
    }
    calculateFirstTileCoordinates() {
        const mode = this.getFirstTileMode();
        const sizeX = this.getGridSizeX();
        const sizeY = this.getGridSizeY();
        switch (mode) {
            case 'top-left':
                return new Coordinate(0, 0);
            case 'top-right':
                return new Coordinate(sizeX - 1, 0);
            case 'bottom-left':
                return new Coordinate(0, sizeY - 1);
            case 'bottom-right':
                return new Coordinate(sizeX - 1, sizeY - 1);
            case 'middle':
            default:
                return new Coordinate(Math.floor(sizeX / 2), Math.floor(sizeY / 2));
        }
    }
    exportTilesData() {
        // Create a copy of tilesData with updated values from inputs
        const exportedData = {
            tiles: tilesData.tiles.map(tile => {
                const tileId = Object.keys(tile).find(key => ['up', 'right', 'down', 'left'].indexOf(key) === -1);
                if (!tileId)
                    return tile;
                const updatedTile = Object.assign({}, tile);
                // Update values from input fields
                const upInput = this.tileInputs.get(`${tileId}_up`);
                const rightInput = this.tileInputs.get(`${tileId}_right`);
                const downInput = this.tileInputs.get(`${tileId}_down`);
                const leftInput = this.tileInputs.get(`${tileId}_left`);
                if (upInput)
                    updatedTile.up = upInput.value;
                if (rightInput)
                    updatedTile.right = rightInput.value;
                if (downInput)
                    updatedTile.down = downInput.value;
                if (leftInput)
                    updatedTile.left = leftInput.value;
                return updatedTile;
            })
        };
        const dataStr = JSON.stringify(exportedData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tiles-mapping.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Tiles data exported');
    }
    displayTiles(tiles) {
        if (!this.tilesList)
            return;
        this.tileInputs.clear();
        tiles.forEach(tile => {
            const tileId = Object.keys(tile).find(key => ['up', 'right', 'down', 'left'].indexOf(key) === -1);
            if (!tileId)
                return;
            const imagePath = tile[tileId];
            const up = tile.up;
            const right = tile.right;
            const down = tile.down;
            const left = tile.left;
            const tileEntry = document.createElement('div');
            tileEntry.className = 'tile-entry';
            const header = document.createElement('div');
            header.className = 'tile-entry-header';
            const img = document.createElement('img');
            img.className = 'tile-entry-image';
            img.src = imagePath;
            img.alt = `Tile ${tileId}`;
            const idLabel = document.createElement('div');
            idLabel.className = 'tile-entry-id';
            idLabel.textContent = `Tuile ${tileId}`;
            header.appendChild(img);
            header.appendChild(idLabel);
            const fields = document.createElement('div');
            fields.className = 'tile-entry-fields';
            const fieldConfigs = [
                { label: 'Haut', value: up, key: 'up' },
                { label: 'Droite', value: right, key: 'right' },
                { label: 'Bas', value: down, key: 'down' },
                { label: 'Gauche', value: left, key: 'left' }
            ];
            fieldConfigs.forEach(config => {
                const field = document.createElement('div');
                field.className = 'tile-field';
                const fieldLabel = document.createElement('div');
                fieldLabel.className = 'tile-field-label';
                fieldLabel.textContent = config.label;
                const fieldValue = document.createElement('input');
                fieldValue.type = 'text';
                fieldValue.value = config.value;
                fieldValue.className = 'tile-field-input';
                // Store reference to input for export
                const inputKey = `${tileId}_${config.key}`;
                this.tileInputs.set(inputKey, fieldValue);
                field.appendChild(fieldLabel);
                field.appendChild(fieldValue);
                fields.appendChild(field);
            });
            tileEntry.appendChild(header);
            tileEntry.appendChild(fields);
            this.tilesList.appendChild(tileEntry);
        });
    }
    // Get grid size X
    getGridSizeX() {
        const gridSizeXInput = document.getElementById('grid-size-x');
        if (gridSizeXInput) {
            const value = parseInt(gridSizeXInput.value);
            return !isNaN(value) && value > 0 ? value : 10;
        }
        return 10;
    }
    // Get grid size Y
    getGridSizeY() {
        const gridSizeYInput = document.getElementById('grid-size-y');
        if (gridSizeYInput) {
            const value = parseInt(gridSizeYInput.value);
            return !isNaN(value) && value > 0 ? value : 10;
        }
        return 10;
    }
    getGridSize() {
        return new Coordinate(this.getGridSizeX(), this.getGridSizeY());
    }
    // Get first tile position
    getFirstTileMode() {
        const selectedRadio = document.querySelector('input[name="first-tile"]:checked');
        return selectedRadio ? selectedRadio.value : 'middle';
    }
    // Get generation speed
    getGenerationSpeed() {
        const speedSlider = document.getElementById('generation-speed');
        if (speedSlider) {
            const value = parseInt(speedSlider.value);
            return !isNaN(value) && value > 0 ? value : 500;
        }
        return 500;
    }
}
class OrientedTile {
    constructor(config) {
        this.id = 0;
        this.rotation = 0;
        this.matchString = '';
        this.id = config.id;
        this.rotation = config.rotation;
        this.matchString = config.matchString;
    }
}
class Generator {
    constructor(imageManipulator, parameters) {
        this.imageManipulator = imageManipulator;
        this.parameters = parameters;
        this.generationEnded = false;
        // Spiral algorithm state
        this.spiralStep = 1;
        this.spiralDirection = 0; // 0: up, 1: right, 2: down, 3: left
        this.spiralStepsInDirection = 0;
        this.spiralDirectionChanges = 0;
        this.firstSpiralTile = true;
        this.TilesList = [];
        this.gridSize = this.parameters.getGridSize();
        this.mode = this.parameters.getFirstTileMode();
        this.previousTileCoordinate = this.parameters.calculateFirstTileCoordinates();
        this.currentTileCoordinate = this.GetNextPosition();
        // Reset spiral state
        this.spiralStep = 1;
        this.spiralDirection = 0;
        this.spiralStepsInDirection = 0;
        this.spiralDirectionChanges = 0;
        this.firstSpiralTile = true;
        this.initializeTilesList(tilesData.tiles);
        console.log('Tiles list:');
        this.TilesList.forEach(tile => {
            console.log(`Tile ${tile.id} - Rotation: ${tile.rotation} - Match string: ${tile.matchString}`);
        });
    }
    initializeTilesList(tiles) {
        // Initialize the tiles list with empty OrientedTile objects
        tiles.forEach(tile => {
            const tileId = Object.keys(tile).find(key => ['up', 'right', 'down', 'left'].indexOf(key) === -1);
            if (!tileId)
                return;
            const up = tile.up;
            const right = tile.right;
            const down = tile.down;
            const left = tile.left;
            this.TilesList.push(new OrientedTile({
                id: parseInt(tileId),
                rotation: 0,
                matchString: `${up}-${right}-${down}-${left}`
            }));
            this.TilesList.push(new OrientedTile({
                id: parseInt(tileId),
                rotation: 90,
                matchString: `${left}-${up}-${right}-${down}`
            }));
            this.TilesList.push(new OrientedTile({
                id: parseInt(tileId),
                rotation: 180,
                matchString: `${down}-${left}-${up}-${right}`
            }));
            this.TilesList.push(new OrientedTile({
                id: parseInt(tileId),
                rotation: 270,
                matchString: `${right}-${down}-${left}-${up}`
            }));
        });
    }
    GetAdjacentCells(coord) {
        const up = this.imageManipulator.getCellTile(coord.x, coord.y - 1, "up");
        const right = this.imageManipulator.getCellTile(coord.x + 1, coord.y, "right");
        const down = this.imageManipulator.getCellTile(coord.x, coord.y + 1, "down");
        const left = this.imageManipulator.getCellTile(coord.x - 1, coord.y, "left");
        console.log(`${coord.x}, ${coord.y} : ^${up}+-${right}+-${down}+-${left}+$`);
        return `^${up}+-${right}+-${down}+-${left}+$`;
    }
    ChoseNextTile() {
        const match = this.GetAdjacentCells(this.currentTileCoordinate);
        const possibleTiles = [];
        this.TilesList.forEach(tile => {
            const re = new RegExp(match);
            if (re.test(tile.matchString)) {
                possibleTiles.push(tile);
            }
        });
        const randomIndex = Math.floor(Math.random() * possibleTiles.length);
        return possibleTiles[randomIndex];
    }
    GetNextPosition() {
        switch (this.mode) {
            case 'top-left':
                if (this.previousTileCoordinate.x < this.gridSize.x - 1) {
                    return new Coordinate(this.previousTileCoordinate.x + 1, this.previousTileCoordinate.y);
                }
                else {
                    if (this.previousTileCoordinate.y < this.gridSize.y - 1) {
                        return new Coordinate(0, this.previousTileCoordinate.y + 1);
                    }
                    else {
                        this.generationEnded = true;
                        return new Coordinate(-1, -1);
                    }
                }
            case 'top-right':
                if (this.previousTileCoordinate.x > 0) {
                    return new Coordinate(this.previousTileCoordinate.x - 1, this.previousTileCoordinate.y);
                }
                else {
                    if (this.previousTileCoordinate.y < this.gridSize.y - 1) {
                        return new Coordinate(this.gridSize.x - 1, this.previousTileCoordinate.y + 1);
                    }
                    else {
                        this.generationEnded = true;
                        return new Coordinate(-1, -1);
                    }
                }
            case 'bottom-left':
                if (this.previousTileCoordinate.x < this.gridSize.x - 1) {
                    return new Coordinate(this.previousTileCoordinate.x + 1, this.previousTileCoordinate.y);
                }
                else {
                    if (this.previousTileCoordinate.y > 0) {
                        return new Coordinate(0, this.previousTileCoordinate.y - 1);
                    }
                    else {
                        this.generationEnded = true;
                        return new Coordinate(-1, -1);
                    }
                }
            case 'bottom-right':
                if (this.previousTileCoordinate.x > 0) {
                    return new Coordinate(this.previousTileCoordinate.x - 1, this.previousTileCoordinate.y);
                }
                else {
                    if (this.previousTileCoordinate.y > 0) {
                        return new Coordinate(this.gridSize.x - 1, this.previousTileCoordinate.y - 1);
                    }
                    else {
                        this.generationEnded = true;
                        return new Coordinate(-1, -1);
                    }
                }
            default:
                return this.GetNextPositionSpiral();
        }
    }
    GetNextPositionSpiral() {
        let nextX = this.previousTileCoordinate.x;
        let nextY = this.previousTileCoordinate.y;
        if (this.firstSpiralTile) {
            this.firstSpiralTile = false;
            return new Coordinate(this.previousTileCoordinate.x, this.previousTileCoordinate.y);
        }
        // Calculate next position based on current direction
        switch (this.spiralDirection) {
            case 0: // up
                nextY--;
                break;
            case 1: // right
                nextX++;
                break;
            case 2: // down
                nextY++;
                break;
            case 3: // left
                nextX--;
                break;
        }
        // Check if next position is within bounds
        if (nextX < 0 || nextX >= this.gridSize.x || nextY < 0 || nextY >= this.gridSize.y) {
            this.generationEnded = true;
            console.log(`Generation ended : {x: ${nextX}, y: ${nextY}}`);
            return new Coordinate(-1, -1);
        }
        // Update spiral state
        this.spiralStepsInDirection++;
        // Check if we need to change direction
        if (this.spiralStepsInDirection >= this.spiralStep) {
            this.spiralStepsInDirection = 0;
            this.spiralDirection = (this.spiralDirection + 1) % 4;
            this.spiralDirectionChanges++;
            // Increase step size after every 2 direction changes
            if (this.spiralDirectionChanges % 2 === 0) {
                this.spiralStep++;
            }
        }
        return new Coordinate(nextX, nextY);
    }
    generate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.imageManipulator) {
                this.generationEnded = false;
                let iteration = 0;
                const maxIterations = this.gridSize.x * this.gridSize.y; // Safety limit
                const generationSpeed = this.parameters.getGenerationSpeed();
                while (!this.generationEnded) {
                    // Check if current coordinate is valid
                    if (this.currentTileCoordinate.x === -1 || this.currentTileCoordinate.y === -1) {
                        console.log('Invalid coordinate, stopping generation');
                        break;
                    }
                    const nextTile = this.ChoseNextTile();
                    this.imageManipulator.placeTile(this.currentTileCoordinate, nextTile.id, nextTile.rotation);
                    this.previousTileCoordinate = this.currentTileCoordinate;
                    this.currentTileCoordinate = this.GetNextPosition();
                    iteration++;
                    console.log(`Iteration: ${iteration}, Position: (${this.previousTileCoordinate.x}, ${this.previousTileCoordinate.y})`);
                    console.log(generationSpeed);
                    yield new Promise(resolve => setTimeout(resolve, generationSpeed));
                }
                console.log(`Generation ended after ${iteration} iterations`);
            }
        });
    }
}
const tilesData = {
    "tiles": [
        {
            "1": "images/Tiles/1.jpg",
            "up": "Grass",
            "right": "Grass",
            "down": "Road",
            "left": "Road"
        },
        {
            "2": "images/Tiles/2.jpg",
            "up": "Castle",
            "right": "Road",
            "down": "Road",
            "left": "Grass"
        },
        {
            "3": "images/Tiles/3.jpg",
            "up": "Castle",
            "right": "Road",
            "down": "Road",
            "left": "Castle"
        },
        {
            "4": "images/Tiles/4.jpg",
            "up": "Castle",
            "right": "Castle",
            "down": "Road",
            "left": "Castle"
        },
        {
            "5": "images/Tiles/5.jpg",
            "up": "Castle",
            "right": "Castle",
            "down": "Grass",
            "left": "Castle"
        },
        {
            "6": "images/Tiles/6.jpg",
            "up": "Castle",
            "right": "Road",
            "down": "Road",
            "left": "Castle"
        },
        {
            "7": "images/Tiles/7.jpg",
            "up": "Castle",
            "right": "Road",
            "down": "Road",
            "left": "Road"
        },
        {
            "8": "images/Tiles/8.jpg",
            "up": "Road",
            "right": "Grass",
            "down": "Road",
            "left": "Grass"
        },
        {
            "9": "images/Tiles/9.jpg",
            "up": "Grass",
            "right": "Road",
            "down": "Road",
            "left": "Road"
        },
        {
            "10": "images/Tiles/10.jpg",
            "up": "Castle",
            "right": "Grass",
            "down": "Road",
            "left": "Road"
        },
        {
            "11": "images/Tiles/11.jpg",
            "up": "Castle",
            "right": "Road",
            "down": "Grass",
            "left": "Road"
        },
        {
            "12": "images/Tiles/12.jpg",
            "up": "Grass",
            "right": "Castle",
            "down": "Grass",
            "left": "Castle"
        },
        {
            "13": "images/Tiles/13.jpg",
            "up": "Castle",
            "right": "Grass",
            "down": "Grass",
            "left": "Castle"
        },
        {
            "14": "images/Tiles/14.jpg",
            "up": "Grass",
            "right": "Grass",
            "down": "Road",
            "left": "Grass"
        },
        {
            "15": "images/Tiles/15.jpg",
            "up": "Grass",
            "right": "Grass",
            "down": "Grass",
            "left": "Grass"
        },
        {
            "16": "images/Tiles/16.jpg",
            "up": "Castle",
            "right": "Castle",
            "down": "Grass",
            "left": "Castle"
        },
        {
            "17": "images/Tiles/17.jpg",
            "up": "Castle",
            "right": "Castle",
            "down": "Grass",
            "left": "Grass"
        },
        {
            "18": "images/Tiles/18.jpg",
            "up": "Castle",
            "right": "Grass",
            "down": "Grass",
            "left": "Grass"
        },
        {
            "19": "images/Tiles/19.jpg",
            "up": "Grass",
            "right": "Castle",
            "down": "Grass",
            "left": "Castle"
        },
        {
            "20": "images/Tiles/20.jpg",
            "up": "Castle",
            "right": "Castle",
            "down": "Road",
            "left": "Castle"
        },
        {
            "21": "images/Tiles/21.jpg",
            "up": "Castle",
            "right": "Castle",
            "down": "Castle",
            "left": "Castle"
        },
        {
            "22": "images/Tiles/22.jpg",
            "up": "Castle",
            "right": "Grass",
            "down": "Grass",
            "left": "Castle"
        },
        {
            "23": "images/Tiles/23.jpg",
            "up": "Grass",
            "right": "Castle",
            "down": "Grass",
            "left": "Castle"
        },
        {
            "24": "images/Tiles/24.jpg",
            "up": "Road",
            "right": "Road",
            "down": "Road",
            "left": "Road"
        }
    ]
};
// Initialisation lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Créer l'ImageManipulator avec une grille 10x10
    const imageManipulator = new ImageManipulator(10, 10);
    // Placer la première tuile au milieu par défaut
    imageManipulator.placeTile(new Coordinate(5, 5), 11);
    const parameterManager = new ParameterManager(imageManipulator);
});
//# sourceMappingURL=script.js.map