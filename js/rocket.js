/**
 * SmoothCursor Class (Final Optimized Version)
 * Uses CSS variables and smoothed rotation for the best performance and feel.
 *
 * @author Manus
 * @version 5.0.0
 */
class SmoothCursor {
    constructor(options = {}) {
        this.config = {
            element: document.querySelector(options.element || '#smooth-cursor'),
            stiffness: 0.15,    // 弹簧刚度，值越小越 "柔和"
            damping: 0.75,      // 阻尼，值越小越 "有弹性"
            rotationSpeed: 0.1, // 旋转跟随速度 (0-1)
            scaleOnMove: 0.9,   // 移动时缩放
        };

        if (!this.config.element) {
            console.error('SmoothCursor: Element not found.');
            return;
        }

        this.state = {
            target: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            velocity: { x: 0, y: 0 },
            rotation: 0,
            targetRotation: 0,
            scale: 1,
        };

        this.isMoving = false;
        this.scaleTimeout = null;
        this.animationFrame = null;

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.update = this.update.bind(this);

        this.init();
    }

    init() {
        window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        
        window.addEventListener('load', () => {
            this.config.element.style.setProperty('--scale', '1');
        });

        this.update();
    }

    handleMouseMove(e) {
        this.state.target.x = e.clientX;
        this.state.target.y = e.clientY;

        if (!this.isMoving) {
            this.isMoving = true;
            this.state.scale = this.config.scaleOnMove;
        }
        
        clearTimeout(this.scaleTimeout);
        this.scaleTimeout = setTimeout(() => {
            this.isMoving = false;
            this.state.scale = 1;
        }, 200);
    }

    update() {
        const { position, target, velocity, rotation } = this.state;
        const { stiffness, damping, rotationSpeed } = this.config;

        // --- 平滑移动计算 ---
        const dx = target.x - position.x;
        const dy = target.y - position.y;
        velocity.x = (velocity.x + dx * stiffness) * damping;
        velocity.y = (velocity.y + dy * stiffness) * damping;
        position.x += velocity.x;
        position.y += velocity.y;

        // --- 优化的平滑旋转计算 ---
        const speed = Math.hypot(velocity.x, velocity.y);
        if (speed > 0.5) { // 仅在有一定速度时才更新目标角度
            this.state.targetRotation = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI) + 90;
        }
        
        // 使用线性插值 (Lerp) 平滑地过渡到目标角度，防止抖动
        let angleDiff = this.state.targetRotation - rotation;
        // 处理角度从 359 -> 1 度的跳变
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        
        this.state.rotation += angleDiff * rotationSpeed;

        // --- 更新 CSS 变量 ---
        const style = this.config.element.style;
        style.setProperty('--x', `${position.x}px`);
        style.setProperty('--y', `${position.y}px`);
        style.setProperty('--rotate', `${this.state.rotation}deg`);
        style.setProperty('--scale', this.state.scale);

        this.animationFrame = requestAnimationFrame(this.update);
    }

    destroy() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        clearTimeout(this.scaleTimeout);
        cancelAnimationFrame(this.animationFrame);
        this.config.element.style.display = 'none';
    }
}

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    const cursor = new SmoothCursor();
});
