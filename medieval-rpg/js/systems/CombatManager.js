/**
 * Combat Manager handling hitboxes, damage formulas, parry windows,
 * projectiles, knockback, and floating numbers.
 */
class CombatManager {
    constructor() {
        this.projectiles = [];
    }

    update(dt, player, enemies, boss, props, particleSystem, world) {
        // 1. Process Active Player Melee Attack
        if (player.attackState.isAttacking) {
            this._checkPlayerMeleeHits(player, enemies, boss, props, particleSystem);
        }

        // 2. Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= dt;
            p.x += Math.cos(p.angle) * p.speed * dt;
            p.y += Math.sin(p.angle) * p.speed * dt;

            // Projectile wall collision
            if (world && world.checkCollision(p.x, p.y, p.radius || 4)) {
                particleSystem.emitSparks(p.x, p.y, p.angle + Math.PI, 6);
                this.projectiles.splice(i, 1);
                continue;
            }

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Hit Detection
            if (p.fromPlayer) {
                // Check against enemies & boss
                let hitTarget = false;
                for (const enemy of enemies) {
                    if (enemy.isAlive && enemy.distanceTo(p) < enemy.radius + p.radius) {
                        this.applyPlayerSpellHit(p, enemy, particleSystem);
                        hitTarget = true;
                        break;
                    }
                }
                if (!hitTarget && boss && boss.isAlive && boss.distanceTo(p) < boss.radius + p.radius) {
                    this.applyPlayerSpellHit(p, boss, particleSystem);
                    hitTarget = true;
                }
                if (hitTarget) {
                    this.projectiles.splice(i, 1);
                    continue;
                }
            } else {
                // Hostile projectile checking against Player
                if (player.isAlive && player.distanceTo(p) < player.radius + p.radius) {
                    this.applyEnemyProjectileHit(p, player, particleSystem);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }
        }
    }

    _checkPlayerMeleeHits(player, enemies, boss, props, particleSystem) {
        const weaponReach = (player.equipment.weapon ? player.equipment.weapon.length : 24) + 18;
        const attackArc = player.attackState.isHeavy ? Math.PI * 0.8 : Math.PI * 0.6;

        // Check enemies
        for (const enemy of enemies) {
            if (!enemy.isAlive || player.attackState.hitEnemies.has(enemy)) continue;

            const dist = player.distanceTo(enemy);
            if (dist <= weaponReach + enemy.radius) {
                const angleToEnemy = player.angleTo(enemy);
                const angleDiff = Math.abs(Math.atan2(Math.sin(angleToEnemy - player.facingAngle), Math.cos(angleToEnemy - player.facingAngle)));

                if (angleDiff <= attackArc / 2) {
                    player.attackState.hitEnemies.add(enemy);
                    this.applyPlayerMeleeHit(player, enemy, particleSystem);
                }
            }
        }

        // Check Boss
        if (boss && boss.isAlive && !player.attackState.hitEnemies.has(boss)) {
            const dist = player.distanceTo(boss);
            if (dist <= weaponReach + boss.radius) {
                const angleToBoss = player.angleTo(boss);
                const angleDiff = Math.abs(Math.atan2(Math.sin(angleToBoss - player.facingAngle), Math.cos(angleToBoss - player.facingAngle)));

                if (angleDiff <= attackArc / 2) {
                    player.attackState.hitEnemies.add(boss);
                    this.applyPlayerMeleeHit(player, boss, particleSystem);
                }
            }
        }

        // Check Props (Crates)
        for (const prop of props) {
            if (prop.type === 'crate' && prop.hp > 0 && !player.attackState.hitEnemies.has(prop)) {
                if (player.distanceTo(prop) <= weaponReach + prop.radius) {
                    player.attackState.hitEnemies.add(prop);
                    prop.hp -= 30;
                    particleSystem.emitSparks(prop.x, prop.y, player.facingAngle, 8);
                    window.soundEngine.play('hit');
                    if (prop.hp <= 0) {
                        prop.isAlive = false;
                        // Drop loot / potion occasionally
                        if (Math.random() < 0.6) {
                            player.gold += 8;
                            particleSystem.addFloatingText(prop.x, prop.y, '8 Gold', 'gold');
                        }
                    }
                }
            }
        }
    }

