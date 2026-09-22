/**
 * Base Entity class for player, enemies, NPCs, and interactive objects.
 */
class Entity {
    constructor(x, y, radius = 14) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = radius;
        this.facingAngle = 0;
        this.isAlive = true;
        this.flinchTimer = 0;
        this.invulnerableTimer = 0;
    }

    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }

    distanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    angleTo(other) {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }

    applyKnockback(angle, force) {
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force;
    }

    updatePhysics(dt, world) {
        // Apply velocity with friction/drag
        const newX = this.x + this.vx * dt;
        const newY = this.y + this.vy * dt;

        if (world) {
            // Horizontal check
            if (!world.checkCollision(newX, this.y, this.radius)) {
                this.x = newX;
            } else {
                this.vx = 0;
            }

            // Vertical check
            if (!world.checkCollision(this.x, newY, this.radius)) {
                this.y = newY;
            } else {
                this.vy = 0;
            }
        } else {
            this.x = newX;
            this.y = newY;
        }

        // Friction damping
        this.vx *= Math.pow(0.001, dt);
        this.vy *= Math.pow(0.001, dt);

        if (this.flinchTimer > 0) this.flinchTimer -= dt;
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    }
}

window.Entity = Entity;
