/**
 * Camera system with smooth target follow (lerping), bounds checking, and screen-shake impulse.
 */
class Camera {
    constructor(viewWidth, viewHeight) {
        this.x = 0;
        this.y = 0;
        this.width = viewWidth;
        this.height = viewHeight;
        this.target = null;
        this.lerpSpeed = 0.1;

        // Screen Shake
        this.shakeDuration = 0;
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;

        // Map boundaries
        this.bounds = {
            minX: 0,
            minY: 0,
            maxX: 4000,
            maxY: 3000
        };
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
    }

    follow(entity) {
        this.target = entity;
    }

    shake(intensity = 6, duration = 0.25) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    snapTo(targetX, targetY) {
        this.x = Math.max(this.bounds.minX, Math.min(targetX - this.width / 2, this.bounds.maxX - this.width));
        this.y = Math.max(this.bounds.minY, Math.min(targetY - this.height / 2, this.bounds.maxY - this.height));
    }

    update(dt) {
        if (this.target) {
            const targetX = this.target.x - this.width / 2;
            const targetY = this.target.y - this.height / 2;
            this.x += (targetX - this.x) * this.lerpSpeed;
            this.y += (targetY - this.y) * this.lerpSpeed;
        }

        // Clamp to map boundaries
        this.x = Math.max(this.bounds.minX, Math.min(this.x, this.bounds.maxX - this.width));
        this.y = Math.max(this.bounds.minY, Math.min(this.y, this.bounds.maxY - this.height));

        // Update Screen Shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            const progress = Math.max(0, this.shakeDuration);
            const currentIntensity = this.shakeIntensity * (progress / 0.25);
            this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
            this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
            this.shakeIntensity = 0;
        }
    }

    worldToScreen(wx, wy) {
        return {
            x: wx - this.x + this.shakeOffsetX,
            y: wy - this.y + this.shakeOffsetY
        };
    }

    screenToWorld(sx, sy) {
        return {
            x: sx + this.x - this.shakeOffsetX,
            y: sy + this.y - this.shakeOffsetY
        };
    }
}

window.Camera = Camera;