    applyPlayerMeleeHit(player, target, particleSystem) {
        // Calculate Damage
        const isHeavy = player.attackState.isHeavy;
        const isAerial = (player.jumpZ || 0) > 6;
        let baseDamage = player.totalAtk * (isHeavy ? 2.2 : (1.0 + player.comboStep * 0.25));
        if (isAerial) baseDamage *= 1.3; // 30% Aerial strike damage bonus

        const effectiveDefense = target.def || 0;
        let finalDamage = Math.max(5, Math.floor(baseDamage - effectiveDefense * 0.7));

        const isCrit = Math.random() < 0.25 || isAerial;
        if (isCrit) finalDamage = Math.floor(finalDamage * 1.6);

        target.hp -= finalDamage;
        target.flinchTimer = 0.18;

        // Apply Knockback
        const knockForce = isHeavy || isAerial ? 380 : 190;
        target.applyKnockback(player.facingAngle, knockForce);

        window.soundEngine.play('hit');
        particleSystem.emitBlood(target.x, target.y, player.facingAngle, (isHeavy || isAerial) ? 22 : 12);
        if (isAerial) particleSystem.emitSparks(target.x, target.y, player.facingAngle, 14);
        particleSystem.addFloatingText(target.x, target.y, finalDamage, isAerial ? 'crit' : (isCrit ? 'crit' : 'enemyDamage'));
        window.camera.shake(isHeavy || isAerial ? 8 : 4, 0.2);

        // Check Kill
        if (target.hp <= 0 && target.isAlive) {
            target.isAlive = false;
            target.hp = 0;
            player.gainXp(target.xpValue || 25, particleSystem);
            player.gold += (target.goldValue || 10);
            particleSystem.addFloatingText(target.x, target.y - 18, `${target.goldValue || 10} Gold`, 'gold');
            window.soundEngine.play('coin');
        }
    }

    applyPlayerSpellHit(proj, target, particleSystem) {
        const damage = proj.damage || 35;
        target.hp -= damage;
        target.flinchTimer = 0.2;
        target.applyKnockback(proj.angle, 220);

        particleSystem.emitSpellImpact(target.x, target.y);
        particleSystem.addFloatingText(target.x, target.y, damage, 'crit');
        window.soundEngine.play('hit');

        if (target.hp <= 0 && target.isAlive) {
            target.isAlive = false;
            target.hp = 0;
            proj.player.gainXp(target.xpValue || 25, particleSystem);
            proj.player.gold += (target.goldValue || 10);
            particleSystem.addFloatingText(target.x, target.y - 18, `${target.goldValue || 10} Gold`, 'gold');
        }
    }

