/**
 * Player Knight with 8-way movement, dodge roll i-frames, 3-hit combo attack,
 * heavy charged attack, shield block/parry, spell cast, and stat progression.
 */
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 14);

        // Core Attributes (Significantly enhanced starting warrior stats)
        this.maxHp = 250;          // Robust health pool
        this.hp = 250;
        this.maxStamina = 200;     // Expanded stamina for combos and dodging
        this.stamina = 200;
        this.staminaRegen = 60;    // Rapid stamina recovery (60/s)
        this.staminaRegenDelay = 0;

        this.baseAtk = 38;         // High starting power
        this.baseDef = 16;         // Sturdy defense
        this.speed = 280;          // Fast, responsive, fluid agility
        this.gold = 150;           // Generous starting coin purse

        // Level / XP
        this.level = 1;
        this.xp = 0;
        this.nextLevelXp = 100;

        // Jump & Aerial Mechanics
        this.jumpZ = 0;            // Elevation height above ground
        this.jumpVz = 0;           // Vertical jump velocity
        this.gravityZ = 880;       // Gravity force
        this.isJumping = false;
        this.jumpCooldown = 0;

        // States & Free Evade Mechanics
        this.isRolling = false;
        this.rollTimer = 0;
        this.rollDuration = 0.38;
        this.rollSpeed = 520;      // Swift, responsive evade dash
        this.rollAngle = 0;
        this.rollDirX = 0;
        this.rollDirY = 0;

        // Combat Combo State
        this.comboStep = 0; // 0, 1, 2
        this.comboResetTimer = 0;
        this.attackState = {
            isAttacking: false,
            timer: 0,
            duration: 0.22,
            isHeavy: false,
            hitEnemies: new Set()
        };

        // Shield & Parry
        this.isBlocking = false;
        this.parryWindow = 0; // First 0.25s of blocking is a parry window

        // Spells & Cooldowns
        this.spellCooldown = 0;
        this.maxSpellCooldown = 2.5;

        // Equipment Slots (Upgraded Starting Gear)
        this.equipment = {
            weapon: { id: 'royal_broadsword', name: 'Tempered Royal Broadsword', atk: 22, tier: 2, glow: '#00d2d3', length: 26, cost: 0 },
            shield: { id: 'reinforced_shield', name: 'Reinforced Knight Shield', def: 12, cost: 0 },
            armor: { id: 'champion_plate', name: 'Champion Plate Armor', hp: 50, def: 14, color: '#4b6584', cost: 0 },
            ring: { id: 'ring_valiant', name: 'Ring of the Valiant', atk: 8, def: 6, cost: 0 }
        };

        // Consumables count (Boosted initial supplies)
        this.potions = {
            health: 6,
            stamina: 5
        };
    }

    get totalAtk() {
        let atk = this.baseAtk;
        if (this.equipment.weapon) atk += this.equipment.weapon.atk;
        if (this.equipment.ring && this.equipment.ring.atk) atk += this.equipment.ring.atk;
        return atk;
    }

    get totalDef() {
        let def = this.baseDef;
        if (this.equipment.shield) def += this.equipment.shield.def;
        if (this.equipment.armor) def += this.equipment.armor.def;
        if (this.equipment.ring && this.equipment.ring.def) def += this.equipment.ring.def;
        return def;
    }

    get effectiveMaxHp() {
        let max = this.maxHp;
        if (this.equipment.armor && this.equipment.armor.hp) max += this.equipment.armor.hp;
        return max;
    }

    handleInput(input, dt, particleSystem) {
        if (!this.isAlive) return;

        // Aim towards mouse
        this.facingAngle = Math.atan2(input.mouse.worldY - this.y, input.mouse.worldX - this.x);

        // Cooldown tickers
        if (this.spellCooldown > 0) this.spellCooldown -= dt;
        if (this.jumpCooldown > 0) this.jumpCooldown -= dt;
        if (this.comboResetTimer > 0) {
            this.comboResetTimer -= dt;
            if (this.comboResetTimer <= 0) this.comboStep = 0;
        }

        // Potion consumption (Enhanced Potency: 100 HP, 90 SP)
        if (input.consumeAction('potionHealth') && this.potions.health > 0 && this.hp < this.effectiveMaxHp) {
            this.potions.health--;
            this.heal(100, particleSystem);
            window.soundEngine.play('potion');
        }
        if (input.consumeAction('potionStamina') && this.potions.stamina > 0 && this.stamina < this.maxStamina) {
            this.potions.stamina--;
            this.restoreStamina(90, particleSystem);
            window.soundEngine.play('potion');
        }

        // Block & Parry Trigger
        const wasBlocking = this.isBlocking;
        this.isBlocking = input.actions.block && !this.isRolling && !this.attackState.isAttacking && !this.isJumping;
        if (this.isBlocking && !wasBlocking) {
            this.parryWindow = 0.24; // Generous parry window
            window.soundEngine.play('block');
        }
        if (this.parryWindow > 0) this.parryWindow -= dt;

        // Acrobatic Jump Trigger (Space)
        if (input.consumeAction('jump') && !this.isJumping && !this.isRolling && this.stamina >= 6) {
            this.stamina -= 6;
            this.staminaRegenDelay = 0.2;
            this.isJumping = true;
            this.jumpZ = 2;
            this.jumpVz = 360;
            this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.35); // Airborne evasion

            window.soundEngine.play('jump');
            if (particleSystem) particleSystem.emitDust(this.x, this.y);
        }

        // Free Evade / Dodge Roll Trigger (Shift / V / C)
        if (input.consumeAction('dodge') && !this.isRolling && this.stamina >= 12) {
            this.stamina -= 12;
            this.staminaRegenDelay = 0.25;
            this.isRolling = true;
            this.rollTimer = this.rollDuration;
            this.invulnerableTimer = this.rollDuration; // 100% i-frames for complete evasion

            let dirX = input.actions.moveX;
            let dirY = input.actions.moveY;
            if (dirX === 0 && dirY === 0) {
                dirX = Math.cos(this.facingAngle);
                dirY = Math.sin(this.facingAngle);
            }
            this.rollDirX = dirX;
            this.rollDirY = dirY;
            window.soundEngine.play('dodge');
            if (particleSystem) particleSystem.emitDust(this.x, this.y);
            return;
        }

        // Light Attack (Combo 1 -> 2 -> 3)
        if (input.consumeAction('attack') && !this.isRolling && !this.attackState.isAttacking && this.stamina >= 10) {
            this.stamina -= 10;
            this.staminaRegenDelay = 0.35;
            this.attackState.isAttacking = true;
            this.attackState.isHeavy = false;
            this.attackState.timer = 0;
            this.attackState.duration = 0.22;
            this.attackState.hitEnemies.clear();

            this.comboStep = (this.comboStep + 1) % 3;
            this.comboResetTimer = 0.85;

            const soundName = this.comboStep === 1 ? 'slash1' : (this.comboStep === 2 ? 'slash2' : 'slash3');
            window.soundEngine.play(soundName);
        }

        // Heavy Attack / Aerial Slam (Q)
        if (input.consumeAction('heavyAttack') && !this.isRolling && !this.attackState.isAttacking && this.stamina >= 24) {
            this.stamina -= 24;
            this.staminaRegenDelay = 0.5;
            this.attackState.isAttacking = true;
            this.attackState.isHeavy = true;
            this.attackState.timer = 0;
            this.attackState.duration = 0.38;
            this.attackState.hitEnemies.clear();
            window.soundEngine.play('heavySlash');
        }

        // Cast Spell (E)
        if (input.consumeAction('spell') && this.spellCooldown <= 0 && this.stamina >= 20) {
            this.stamina -= 20;
            this.staminaRegenDelay = 0.4;
            this.spellCooldown = this.maxSpellCooldown;
            window.soundEngine.play('spell');
            window.combatManager.spawnPlayerSpell(this);
            if (particleSystem) particleSystem.emitSpellImpact(this.x, this.y);
        }

        // Movement Physics
        if (this.isRolling) {
            this.rollTimer -= dt;
            this.vx = this.rollDirX * this.rollSpeed;
            this.vy = this.rollDirY * this.rollSpeed;
            this.rollAngle += 20 * dt;

            if (Math.random() < 0.35 && particleSystem) {
                particleSystem.emitDust(this.x, this.y);
            }

            if (this.rollTimer <= 0) {
                this.isRolling = false;
                this.rollAngle = 0;
            }
        } else if (this.attackState.isAttacking) {
            // Step forward during attack
            this.attackState.timer += dt;
            const lungeSpeed = this.attackState.isHeavy ? 120 : 85;
            this.vx = Math.cos(this.facingAngle) * lungeSpeed;
            this.vy = Math.sin(this.facingAngle) * lungeSpeed;

            if (this.attackState.timer >= this.attackState.duration) {
                this.attackState.isAttacking = false;
            }
        } else if (this.isBlocking) {
            // Controlled tactical movement while guarding
            this.vx = input.actions.moveX * (this.speed * 0.55);
            this.vy = input.actions.moveY * (this.speed * 0.55);
        } else {
            // Free 8-way fluid movement (with full speed maintained during jumps)
            this.vx = input.actions.moveX * this.speed;
            this.vy = input.actions.moveY * this.speed;

            if ((this.vx !== 0 || this.vy !== 0) && Math.random() < 0.1 && particleSystem && !this.isJumping) {
                particleSystem.emitDust(this.x, this.y);
            }
        }

        // Jump Height & Gravity Simulation
        if (this.isJumping || this.jumpZ > 0) {
            this.jumpZ += this.jumpVz * dt;
            this.jumpVz -= this.gravityZ * dt;

            if (this.jumpZ <= 0) {
                this.jumpZ = 0;
                this.jumpVz = 0;
                this.isJumping = false;
                if (particleSystem) particleSystem.emitDust(this.x, this.y);
            }
        }

        // Stamina Passive Regeneration
        if (this.staminaRegenDelay > 0) {
            this.staminaRegenDelay -= dt;
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);
        }
    }

    heal(amount, particleSystem) {
        this.hp = Math.min(this.effectiveMaxHp, this.hp + amount);
        if (particleSystem) {
            particleSystem.addFloatingText(this.x, this.y - 15, `+${amount} HP`, 'heal');
        }
    }

    restoreStamina(amount, particleSystem) {
        this.stamina = Math.min(this.maxStamina, this.stamina + amount);
        if (particleSystem) {
            particleSystem.addFloatingText(this.x, this.y - 15, `+${amount} SP`, 'stamina');
        }
    }

    gainXp(amount, particleSystem) {
        this.xp += amount;
        if (this.xp >= this.nextLevelXp) {
            this.xp -= this.nextLevelXp;
            this.level++;
            this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5);
            this.maxHp += 21; // +40% (15 -> 21)
            this.hp = this.effectiveMaxHp;
            this.baseAtk += 6; // +40% (4 -> 6)
            this.baseDef += 3; // +40% (2 -> 3)
            window.soundEngine.play('upgrade');
            if (particleSystem) {
                particleSystem.emitLevelUp(this.x, this.y);
                particleSystem.addFloatingText(this.x, this.y - 25, `LEVEL UP! Lv.${this.level}`, 'crit');
            }
        }
    }
}

window.Player = Player;
