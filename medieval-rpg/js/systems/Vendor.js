/**
 * Vendor & Blacksmith Upgrade Manager
 */
class VendorSystem {
    constructor() {
        this.shopItems = [
            ITEM_DATABASE.steel_claymore,
            ITEM_DATABASE.flame_blade,
            ITEM_DATABASE.iron_bulwark,
            ITEM_DATABASE.aegis_radiance,
            ITEM_DATABASE.dragons_plate,
            ITEM_DATABASE.ring_might,
            ITEM_DATABASE.ring_protection,
            ITEM_DATABASE.potion_health,
            ITEM_DATABASE.potion_stamina
        ];
    }

    buyItem(item, player, inventory, particleSystem) {
        if (player.gold >= item.cost) {
            if (inventory.addItem(item)) {
                player.gold -= item.cost;
                window.soundEngine.play('coin');
                particleSystem.addFloatingText(player.x, player.y - 15, `Bought ${item.name}!`, 'info');
                return true;
            } else {
                particleSystem.addFloatingText(player.x, player.y - 15, 'Inventory Full!', 'playerDamage');
                return false;
            }
        } else {
            particleSystem.addFloatingText(player.x, player.y - 15, 'Not Enough Gold!', 'playerDamage');
            return false;
        }
    }

    sellItem(index, player, inventory, particleSystem) {
        const item = inventory.slots[index];
        if (item) {
            const sellPrice = Math.max(5, Math.floor(item.cost * 0.6));
            player.gold += sellPrice;
            inventory.removeItem(index);
            window.soundEngine.play('coin');
            particleSystem.addFloatingText(player.x, player.y - 15, `+${sellPrice} Gold`, 'gold');
        }
    }

    upgradeWeapon(player, particleSystem) {
        const weapon = player.equipment.weapon;
        if (!weapon) return;

        const upgradeCost = (weapon.tier || 1) * 45;
        if (player.gold >= upgradeCost) {
            player.gold -= upgradeCost;
            weapon.tier = (weapon.tier || 1) + 1;
            weapon.atk += 6;
            weapon.name = `${weapon.name.replace(/\+\d+$/, '')} +${weapon.tier - 1}`;
            window.soundEngine.play('upgrade');
            particleSystem.emitLevelUp(player.x, player.y);
            particleSystem.addFloatingText(player.x, player.y - 20, `${weapon.name} Upgraded!`, 'crit');
        } else {
            particleSystem.addFloatingText(player.x, player.y - 15, `Need ${upgradeCost} Gold!`, 'playerDamage');
        }
    }
}

window.VendorSystem = VendorSystem;
window.vendorSystem = new VendorSystem();
