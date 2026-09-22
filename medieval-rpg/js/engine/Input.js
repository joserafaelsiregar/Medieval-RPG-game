/**
 * Input controller handling 8-way movement, mouse aiming, combo attack,
 * block/parry, dodge-roll, spells, and UI toggles.
 */
class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            leftDown: false,
            rightDown: false,
            leftClicked: false,
            rightClicked: false
        };

        this.actions = {
            moveX: 0,
            moveY: 0,
            attack: false,
            heavyAttack: false,
            block: false,
            dodge: false,
            jump: false,
            spell: false,
            interact: false,
            potionHealth: false,
            potionStamina: false,
            toggleInventory: false,
            toggleMap: false
        };

        this._setupListeners();
    }

    _setupListeners() {
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
            this.keys[e.key.toLowerCase()] = true;

            if (e.code === 'KeyI' || e.code === 'Tab') {
                this.actions.toggleInventory = true;
            }
            if (e.code === 'KeyF') {
                this.actions.interact = true;
            }
            if (e.code === 'Digit1') {
                this.actions.potionHealth = true;
            }
            if (e.code === 'Digit2') {
                this.actions.potionStamina = true;
            }
            if (e.code === 'KeyQ') {
                this.actions.heavyAttack = true;
            }
            if (e.code === 'KeyE') {
                this.actions.spell = true;
            }
            if (e.code === 'Space') {
                this.actions.jump = true;
            }
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyV' || e.code === 'KeyC') {
                this.actions.dodge = true;
            }
            if (e.code === 'KeyM') {
                this.actions.toggleMap = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keys[e.key.toLowerCase()] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.mouse.leftDown = true;
                this.mouse.leftClicked = true;
                this.actions.attack = true;
            } else if (e.button === 2) { // Right click
                this.mouse.rightDown = true;
                this.mouse.rightClicked = true;
                this.actions.block = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.leftDown = false;
            } else if (e.button === 2) {
                this.mouse.rightDown = false;
                this.actions.block = false;
            }
        });

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    update(camera) {
        // Calculate movement vector
        let dx = 0;
        let dy = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        this.actions.moveX = dx;
        this.actions.moveY = dy;
        this.actions.block = this.mouse.rightDown;

        // Update mouse in world coordinates
        if (camera) {
            const worldPos = camera.screenToWorld(this.mouse.x, this.mouse.y);
            this.mouse.worldX = worldPos.x;
            this.mouse.worldY = worldPos.y;
        }
    }

    consumeAction(actionName) {
        const val = this.actions[actionName];
        this.actions[actionName] = false;
        return val;
    }

    consumeLeftClick() {
        const val = this.mouse.leftClicked;
        this.mouse.leftClicked = false;
        return val;
    }
}

window.InputHandler = InputHandler;
