/**
 * Interactive Props: Destructible Crates, Loot Chests, Harvestable Herbs, NPCs, Campfires
 */
class Prop extends Entity {
    constructor(x, y, type = 'crate', extra = {}) {
        super(x, y, 16);
        this.type = type; // 'crate', 'chest', 'herb', 'npc', 'campfire'
        this.extra = extra;
        this.isOpen = false;
        this.isHarvested = false;
        this.hp = type === 'crate' ? 20 : 1000;
        this.promptText = '';

        if (type === 'chest') {
            this.promptText = '[F] Open Chest';
            this.radius = 18;
        } else if (type === 'herb') {
            this.promptText = '[F] Harvest Herb';
            this.radius = 14;
        } else if (type === 'npc') {
            this.promptText = extra.name ? `[F] Talk to ${extra.name}` : '[F] Talk';
            this.radius = 16;
        } else if (type === 'campfire') {
            this.promptText = '[F] Rest at Campfire';
            this.radius = 20;
        }
    }

    interact(player, gameManager, particleSystem) {
        if (this.type === 'chest' && !this.isOpen) {
            this.isOpen = true;
            this.promptText = '';
            window.soundEngine.play('chest');

            // Drop guaranteed good loot + gold
            const gold = 30 + Math.floor(Math.random() * 40);
            player.gold += gold;
            particleSystem.addFloatingText(this.x, this.y - 15, `${gold} Gold`, 'gold');

            if (this.extra.item) {
                gameManager.inventory.addItem(this.extra.item);
                particleSystem.addFloatingText(this.x, this.y - 30, `Got ${this.extra.item.name}!`, 'crit');
            }
        } else if (this.type === 'herb' && !this.isHarvested) {
            this.isHarvested = true;
            this.promptText = '';
            window.soundEngine.play('herb');
            player.potions.health = Math.min(6, player.potions.health + 1);
            particleSystem.addFloatingText(this.x, this.y - 15, `+1 Health Potion`, 'heal');
        } else if (this.type === 'npc') {
            gameManager.openDialogue(this.extra.name, this.extra.dialogue, this.extra.role);
        } else if (this.type === 'campfire') {
            player.heal(player.effectiveMaxHp, particleSystem);
            player.restoreStamina(player.maxStamina, particleSystem);
            window.soundEngine.play('potion');
            particleSystem.addFloatingText(this.x, this.y - 20, 'Rested & Saved!', 'heal');
            gameManager.saveGame();
        }
    }

    render(ctx, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        ctx.save();
        ctx.translate(screen.x, screen.y);

        if (this.type === 'crate') {
            ctx.fillStyle = '#835427';
            ctx.fillRect(-14, -14, 28, 28);
            ctx.strokeStyle = '#4a2f15';
            ctx.lineWidth = 2;
            ctx.strokeRect(-14, -14, 28, 28);
            // Cross straps
            ctx.beginPath();
            ctx.moveTo(-14, -14); ctx.lineTo(14, 14);
            ctx.moveTo(14, -14); ctx.lineTo(-14, 14);
            ctx.stroke();
        } else if (this.type === 'chest') {
            ctx.fillStyle = this.isOpen ? '#576574' : '#c0392b';
            ctx.fillRect(-16, -12, 32, 24);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(-16, -12, 32, 24);
            // Gold Lock / Trims
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-4, -4, 8, 8);
        } else if (this.type === 'herb') {
            if (!this.isHarvested) {
                ctx.fillStyle = '#2ecc71';
                ctx.beginPath();
                ctx.arc(-4, 0, 7, 0, Math.PI * 2);
                ctx.arc(4, 0, 7, 0, Math.PI * 2);
                ctx.arc(0, -5, 8, 0, Math.PI * 2);
                ctx.fill();
                // Red Flower Center
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(0, -2, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#7f8c8d';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'npc') {
            // Friendly Villager / Blacksmith
            ctx.fillStyle = this.extra.role === 'blacksmith' ? '#e67e22' : '#3498db';
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Head / Hat
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, -4, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'campfire') {
            // Stones circle
            ctx.fillStyle = '#7f8c8d';
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * 14, Math.sin(angle) * 14, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            // Fire Glow
            ctx.fillStyle = 'rgba(231, 76, 60, 0.35)';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

window.Prop = Prop;
