/**
 * Dungeon Mini-Boss: "The Ruin Warlord"
 * Multi-phase AI:
 * Phase 1 (100% - 50% HP): Heavy Cleaves, Shockwave Slams, Charge Dashing.
 * Phase 2 (< 50% HP): Enrage mode, 360-degree Nova blasts, Minion summoning.
 */
class Boss extends Entity {
    constructor(x, y) {
        super(x, y, 28);
        this.name = "Malakor, The Ruin Warlord";
        this.maxHp = 450;
        this.hp = 450;
        this.atk = 26;
        this.def = 8;
        this.speed = 90;
        this.phase = 1;

        this.attackRange = 65;
        this.attackWindup = 0;
        this.attackCooldown = 2.0;
        this.attackType = 'slam'; // 'slam', 'charge', 'nova'

        this.summonCooldown = 12.0;
        this.hasSummonedAdds = false;
        this.xpValue = 250;
        this.goldValue = 150;
    }

    updateAI(dt, player, combatManager, particleSystem, enemiesList) {
        if (!this.isAlive) return;

        // Check Phase 2 Transition (< 50% HP)
        if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
            this.phase = 2;
            this.speed = 120;
            this.atk = 34;
            window.soundEngine.play('bossRoar');
            particleSystem.emitLevelUp(this.x, this.y);
            particleSystem.addFloatingText(this.x, this.y - 30, "ENRAGED!", 'crit');
            window.camera.shake(12, 0.6);

            // Phase 2 Add Summoning
            if (enemiesList) {
                enemiesList.push(new Enemy(this.x - 60, this.y, 'grunt'));
                enemiesList.push(new Enemy(this.x + 60, this.y, 'archer'));
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        const distToPlayer = this.distanceTo(player);
        this.facingAngle = this.angleTo(player);

        // Windup state (Telegraph)
        if (this.attackWindup > 0) {
            this.attackWindup -= dt;
            this.vx = 0;
            this.vy = 0;

            if (this.attackWindup <= 0) {
                this._executeBossAttack(player, combatManager, particleSystem);
            }
            return;
        }

        // Idle if player is not in boss arena range
        if (distToPlayer > 750) {
            this.vx = 0;
            this.vy = 0;
            return;
        }

        // Action Decision
        if (distToPlayer <= this.attackRange && this.attackCooldown <= 0) {
            this.attackWindup = 0.55; // 0.55s red telegraph ring
            this.attackType = Math.random() < 0.5 ? 'slam' : (this.phase === 2 ? 'nova' : 'slam');
        } else if (distToPlayer > 160 && this.attackCooldown <= 0 && Math.random() < 0.4) {
            // Charge attack
            this.attackWindup = 0.4;
            this.attackType = 'charge';
        } else {
            // Move toward player
            this.vx = Math.cos(this.facingAngle) * this.speed;
            this.vy = Math.sin(this.facingAngle) * this.speed;
        }
    }

    _executeBossAttack(player, combatManager, particleSystem) {
        window.camera.shake(10, 0.4);

        if (this.attackType === 'slam') {
            window.soundEngine.play('bossSlam');
            particleSystem.emitSparks(this.x, this.y, 0, 25);
            const dist = this.distanceTo(player);
            if (dist <= this.attackRange + 25) {
                combatManager.applyEnemyMeleeHit(this, player, particleSystem, 1.4); // 1.4x heavy slam damage
            }
            this.attackCooldown = 2.0;
        } else if (this.attackType === 'charge') {
            window.soundEngine.play('bossRoar');
            this.vx = Math.cos(this.facingAngle) * 420;
            this.vy = Math.sin(this.facingAngle) * 420;
            const dist = this.distanceTo(player);
            if (dist <= this.attackRange + 30) {
                combatManager.applyEnemyMeleeHit(this, player, particleSystem, 1.2);
            }
            this.attackCooldown = 2.8;
        } else if (this.attackType === 'nova') {
            window.soundEngine.play('spell');
            // Fire projectiles in 8 cardinal directions
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                combatManager.spawnBossOrb(this.x, this.y, angle);
            }
            this.attackCooldown = 3.2;
        }
    }
}

window.Boss = Boss;
