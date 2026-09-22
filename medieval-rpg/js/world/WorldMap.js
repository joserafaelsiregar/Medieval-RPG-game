/**
 * Seamless Multi-Zone World Map (Village Hub -> Whispering Fog Forest -> Ancient Ruins Arena)
 * Handles tile rendering, collision physics grid, torches, ambient lighting, and decoration.
 */
class WorldMap {
    constructor() {
        this.tileSize = 48;
        this.widthInTiles = 80;
        this.heightInTiles = 60;
        this.width = this.widthInTiles * this.tileSize;   // 3840 px
        this.height = this.heightInTiles * this.tileSize; // 2880 px

        // Zones:
        // 1. Village Hub: x: 0 to 1200, y: 0 to 2880
        // 2. Whispering Forest: x: 1200 to 2600, y: 0 to 2880
        // 3. Ancient Ruins Dungeon: x: 2600 to 3840, y: 0 to 2880

        this.collisionMap = [];
        this.torches = [];
        this.decorations = [];

        // Offscreen pre-rendered map canvas for ultra high performance
        this.mapCanvas = document.createElement('canvas');
        this.mapCanvas.width = this.width;
        this.mapCanvas.height = this.height;
        this.mapCtx = this.mapCanvas.getContext('2d');

        this._generateWorld();
        this._prerenderMap();
    }

    _generateWorld() {
        // Initialize collision grid (0 = walkable, 1 = solid wall/rock/tree)
        for (let y = 0; y < this.heightInTiles; y++) {
            this.collisionMap[y] = [];
            for (let x = 0; x < this.widthInTiles; x++) {
                // Outer boundary walls
                if (x === 0 || y === 0 || x === this.widthInTiles - 1 || y === this.heightInTiles - 1) {
                    this.collisionMap[y][x] = 1;
                    continue;
                }

                // Village Hub Structures (Houses, Fences)
                if (x < 25) {
                    if ((x >= 8 && x <= 14 && y >= 8 && y <= 13) ||  // Blacksmith shop
                        (x >= 8 && x <= 14 && y >= 20 && y <= 25)) { // Tavern
                        // Doorway openings
                        if (y === 13 && x === 11) {
                            this.collisionMap[y][x] = 0;
                        } else if (y === 25 && x === 11) {
                            this.collisionMap[y][x] = 0;
                        } else {
                            this.collisionMap[y][x] = 1;
                        }
                    } else {
                        this.collisionMap[y][x] = 0;
                    }
                }
                // Whispering Forest (Clustered Trees & Rocks)
                else if (x >= 25 && x < 55) {
                    // Winding path through the forest
                    const pathCenterY = 28 + Math.floor(Math.sin(x * 0.3) * 6);
                    if (Math.abs(y - pathCenterY) <= 3) {
                        this.collisionMap[y][x] = 0; // Clear path
                    } else if (Math.random() < 0.22) {
                        this.collisionMap[y][x] = 1; // Dense pine trees
                    } else {
                        this.collisionMap[y][x] = 0;
                    }
                }
                // Ancient Dungeon Ruins (Stone Pillars, Fortress walls)
                else {
                    // Dungeon outer gate at x=55
                    if (x === 55 && (y < 24 || y > 32)) {
                        this.collisionMap[y][x] = 1;
                    } else if ((x === 65 || x === 73) && (y % 6 === 0)) {
                        this.collisionMap[y][x] = 1; // Colossal stone pillars
                    } else {
                        this.collisionMap[y][x] = 0;
                    }
                }
            }
        }

        // Add Torches & Light Sources
        this.torches = [
            { x: 380, y: 640 }, // Village campfire/lamp
            { x: 670, y: 640 },
            { x: 420, y: 1200 },
            { x: 1250, y: 1350 }, // Forest entrance
            { x: 2650, y: 1250 }, // Dungeon gate torch
            { x: 2650, y: 1550 },
            { x: 3120, y: 1100 }, // Boss arena pillars
            { x: 3500, y: 1100 },
            { x: 3120, y: 1700 },
            { x: 3500, y: 1700 }
        ];
    }

