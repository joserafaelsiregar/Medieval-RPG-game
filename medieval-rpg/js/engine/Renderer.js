/**
 * Procedural Vector & Sprite Renderer for characters, weapons, animations, lighting, and props.
 */
class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    // Draw Drop Shadows
    drawShadow(x, y, radiusX = 14, radiusY = 7, alpha = 0.35) {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 4, radiusX, radiusY, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    // Draw Player Knight
    drawPlayer(screenX, screenY, player) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(screenX, screenY);

        // Dodge roll motion blur / roll rotation
        if (player.isRolling) {
            ctx.rotate(player.rollAngle);
            ctx.fillStyle = '#4a69bd';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
            return;
        }

        const facingAngle = player.facingAngle;
        ctx.rotate(facingAngle);

        // Body / Armor Cape
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.moveTo(-8, -12);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-8, 12);
        ctx.closePath();
        ctx.fill();

        // Main Body (Iron Cuirass)
        const armorColor = player.equipment.armor ? player.equipment.armor.color : '#718093';
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2f3640';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pauldrons (Shoulders)
        ctx.fillStyle = '#2f3640';
        ctx.beginPath();
        ctx.arc(2, -11, 5, 0, Math.PI * 2);
        ctx.arc(2, 11, 5, 0, Math.PI * 2);
        ctx.fill();

        // Knight Helmet / Visor
        ctx.fillStyle = '#dcdde1';
        ctx.beginPath();
        ctx.arc(3, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2f3640';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing Blue/Gold Visor Slit
        ctx.fillStyle = '#00d2d3';
        ctx.fillRect(7, -2, 3, 4);

        // Shield (Left Hand)
        if (player.isBlocking) {
            ctx.save();
            ctx.translate(14, -6);
            ctx.rotate(0.3);
            ctx.fillStyle = '#34495e';
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 10, -Math.PI / 2, Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Shield Crest
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-2, -3, 4, 6);
            ctx.restore();
        } else {
            ctx.fillStyle = '#34495e';
            ctx.strokeStyle = '#7f8c8d';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(2, -13, 4, 8, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Sword (Right Hand & Attack Swing Animation)
        this._drawPlayerWeapon(ctx, player);

        ctx.restore();
    }

    _drawPlayerWeapon(ctx, player) {
        ctx.save();
        const weapon = player.equipment.weapon || { name: 'Iron Sword', color: '#bdc3c7', length: 24 };

        if (player.attackState.isAttacking) {
            const swingProgress = player.attackState.timer / player.attackState.duration;
            const startArc = -Math.PI * 0.45;
            const endArc = Math.PI * 0.45;
            const currentSwing = startArc + (endArc - startArc) * swingProgress;

            ctx.translate(8, 6);
            ctx.rotate(currentSwing);

            // Glowing Blade Glow Layer
            if (player.attackState.isHeavy) {
                ctx.strokeStyle = 'rgba(0, 210, 211, 0.35)';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo((weapon.length || 24) + 3, 0);
                ctx.stroke();
            }

            // Core Blade
            ctx.strokeStyle = weapon.glow || '#ecf0f1';
            ctx.lineWidth = player.attackState.isHeavy ? 4.5 : 3.5;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(weapon.length || 24, 0);
            ctx.stroke();

            // Sword Guard & Pommel
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(4, -3, 3, 6);
        } else {
            // Weapon Idle at Hip
            ctx.translate(2, 12);
            ctx.rotate(0.3);
            ctx.strokeStyle = weapon.color || '#95a5a6';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(16, 0);
            ctx.stroke();
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(2, -2, 2.5, 4);
        }
        ctx.restore();
    }

    // Draw Enemy Grunt / Bandit / Skeleton
    drawEnemy(screenX, screenY, enemy) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(enemy.facingAngle);

        if (enemy.flinchTimer > 0) {
            ctx.fillStyle = '#ffffff'; // White hit-flash
        } else {
            ctx.fillStyle = enemy.color || '#e74c3c';
        }

        if (enemy.type === 'grunt') {
            // Goblin / Bandit Grunt
            ctx.beginPath();
            ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Angry Eyes
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(5, -4, 2.5, 0, Math.PI * 2);
            ctx.arc(5, 4, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Jagged Dagger / Club
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(6, 6, 12, 3);
        } else if (enemy.type === 'archer') {
            // Skeleton Archer (Bone color + Bow)
            ctx.fillStyle = enemy.flinchTimer > 0 ? '#ffffff' : '#d2dae2';
            ctx.beginPath();
            ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#485460';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Skull eye sockets
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(4, -3, 2, 0, Math.PI * 2);
            ctx.arc(4, 3, 2, 0, Math.PI * 2);
            ctx.fill();

            // Wooden Bow
            ctx.strokeStyle = '#834c1b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(10, 0, 10, -Math.PI * 0.4, Math.PI * 0.4);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Draw Dungeon Boss (Huge armored warlord)
    drawBoss(screenX, screenY, boss) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(screenX, screenY);

        // Ground Telegraph indicator for boss attacks
        if (boss.attackWindup > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(231, 76, 60, 0.28)';
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, boss.attackRange + 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.rotate(boss.facingAngle);

        // Boss Phase 2 Enrage Aura
        if (boss.phase === 2) {
            ctx.save();
            ctx.fillStyle = 'rgba(231, 76, 60, 0.25)';
            ctx.beginPath();
            ctx.arc(0, 0, boss.radius + 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(231, 76, 60, 0.12)';
            ctx.beginPath();
            ctx.arc(0, 0, boss.radius + 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Heavy Iron Spiked Armor
        ctx.fillStyle = boss.flinchTimer > 0 ? '#ffffff' : (boss.phase === 2 ? '#800000' : '#2d3436');
        ctx.beginPath();
        ctx.arc(0, 0, boss.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d63031';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Glowing Fiery Horns
        ctx.fillStyle = '#d63031';
        ctx.beginPath();
        ctx.moveTo(8, -boss.radius);
        ctx.lineTo(24, -boss.radius - 8);
        ctx.lineTo(14, -boss.radius + 6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8, boss.radius);
        ctx.lineTo(24, boss.radius + 8);
        ctx.lineTo(14, boss.radius - 6);
        ctx.closePath();
        ctx.fill();

        // Giant War Hammer
        ctx.save();
        ctx.translate(14, 18);
        ctx.fillStyle = '#636e72';
        ctx.fillRect(-4, -8, 22, 16);
        ctx.strokeStyle = '#d63031';
        ctx.lineWidth = 2;
        ctx.strokeRect(-4, -8, 22, 16);
        ctx.restore();

        ctx.restore();
    }

    // Draw Projectiles (Arrows, Fireballs)
    drawProjectile(screenX, screenY, proj) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(proj.angle);

        if (proj.type === 'arrow') {
            ctx.strokeStyle = '#bdc3c7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();

            // Arrow Tip
            ctx.fillStyle = '#7f8c8d';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(5, -3);
            ctx.lineTo(5, 3);
            ctx.closePath();
            ctx.fill();
        } else if (proj.type === 'spell' || proj.type === 'fireball') {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, (proj.radius || 7) + 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = proj.color || '#00f0ff';
            ctx.beginPath();
            ctx.arc(0, 0, proj.radius || 7, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

window.Renderer = Renderer;
