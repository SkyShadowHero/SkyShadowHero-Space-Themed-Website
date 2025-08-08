/**
 * SmoothCursor Class
 * Creates a custom cursor that smoothly follows the mouse.
 *
 * @author Manus
 * @version 2.1.0 (Icon-agnostic)
 */
class SmoothCursor {
    /**
     * @param {object} options - Configuration options.
     * @param {string} [options.element='#smooth-cursor'] - The selector for the cursor element.
     * @param {number} [options.stiffness=0.2] - The spring stiffness (0-1). Higher is faster.
     * @param {number} [options.damping=0.8] - The spring damping (0-1). Higher is smoother.
     * @param {number} [options.scaleOnMove=0.95] - The scale factor when the cursor is moving.
     */
    constructor(options = {}) {
        this.config = {
            element: document.querySelector(options.element || '#smooth-cursor'),
            stiffness: options.stiffness || 0.2,
            damping: options.damping || 0.8,
            scaleOnMove: options.scaleOnMove || 0.95,
        };

        if (!this.config.element) {
            console.error('SmoothCursor: Element not found.');
            return;
        }

        this.state = {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
            rotation: 0,
            scale: 1,
            isMoving: false,
            scaleTimeout: null,
            animationFrame: null,
        };

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.update = this.update.bind(this);

        this.init();
    }

    init() {
        this.state.target.x = window.innerWidth / 2;
        this.state.target.y = window.innerHeight / 2;
        this.state.position.x = this.state.target.x;
        this.state.position.y = this.state.target.y;

        window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        
        window.addEventListener('load', () => {
            this.config.element.style.transform = `translate(-50%, -50%) scale(1)`;
        });

        this.update();
    }

    handleMouseMove(e) {
        this.state.target.x = e.clientX;
        this.state.target.y = e.clientY;

        if (!this.state.isMoving) {
            this.state.isMoving = true;
            this.state.scale = this.config.scaleOnMove;
        }
        
        clearTimeout(this.state.scaleTimeout);
        this.state.scaleTimeout = setTimeout(() => {
            this.state.isMoving = false;
            this.state.scale = 1;
        }, 150);
    }

    update() {
        const { position, target, velocity } = this.state;
        const { stiffness, damping } = this.config;

        const dx = target.x - position.x;
        const dy = target.y - position.y;

        const ax = dx * stiffness;
        const ay = dy * stiffness;

        velocity.x = (velocity.x + ax) * damping;
        velocity.y = (velocity.y + ay) * damping;

        position.x += velocity.x;
        position.y += velocity.y;

        const speed = Math.hypot(velocity.x, velocity.y);
        if (speed > 0.1) {
            this.state.rotation = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI) + 90;
        }

        this.config.element.style.transform = `translate(${position.x}px, ${position.y}px) translate(-50%, -50%) rotate(${this.state.rotation}deg) scale(${this.state.scale})`;

        this.state.animationFrame = requestAnimationFrame(this.update);
    }

    destroy() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        clearTimeout(this.state.scaleTimeout);
        cancelAnimationFrame(this.state.animationFrame);
        this.config.element.style.display = 'none';
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const cursor = new SmoothCursor();
});