    applyEnemyMeleeHit(enemy, player, particleSystem, damageMultiplier = 1.0) {
        if (!player.isAlive || player.invulnerableTimer > 0 || (player.jumpZ && player.jumpZ > 8)) return;

        // Check Parry Window (Timed block)
        if (player.isBlocking && player.parryWindow > 0) {
            window.soundEngine.play('parry');
            particleSystem.emitSparks(player.x, player.y, player.facingAngle, 22);
            particleSystem.addFloatingText(player.x, player.y - 20, "PARRY!", 'parry');
            window.camera.shake(9, 0.35);

            // Stun Enemy and push back
            enemy.stun(1.4);
            enemy.applyKnockback(player.facingAngle, 260);
            return;
        }

        // Check Normal Shield Block
        if (player.isBlocking) {
            window.soundEngine.play('block');
            particleSystem.emitSparks(player.x, player.y, player.facingAngle, 8);
            particleSystem.addFloatingText(player.x, player.y - 15, "BLOCKED", 'block');

            // Reduced damage and stamina chip
            const chipDamage = Math.max(2, Math.floor((enemy.atk * damageMultiplier - player.totalDef) * 0.2));
            player.hp -= chipDamage;
            player.stamina = Math.max(0, player.stamina - 15);
            player.staminaRegenDelay = 0.8;
            player.applyKnockback(enemy.facingAngle, 100);
            return;
        }

        // Direct Hit on Player
        const rawDamage = enemy.atk * damageMultiplier;
        const damage = Math.max(4, Math.floor(rawDamage - player.totalDef * 0.6));
        player.hp -= damage;
        player.flinchTimer = 0.2;
        player.invulnerableTimer = 0.35; // Brief post-hit immunity
        player.applyKnockback(enemy.facingAngle, 200);

        window.soundEngine.play('hit');
        window.camera.shake(8, 0.3);
        particleSystem.emitBlood(player.x, player.y, enemy.facingAngle, 15);
        particleSystem.addFloatingText(player.x, player.y, damage, 'playerDamage');

        if (player.hp <= 0) {
            player.hp = 0;
            player.isAlive = false;
            window.soundEngine.play('playerDeath');
            particleSystem.addFloatingText(player.x, player.y - 25, "YOU DIED", 'crit');
        }
    }

    applyEnemyProjectileHit(proj, player, particleSystem) {
        if (!player.isAlive || player.invulnerableTimer > 0 || (player.jumpZ && player.jumpZ > 12)) return;

        if (player.isBlocking) {
            window.soundEngine.play('block');
            particleSystem.emitSparks(player.x, player.y, proj.angle + Math.PI, 10);
            particleSystem.addFloatingText(player.x, player.y - 15, "DEFLECTED", 'block');
            player.stamina = Math.max(0, player.stamina - 10);
            return;
        }

        const damage = Math.max(3, Math.floor(proj.damage - player.totalDef * 0.5));
        player.hp -= damage;
        player.invulnerableTimer = 0.3;
        player.applyKnockback(proj.angle, 140);

        window.soundEngine.play('hit');
        window.camera.shake(6, 0.25);
        particleSystem.emitBlood(player.x, player.y, proj.angle, 10);
        particleSystem.addFloatingText(player.x, player.y, damage, 'playerDamage');

        if (player.hp <= 0) {
            player.hp = 0;
            player.isAlive = false;
            window.soundEngine.play('playerDeath');
        }
    }

    spawnPlayerSpell(player) {
        this.projectiles.push({
            x: player.x + Math.cos(player.facingAngle) * 18,
            y: player.y + Math.sin(player.facingAngle) * 18,
            angle: player.facingAngle,
            speed: 380,
            radius: 8,
            damage: Math.floor(player.totalAtk * 1.8),
            life: 1.8,
            fromPlayer: true,
            player: player,
            type: 'spell',
            color: '#00f0ff'
        });
    }

    spawnArcherArrow(enemy, player) {
        const angle = enemy.angleTo(player);
        this.projectiles.push({
            x: enemy.x + Math.cos(angle) * 16,
            y: enemy.y + Math.sin(angle) * 16,
            angle: angle,
            speed: 320,
            radius: 4,
            damage: enemy.atk,
            life: 2.0,
            fromPlayer: false,
            type: 'arrow'
        });
    }

    spawnBossOrb(x, y, angle) {
        this.projectiles.push({
            x: x + Math.cos(angle) * 32,
            y: y + Math.sin(angle) * 32,
            angle: angle,
            speed: 210,
            radius: 9,
            damage: 22,
            life: 3.0,
            fromPlayer: false,
            type: 'fireball',
            color: '#ff3838'
        });
    }
}

window.CombatManager = CombatManager;
window.combatManager = new CombatManager();
