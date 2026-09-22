/**
 * High-performance 2D Particle Engine for combat impacts, spells, dust, blood, and embers.
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
    }

    emit(x, y, options = {}) {
        const count = options.count || 1;
        const color = options.color || '#ff4444';
        const speed = options.speed || 80;
        const life = options.life || 0.4;
        const size = options.size || 3;
        const spread = options.spread !== undefined ? options.spread : Math.PI * 2;
        const angle = options.angle !== undefined ? options.angle : 0;
        const gravity = options.gravity || 0;
        const glow = options.glow || false;

        for (let i = 0; i < count; i++) {
            const pAngle = angle + (Math.random() - 0.5) * spread;
            const pSpeed = speed * (0.5 + Math.random() * 0.8);
            this.particles.push({
                x,
                y,
                vx: Math.cos(pAngle) * pSpeed,
                vy: Math.sin(pAngle) * pSpeed,
                color,
                life,
                maxLife: life,
                size: size * (0.7 + Math.random() * 0.6),
                gravity,
                glow
            });
        }
    }

    // Specific Combat Emitters
    emitBlood(x, y, hitAngle, count = 12) {
        this.emit(x, y, {
            count,
            color: '#b31217',
            speed: 130,
            life: 0.45,
            size: 3.5,
            angle: hitAngle,
            spread: 0.9,
            gravity: 40
        });
    }

    emitSparks(x, y, hitAngle, count = 16) {
        this.emit(x, y, {
            count,
            color: '#ffd700',
            speed: 180,
            life: 0.3,
            size: 2.5,
            angle: hitAngle,
            spread: 1.2,
            glow: true
        });
    }

    emitSpellImpact(x, y) {
        this.emit(x, y, {
            count: 24,
            color: '#00f0ff',
            speed: 160,
            life: 0.5,
            size: 4,
            spread: Math.PI * 2,
            glow: true
        });
    }

    emitDust(x, y) {
        this.emit(x, y, {
            count: 4,
            color: '#7a7167',
            speed: 25,
            life: 0.35,
            size: 2.8,
            angle: Math.PI * 0.5,
            spread: Math.PI * 0.6
        });
    }

    emitLevelUp(x, y) {
        this.emit(x, y, {
            count: 35,
            color: '#ffd700',
            speed: 140,
            life: 0.8,
            size: 4.5,
            spread: Math.PI * 2,
            glow: true
        });
    }

    // Floating Combat Text
    addFloatingText(x, y, text, type = 'normal') {
        let color = '#ffffff';
        let size = 15;
        let prefix = '';

        switch (type) {
            case 'crit':
                color = '#ff3333';
                size = 20;
                prefix = 'CRIT! ';
                break;
            case 'playerDamage':
                color = '#ff4d4d';
                size = 17;
                break;
            case 'enemyDamage':
                color = '#ffca28';
                size = 16;
                break;
            case 'heal':
                color = '#2ecc71';
                size = 16;
                prefix = '+';
                break;
            case 'stamina':
                color = '#3498db';
                size = 15;
                prefix = '+';
                break;
            case 'parry':
                color = '#f1c40f';
                size = 18;
                break;
            case 'block':
                color = '#95a5a6';
                size = 14;
                break;
            case 'gold':
                color = '#f39c12';
                size = 16;
                prefix = '+';
                break;
            case 'info':
                color = '#ecf0f1';
                size = 14;
                break;
            default:
                break;
        }

        this.floatingTexts.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y - 10,
            text: prefix + text,
            color,
            size,
            type,
            life: 0.85,
            maxLife: 0.85,
            vy: -45
        });
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.vx *= 0.94;
            p.vy *= 0.94;
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            ft.y += ft.vy * dt;
            ft.vy *= 0.96;
        }
    }

    render(ctx, camera) {
        ctx.save();

        // Render Particles
        for (const p of this.particles) {
            const screen = camera.worldToScreen(p.x, p.y);
            const alpha = Math.max(0, p.life / p.maxLife);
            const currentSize = p.size * (0.3 + 0.7 * alpha);

            if (p.glow) {
                ctx.globalAlpha = alpha * 0.35;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, Math.max(1, currentSize * 2), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
            ctx.fill();
        }

        // Render Floating Text
        for (const ft of this.floatingTexts) {
            const screen = camera.worldToScreen(ft.x, ft.y);
            const alpha = Math.min(1, ft.life / (ft.maxLife * 0.4));
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${ft.size}px 'Cinzel', 'Trajan Pro', serif`;
            ctx.textAlign = 'center';

            // Text Outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, screen.x, screen.y);

            // Text Fill
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, screen.x, screen.y);
        }

        ctx.restore();
    }
}

window.ParticleSystem = ParticleSystem;
