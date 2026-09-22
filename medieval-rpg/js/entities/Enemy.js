/**
 * Modular Enemy AI State Machine (Grunt, Archer)
 * States: IDLE, PATROL, CHASE, ATTACK, FLEE, STUNNED
 */
class Enemy extends Entity {
    constructor(x, y, type = 'grunt') {
        super(x, y, type === 'grunt' ? 14 : 12);
        this.type = type; // 'grunt' or 'archer'

        // Combat Stats
        if (type === 'grunt') {
            this.maxHp = 60;
            this.hp = 60;
            this.atk = 14;
            this.def = 3;
            this.speed = 105;
            this.aggroRadius = 240;
            this.attackRange = 36;
            this.attackCooldownMax = 1.3;
            this.color = '#e74c3c';
            this.xpValue = 35;
            this.goldValue = 12;
        } else if (type === 'archer') {
            this.maxHp = 40;
            this.hp = 40;
            this.atk = 16;
            this.def = 1;
            this.speed = 95;
            this.aggroRadius = 320;
            this.attackRange = 220;
            this.attackCooldownMax = 2.0;
            this.color = '#d2dae2';
            this.xpValue = 45;
            this.goldValue = 18;
        }

        // AI State
        this.state = 'IDLE'; // IDLE, PATROL, CHASE, ATTACK, FLEE, STUNNED
        this.stateTimer = 0;
        this.attackCooldown = 0.5 + Math.random() * 0.5;
        this.patrolTarget = { x, y };
        this.spawnPos = { x, y };
        this.stunTimer = 0;
    }

    updateAI(dt, player, combatManager, particleSystem) {
        if (!this.isAlive) return;

        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            this.vx = 0;
            this.vy = 0;
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        const distToPlayer = this.distanceTo(player);

        switch (this.state) {
            case 'IDLE':
            case 'PATROL':
                // Check Aggro
                if (player.isAlive && distToPlayer < this.aggroRadius) {
                    this.state = 'CHASE';
                } else {
                    this._updatePatrol(dt);
                }
                break;

            case 'CHASE':
                if (!player.isAlive || distToPlayer > this.aggroRadius * 1.5) {
                    this.state = 'PATROL';
                    this.patrolTarget = { ...this.spawnPos };
                    break;
                }

                this.facingAngle = this.angleTo(player);

                if (this.type === 'grunt') {
                    if (distToPlayer <= this.attackRange) {
                        this.state = 'ATTACK';
                        this.stateTimer = 0.3; // Windup
                    } else {
                        // Move toward player
                        this.vx = Math.cos(this.facingAngle) * this.speed;
                        this.vy = Math.sin(this.facingAngle) * this.speed;
                    }
                } else if (this.type === 'archer') {
                    if (distToPlayer < 120) {
                        // Too close! Kite / Flee
                        this.state = 'FLEE';
                    } else if (distToPlayer <= this.attackRange && this.attackCooldown <= 0) {
                        this.state = 'ATTACK';
                        this.stateTimer = 0.4; // Draw bow
                    } else {
                        // Position into shooting range
                        this.vx = Math.cos(this.facingAngle) * this.speed;
                        this.vy = Math.sin(this.facingAngle) * this.speed;
                    }
                }
                break;

            case 'FLEE':
                // Run directly away from player
                this.facingAngle = this.angleTo(player) + Math.PI;
                this.vx = Math.cos(this.facingAngle) * (this.speed * 1.15);
                this.vy = Math.sin(this.facingAngle) * (this.speed * 1.15);

                if (distToPlayer > 180) {
                    this.state = 'CHASE';
                }
                break;

            case 'ATTACK':
                this.stateTimer -= dt;
                this.vx = 0;
                this.vy = 0;
                this.facingAngle = this.angleTo(player);

                if (this.stateTimer <= 0) {
                    if (this.type === 'grunt') {
                        if (distToPlayer <= this.attackRange + 12) {
                            combatManager.applyEnemyMeleeHit(this, player, particleSystem);
                        }
                    } else if (this.type === 'archer') {
                        combatManager.spawnArcherArrow(this, player);
                        window.soundEngine.play('arrowShoot');
                    }
                    this.attackCooldown = this.attackCooldownMax;
                    this.state = 'CHASE';
                }
                break;
        }
    }

    _updatePatrol(dt) {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            this.stateTimer = 2 + Math.random() * 3;
            // Pick a random spot around spawn point
            const patrolRadius = 70;
            const angle = Math.random() * Math.PI * 2;
            this.patrolTarget = {
                x: this.spawnPos.x + Math.cos(angle) * patrolRadius,
                y: this.spawnPos.y + Math.sin(angle) * patrolRadius
            };
        }

        const dx = this.patrolTarget.x - this.x;
        const dy = this.patrolTarget.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 8) {
            this.facingAngle = Math.atan2(dy, dx);
            this.vx = Math.cos(this.facingAngle) * (this.speed * 0.45);
            this.vy = Math.sin(this.facingAngle) * (this.speed * 0.45);
        } else {
            this.vx = 0;
            this.vy = 0;
        }
    }

    stun(duration = 1.0) {
        this.stunTimer = duration;
        this.state = 'STUNNED';
    }
}

window.Enemy = Enemy;