    _prerenderMap() {
        const ctx = this.mapCtx;
        for (let y = 0; y < this.heightInTiles; y++) {
            for (let x = 0; x < this.widthInTiles; x++) {
                const px = x * this.tileSize;
                const py = y * this.tileSize;
                const isWall = this.collisionMap[y][x] === 1;

                if (x < 25) {
                    // Village Grass & Cobblestone
                    if (isWall) {
                        ctx.fillStyle = '#4a2f15'; // Wooden house wall
                        ctx.fillRect(px, py, this.tileSize, this.tileSize);
                        ctx.strokeStyle = '#2f1e0d';
                        ctx.lineWidth = 1.5;
                        ctx.strokeRect(px, py, this.tileSize, this.tileSize);
                    } else {
                        // Cobblestone / Earth path
                        ctx.fillStyle = (x >= 9 && x <= 13) || (y >= 26 && y <= 30) ? '#57606f' : '#27ae60';
                        ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    }
                } else if (x >= 25 && x < 55) {
                    // Forest Zone (Deep green grass + Pine trees)
                    if (isWall) {
                        ctx.fillStyle = '#1e3722';
                        ctx.fillRect(px, py, this.tileSize, this.tileSize);
                        // Tree Canopy top
                        ctx.fillStyle = '#145A32';
                        ctx.beginPath();
                        ctx.arc(px + this.tileSize / 2, py + this.tileSize / 2, this.tileSize * 0.55, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = '#196f3d';
                        ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    }
                } else {
                    // Dungeon Zone (Dark Stone slabs + Red Lava/Ruin veins)
                    if (isWall) {
                        ctx.fillStyle = '#1e272e';
                        ctx.fillRect(px, py, this.tileSize, this.tileSize);
                        ctx.strokeStyle = '#d63031';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(px, py, this.tileSize, this.tileSize);
                    } else {
                        ctx.fillStyle = '#2f3542';
                        ctx.fillRect(px, py, this.tileSize, this.tileSize);
                        ctx.strokeStyle = '#474787';
                        ctx.lineWidth = 0.5;
                        ctx.strokeRect(px, py, this.tileSize, this.tileSize);
                    }
                }
            }
        }
    }

    checkCollision(x, y, radius = 10) {
        // Check grid cells around coordinate
        const minTileX = Math.floor((x - radius) / this.tileSize);
        const maxTileX = Math.floor((x + radius) / this.tileSize);
        const minTileY = Math.floor((y - radius) / this.tileSize);
        const maxTileY = Math.floor((y + radius) / this.tileSize);

        for (let ty = minTileY; ty <= maxTileY; ty++) {
            for (let tx = minTileX; tx <= maxTileX; tx++) {
                if (ty < 0 || ty >= this.heightInTiles || tx < 0 || tx >= this.widthInTiles) {
                    return true;
                }
                if (this.collisionMap[ty][tx] === 1) {
                    // Tile bounding box vs Circle collision
                    const tileLeft = tx * this.tileSize;
                    const tileRight = tileLeft + this.tileSize;
                    const tileTop = ty * this.tileSize;
                    const tileBottom = tileTop + this.tileSize;

                    const closestX = Math.max(tileLeft, Math.min(x, tileRight));
                    const closestY = Math.max(tileTop, Math.min(y, tileBottom));

                    const distX = x - closestX;
                    const distY = y - closestY;

                    if ((distX * distX + distY * distY) < (radius * radius)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getZoneAt(worldX) {
        if (worldX < 1200) return 'Oakhaven Village';
        if (worldX < 2600) return 'Whispering Fog Forest';
        return 'Ancient Ruins of Eldoria';
    }

    render(ctx, camera) {
        // Blit pre-rendered tilemap directly using hardware-accelerated drawImage
        ctx.drawImage(
            this.mapCanvas,
            camera.x - camera.shakeOffsetX,
            camera.y - camera.shakeOffsetY,
            camera.width,
            camera.height,
            0,
            0,
            camera.width,
            camera.height
        );

        // Draw Torches and Lights (Viewport culled)
        for (const t of this.torches) {
            if (t.x < camera.x - 90 || t.x > camera.x + camera.width + 90 ||
                t.y < camera.y - 90 || t.y > camera.y + camera.height + 90) {
                continue;
            }
            const screen = camera.worldToScreen(t.x, t.y);
            const flicker = Math.sin(Date.now() * 0.008 + t.x) * 3;

            // Light Halo
            const grad = ctx.createRadialGradient(screen.x, screen.y, 4, screen.x, screen.y, 75 + flicker);
            grad.addColorStop(0, 'rgba(255, 177, 66, 0.45)');
            grad.addColorStop(1, 'rgba(255, 177, 66, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 75 + flicker, 0, Math.PI * 2);
            ctx.fill();

            // Torch Sconce
            ctx.fillStyle = '#835427';
            ctx.fillRect(screen.x - 3, screen.y - 2, 6, 12);
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y - 3, 5 + flicker * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

window.WorldMap = WorldMap;
