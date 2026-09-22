/**
 * Main Game Loop, State Management, Spawner & UI Controller
 */
class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.lastTime = 0;
        this.isPaused = false;
        this.currentDialogue = null;

        // Core Components
        this.camera = new Camera(window.innerWidth, window.innerHeight);
        window.camera = this.camera;

        this.input = new InputHandler();
        this.particleSystem = new ParticleSystem();
        this.renderer = new Renderer(this.ctx);
        this.combatManager = window.combatManager;
        this.inventory = new Inventory();
        this.vendor = window.vendorSystem;
        this.world = new WorldMap();

        // Spawn Entities
        this.player = new Player(450, 1350); // Start in village hub
        this.camera.resize(window.innerWidth, window.innerHeight);
        this.camera.snapTo(this.player.x, this.player.y);
        this.camera.follow(this.player);

        this.enemies = [];
        this.boss = null;
        this.props = [];

        this._initWorldEntities();
        this._setupDOM();
        this._setupWindowResize();

        // Start Game Loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    _initWorldEntities() {
        // 1. Village Hub (x: 0 - 1200)
        this.props.push(new Prop(520, 1350, 'campfire'));
        this.props.push(new Prop(490, 600, 'npc', {
            name: 'Gareth the Blacksmith',
            role: 'blacksmith',
            dialogue: "Welcome traveler. The ancient ruins east of the Whispering Forest have awakened with vile creatures. Bring me gold and I shall hone your steel or supply mighty armor!"
        }));
        this.props.push(new Prop(490, 1050, 'npc', {
            name: 'Elder Oakhaven',
            role: 'villager',
            dialogue: "Beware the Ruin Warlord Malakor! Time your shield blocks to Parry his attacks. Use your Dodge Roll with [Space] to slip past crushing strikes!"
        }));
        this.props.push(new Prop(650, 1350, 'chest', { item: ITEM_DATABASE.ring_might }));
        this.props.push(new Prop(350, 1280, 'herb'));
        this.props.push(new Prop(350, 1420, 'herb'));

        // Training Crates
        this.props.push(new Prop(620, 1280, 'crate'));
        this.props.push(new Prop(620, 1420, 'crate'));

        // 2. Whispering Fog Forest (x: 1300 - 2500)
        for (let i = 0; i < 8; i++) {
            const gx = 1400 + Math.random() * 1000;
            const gy = 1000 + Math.random() * 800;
            this.enemies.push(new Enemy(gx, gy, 'grunt'));
        }
        for (let i = 0; i < 5; i++) {
            const ax = 1500 + Math.random() * 900;
            const ay = 900 + Math.random() * 1000;
            this.enemies.push(new Enemy(ax, ay, 'archer'));
        }
        this.props.push(new Prop(1800, 1100, 'chest', { item: ITEM_DATABASE.iron_bulwark }));
        this.props.push(new Prop(2200, 1400, 'chest', { item: ITEM_DATABASE.chainmail }));
        this.props.push(new Prop(1650, 1300, 'herb'));
        this.props.push(new Prop(2050, 1200, 'herb'));

        // 3. Dungeon Arena (x: 2700 - 3700)
        for (let i = 0; i < 4; i++) {
            this.enemies.push(new Enemy(2800 + i * 100, 1350, 'grunt'));
        }
        this.props.push(new Prop(3000, 1150, 'chest', { item: ITEM_DATABASE.flame_blade }));

        // Mini-Boss in Sanctum
        this.boss = new Boss(3350, 1350);
    }

    _setupDOM() {
        // Cache frequently accessed HUD elements
        this.dom = {
            hpFill: document.getElementById('hp-fill'),
            hpText: document.getElementById('hp-text'),
            spFill: document.getElementById('sp-fill'),
            spText: document.getElementById('sp-text'),
            potionHp: document.getElementById('potion-count-hp'),
            potionSp: document.getElementById('potion-count-sp'),
            goldVal: document.getElementById('gold-val'),
            levelVal: document.getElementById('level-val'),
            zoneName: document.getElementById('zone-name'),
            spellCd: document.getElementById('spell-cd-overlay'),
            bossHud: document.getElementById('boss-hud'),
            bossHpFill: document.getElementById('boss-hp-fill'),
            bossTitle: document.getElementById('boss-title'),
            deathScreen: document.getElementById('death-screen')
        };

        // Modal toggles & buttons
        document.getElementById('inventory-btn').onclick = () => this.toggleInventoryModal();
        document.getElementById('close-inv-btn').onclick = () => this.toggleInventoryModal();
        document.getElementById('close-dialog-btn').onclick = () => this.closeDialogue();
        document.getElementById('respawn-btn').onclick = () => this.respawnPlayer();
        document.getElementById('audio-toggle-btn').onclick = () => {
            window.soundEngine.muted = !window.soundEngine.muted;
            document.getElementById('audio-toggle-btn').innerText = window.soundEngine.muted ? '🔇 Sound: Off' : '🔊 Sound: On';
        };
    }

    _setupWindowResize() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.camera.resize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', resize);
        resize();
    }

    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        if (!this.isPaused) {
            this.update(dt);
        }
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        // Handle input & toggles
        if (this.input.consumeAction('toggleInventory')) {
            this.toggleInventoryModal();
        }

        // Check Interactions with Props / NPCs ([F])
        if (this.input.consumeAction('interact')) {
            for (const prop of this.props) {
                if (this.player.distanceTo(prop) <= prop.radius + 35) {
                    prop.interact(this.player, this, this.particleSystem);
                    break;
                }
            }
        }

        // Update Camera & Input Aiming
        this.input.update(this.camera);
        this.player.handleInput(this.input, dt, this.particleSystem);
        this.player.updatePhysics(dt, this.world);
        this.camera.update(dt);

        // Update Combat & Projectiles
        this.combatManager.update(dt, this.player, this.enemies, this.boss, this.props, this.particleSystem, this.world);

        // Update Enemies AI
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy.isAlive && enemy.flinchTimer <= 0) {
                this.enemies.splice(i, 1);
                continue;
            }
            enemy.updateAI(dt, this.player, this.combatManager, this.particleSystem);
            enemy.updatePhysics(dt, this.world);
        }

        // Update Boss AI
        if (this.boss && this.boss.isAlive) {
            this.boss.updateAI(dt, this.player, this.combatManager, this.particleSystem, this.enemies);
            this.boss.updatePhysics(dt, this.world);
        }

        // Update Particles
        this.particleSystem.update(dt);

        // Update HUD
        this._updateHUD();
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Render World Tiles & Torches
        this.world.render(ctx, this.camera);

        // 2. Render Props (Chests, Crates, NPCs, Campfire) - Viewport Culled
        for (const prop of this.props) {
            if (prop.x < this.camera.x - 60 || prop.x > this.camera.x + this.camera.width + 60 ||
                prop.y < this.camera.y - 60 || prop.y > this.camera.y + this.camera.height + 60) {
                continue;
            }
            const screen = this.camera.worldToScreen(prop.x, prop.y);
            this.renderer.drawShadow(screen.x, screen.y, prop.radius, prop.radius * 0.5);
            prop.render(ctx, this.camera);

            // Interaction Prompt Above Prop
            if (prop.promptText && this.player.distanceTo(prop) <= prop.radius + 40) {
                const promptScreen = this.camera.worldToScreen(prop.x, prop.y - 30);
                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 13px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.fillText(prop.promptText, promptScreen.x, promptScreen.y);
            }
        }

        // 3. Render Enemies - Viewport Culled
        for (const enemy of this.enemies) {
            if (enemy.x < this.camera.x - 60 || enemy.x > this.camera.x + this.camera.width + 60 ||
                enemy.y < this.camera.y - 60 || enemy.y > this.camera.y + this.camera.height + 60) {
                continue;
            }
            const screen = this.camera.worldToScreen(enemy.x, enemy.y);
            this.renderer.drawShadow(screen.x, screen.y, enemy.radius, enemy.radius * 0.5);
            this.renderer.drawEnemy(screen.x, screen.y, enemy);

            // Enemy HP bar
            if (enemy.hp < enemy.maxHp) {
                const barW = 28;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(screen.x - barW / 2, screen.y - enemy.radius - 10, barW, 4);
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(screen.x - barW / 2, screen.y - enemy.radius - 10, barW * (enemy.hp / enemy.maxHp), 4);
            }
        }

        // 4. Render Boss
        if (this.boss && this.boss.isAlive) {
            const screen = this.camera.worldToScreen(this.boss.x, this.boss.y);
            this.renderer.drawShadow(screen.x, screen.y, this.boss.radius * 1.3, this.boss.radius * 0.6);
            this.renderer.drawBoss(screen.x, screen.y, this.boss);
        }

        // 5. Render Player
        if (this.player.isAlive) {
            const screen = this.camera.worldToScreen(this.player.x, this.player.y);
            const jumpZ = this.player.jumpZ || 0;
            const shadowScale = Math.max(0.4, 1 - jumpZ / 70);
            const shadowAlpha = Math.max(0.12, 0.35 * (1 - jumpZ / 80));
            this.renderer.drawShadow(screen.x, screen.y, 16 * shadowScale, 8 * shadowScale, shadowAlpha);
            this.renderer.drawPlayer(screen.x, screen.y - jumpZ, this.player);
        }

        // 6. Render Projectiles
        for (const proj of this.combatManager.projectiles) {
            if (proj.x < this.camera.x - 30 || proj.x > this.camera.x + this.camera.width + 30 ||
                proj.y < this.camera.y - 30 || proj.y > this.camera.y + this.camera.height + 30) {
                continue;
            }
            const screen = this.camera.worldToScreen(proj.x, proj.y);
            this.renderer.drawProjectile(screen.x, screen.y, proj);
        }

        // 7. Render Particle System & Floating Numbers
        this.particleSystem.render(ctx, this.camera);

        // 8. Atmospheric Lighting / Mist Overlay
        this._renderAtmosphere(ctx);
    }

    _renderAtmosphere(ctx) {
        const zone = this.world.getZoneAt(this.player.x);
        if (zone === 'Whispering Fog Forest') {
            ctx.fillStyle = 'rgba(200, 220, 240, 0.08)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (zone === 'Ancient Ruins of Eldoria') {
            ctx.fillStyle = 'rgba(192, 57, 43, 0.07)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    _updateHUD() {
        if (!this.dom) return;

        const hp = Math.ceil(this.player.hp);
        const maxHp = this.player.effectiveMaxHp;
        const sp = Math.ceil(this.player.stamina);
        const maxSp = this.player.maxStamina;

        if (this._lastHp !== hp || this._lastMaxHp !== maxHp) {
            this._lastHp = hp;
            this._lastMaxHp = maxHp;
            const hpPercent = Math.max(0, (hp / maxHp) * 100);
            this.dom.hpFill.style.width = `${hpPercent}%`;
            this.dom.hpText.textContent = `${hp} / ${maxHp}`;
        }

        if (this._lastSp !== sp || this._lastMaxSp !== maxSp) {
            this._lastSp = sp;
            this._lastMaxSp = maxSp;
            const spPercent = Math.max(0, (sp / maxSp) * 100);
            this.dom.spFill.style.width = `${spPercent}%`;
            this.dom.spText.textContent = `${sp} / ${maxSp}`;
        }

        if (this._lastPotionsHp !== this.player.potions.health) {
            this._lastPotionsHp = this.player.potions.health;
            this.dom.potionHp.textContent = this.player.potions.health;
        }

        if (this._lastPotionsSp !== this.player.potions.stamina) {
            this._lastPotionsSp = this.player.potions.stamina;
            this.dom.potionSp.textContent = this.player.potions.stamina;
        }

        if (this._lastGold !== this.player.gold) {
            this._lastGold = this.player.gold;
            this.dom.goldVal.textContent = this.player.gold;
        }

        if (this._lastLevel !== this.player.level) {
            this._lastLevel = this.player.level;
            this.dom.levelVal.textContent = `Lv. ${this.player.level}`;
        }

        const zone = this.world.getZoneAt(this.player.x);
        if (this._lastZone !== zone) {
            this._lastZone = zone;
            this.dom.zoneName.textContent = zone;
        }

        // Spell Cooldown Overlay
        const spellCdPercent = Math.max(0, (this.player.spellCooldown / this.player.maxSpellCooldown) * 100);
        this.dom.spellCd.style.height = `${spellCdPercent}%`;

        // Boss Bar (if nearby)
        if (this.boss && this.boss.isAlive && this.player.distanceTo(this.boss) < 700) {
            if (this.dom.bossHud.style.display !== 'block') this.dom.bossHud.style.display = 'block';
            this.dom.bossHpFill.style.width = `${(this.boss.hp / this.boss.maxHp) * 100}%`;
            this.dom.bossTitle.textContent = `${this.boss.name} ${this.boss.phase === 2 ? '(ENRAGED)' : ''}`;
        } else if (this.dom.bossHud.style.display !== 'none') {
            this.dom.bossHud.style.display = 'none';
        }

        // Death Screen Trigger
        if (!this.player.isAlive) {
            if (this.dom.deathScreen.style.display !== 'flex') this.dom.deathScreen.style.display = 'flex';
        } else if (this.dom.deathScreen.style.display !== 'none') {
            this.dom.deathScreen.style.display = 'none';
        }
    }

    toggleInventoryModal() {
        const modal = document.getElementById('inventory-modal');
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
            this.isPaused = false;
        } else {
            modal.style.display = 'flex';
            this.isPaused = true;
            this.renderInventoryUI();
        }
    }

    renderInventoryUI() {
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = '';

        for (let i = 0; i < this.inventory.maxSlots; i++) {
            const item = this.inventory.slots[i];
            const slot = document.createElement('div');
            slot.className = 'inv-slot';

            if (item) {
                slot.classList.add(item.rarity || 'common');
                slot.innerHTML = `
                    <div class="slot-name">${item.name}</div>
                    <div class="slot-stat">${item.atk ? `+${item.atk} ATK` : (item.def ? `+${item.def} DEF` : (item.hp ? `+${item.hp} HP` : 'Use'))}</div>
                `;
                slot.onclick = () => {
                    this.inventory.equipItem(i, this.player);
                    this.renderInventoryUI();
                };
            }
            grid.appendChild(slot);
        }

        // Equipment panel stats
        document.getElementById('stat-atk').innerText = this.player.totalAtk;
        document.getElementById('stat-def').innerText = this.player.totalDef;
        document.getElementById('stat-hp').innerText = this.player.effectiveMaxHp;

        document.getElementById('slot-weapon').innerText = this.player.equipment.weapon ? this.player.equipment.weapon.name : 'Empty';
        document.getElementById('slot-shield').innerText = this.player.equipment.shield ? this.player.equipment.shield.name : 'Empty';
        document.getElementById('slot-armor').innerText = this.player.equipment.armor ? this.player.equipment.armor.name : 'Empty';
        document.getElementById('slot-ring').innerText = this.player.equipment.ring ? this.player.equipment.ring.name : 'Empty';
    }

    openDialogue(speaker, text, role) {
        this.isPaused = true;
        const dialogBox = document.getElementById('dialogue-modal');
        dialogBox.style.display = 'flex';
        document.getElementById('speaker-name').innerText = speaker;
        document.getElementById('dialogue-text').innerText = text;

        const shopBtn = document.getElementById('dialogue-shop-btn');
        const upgradeBtn = document.getElementById('dialogue-upgrade-btn');

        if (role === 'blacksmith') {
            shopBtn.style.display = 'inline-block';
            upgradeBtn.style.display = 'inline-block';
            shopBtn.onclick = () => {
                this.closeDialogue();
                this.openVendorShop();
            };
            upgradeBtn.onclick = () => {
                this.vendor.upgradeWeapon(this.player, this.particleSystem);
            };
        } else {
            shopBtn.style.display = 'none';
            upgradeBtn.style.display = 'none';
        }
    }

    closeDialogue() {
        document.getElementById('dialogue-modal').style.display = 'none';
        this.isPaused = false;
    }

    openVendorShop() {
        const modal = document.getElementById('vendor-modal');
        modal.style.display = 'flex';
        this.isPaused = true;

        const shopList = document.getElementById('vendor-items-list');
        shopList.innerHTML = '';

        this.vendor.shopItems.forEach((item) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'vendor-item-row';
            itemDiv.innerHTML = `
                <div class="item-info">
                    <span class="name ${item.rarity || 'common'}">${item.name}</span>
                    <span class="desc">${item.desc}</span>
                </div>
                <button class="buy-btn">${item.cost} Gold (Buy)</button>
            `;
            itemDiv.querySelector('.buy-btn').onclick = () => {
                this.vendor.buyItem(item, this.player, this.inventory, this.particleSystem);
                this._updateHUD();
            };
            shopList.appendChild(itemDiv);
        });

        document.getElementById('close-vendor-btn').onclick = () => {
            modal.style.display = 'none';
            this.isPaused = false;
        };
    }

    respawnPlayer() {
        this.player.x = 520;
        this.player.y = 1350;
        this.player.hp = this.player.effectiveMaxHp;
        this.player.stamina = this.player.maxStamina;
        this.player.isAlive = true;
        this.player.gold = Math.max(0, Math.floor(this.player.gold * 0.8)); // 20% death penalty
        this.camera.snapTo(this.player.x, this.player.y);
        document.getElementById('death-screen').style.display = 'none';
        this.particleSystem.addFloatingText(this.player.x, this.player.y - 20, 'Respawned at Campfire', 'heal');
    }

    saveGame() {
        const saveState = {
            player: {
                level: this.player.level,
                xp: this.player.xp,
                gold: this.player.gold,
                equipment: this.player.equipment,
                potions: this.player.potions
            }
        };
        localStorage.setItem('eldoria_rpg_save', JSON.stringify(saveState));
    }
}

window.onload = () => {
    window.gameManager = new GameManager();
};
