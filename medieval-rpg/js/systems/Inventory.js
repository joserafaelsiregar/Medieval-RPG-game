/**
 * Inventory System & Item Database
 * Manages grid bags, equipment, stats, and loot generation.
 */
const ITEM_DATABASE = {
    // Weapons
    iron_sword: { id: 'iron_sword', name: 'Iron Broadsword', type: 'weapon', atk: 12, rarity: 'common', color: '#bdc3c7', length: 24, cost: 20, desc: 'Standard issue infantry blade.' },
    steel_claymore: { id: 'steel_claymore', name: 'Royal Steel Claymore', type: 'weapon', atk: 22, rarity: 'rare', color: '#3498db', length: 28, cost: 90, desc: 'Forged in royal fires with exceptional balance.' },
    flame_blade: { id: 'flame_blade', name: 'Flametongue Edge', type: 'weapon', atk: 35, rarity: 'epic', color: '#e74c3c', glow: '#ff7675', length: 30, cost: 250, desc: 'Imbued with ancient dragon ember.' },

    // Shields
    wooden_shield: { id: 'wooden_shield', name: 'Knight Heater Shield', type: 'shield', def: 6, rarity: 'common', cost: 15, desc: 'Reinforced oak shield.' },
    iron_bulwark: { id: 'iron_bulwark', name: 'Iron Bulwark', type: 'shield', def: 14, rarity: 'rare', cost: 75, desc: 'Heavy iron barrier that easily deflects blows.' },
    aegis_radiance: { id: 'aegis_radiance', name: 'Aegis of the Sun', type: 'shield', def: 24, rarity: 'epic', cost: 220, desc: 'Radiates a holy protective barrier.' },

    // Armors
    leather_tunic: { id: 'leather_tunic', name: 'Studded Leather', type: 'armor', hp: 15, def: 4, rarity: 'common', color: '#835427', cost: 15, desc: 'Lightweight flexible protection.' },
    chainmail: { id: 'chainmail', name: 'Chainmail Cuirass', type: 'armor', hp: 30, def: 8, rarity: 'common', color: '#718093', cost: 40, desc: 'Interlocked steel rings.' },
    dragons_plate: { id: 'dragons_plate', name: 'Dragon Scale Armor', type: 'armor', hp: 75, def: 20, rarity: 'epic', color: '#c0392b', cost: 300, desc: 'Virtually impenetrable dragon scales.' },

    // Rings & Accessories
    ring_might: { id: 'ring_might', name: 'Ring of Might', type: 'ring', atk: 8, rarity: 'rare', cost: 60, desc: 'Increases melee attack power.' },
    ring_protection: { id: 'ring_protection', name: 'Ring of Iron Will', type: 'ring', def: 6, rarity: 'rare', cost: 60, desc: 'Increases defense and damage resistance.' },

    // Consumables
    potion_health: { id: 'potion_health', name: 'Healing Draught', type: 'potion_health', value: 45, cost: 15, desc: 'Restores 45 Health points.' },
    potion_stamina: { id: 'potion_stamina', name: 'Stamina Elixir', type: 'potion_stamina', value: 50, cost: 12, desc: 'Restores 50 Stamina points.' }
};

class Inventory {
    constructor() {
        this.slots = [
            { ...ITEM_DATABASE.steel_claymore },
            { ...ITEM_DATABASE.potion_health },
            { ...ITEM_DATABASE.potion_stamina }
        ];
        this.maxSlots = 16;
    }

    addItem(item) {
        if (this.slots.length >= this.maxSlots) {
            return false;
        }
        this.slots.push({ ...item });
        return true;
    }

    removeItem(index) {
        if (index >= 0 && index < this.slots.length) {
            return this.slots.splice(index, 1)[0];
        }
        return null;
    }

    equipItem(index, player) {
        const item = this.slots[index];
        if (!item) return;

        if (item.type === 'weapon') {
            const old = player.equipment.weapon;
            player.equipment.weapon = item;
            this.slots[index] = old;
            window.soundEngine.play('block');
        } else if (item.type === 'shield') {
            const old = player.equipment.shield;
            player.equipment.shield = item;
            this.slots[index] = old;
            window.soundEngine.play('block');
        } else if (item.type === 'armor') {
            const old = player.equipment.armor;
            player.equipment.armor = item;
            this.slots[index] = old;
            window.soundEngine.play('block');
        } else if (item.type === 'ring') {
            const old = player.equipment.ring;
            player.equipment.ring = item;
            this.slots[index] = old;
            window.soundEngine.play('block');
        } else if (item.type === 'potion_health') {
            player.potions.health = Math.min(10, player.potions.health + 1);
            this.removeItem(index);
            window.soundEngine.play('potion');
        } else if (item.type === 'potion_stamina') {
            player.potions.stamina = Math.min(10, player.potions.stamina + 1);
            this.removeItem(index);
            window.soundEngine.play('potion');
        }
    }
}

window.ITEM_DATABASE = ITEM_DATABASE;
window.Inventory = Inventory;
