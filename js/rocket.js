/**
 * SmoothCursor Class (v8.1.0 - Corrected Orientation & Tuned Pulse)
 * Features corrected icon orientation, a powerful pulse, and a vibrant spark burst.
 *
 * @author Manus
 * @version 8.1.0
 */
class SmoothCursor {
    constructor(options = {}) {
        this.config = {
            element: document.querySelector('#smooth-cursor'),
            particleContainer: document.querySelector('#particle-container'),
            
            stiffness: 0.08,
            damping: 0.85,
            
            // 1. 应用您提供的新脉冲配置
            pulseChance: 0.002,
            pulseMagnitude: 20,   // 您的新参数
            pulseDuration: 400,   // 您的新参数
            
            particleCount: 50,
            particleSpread: 250,
            particleColors: [
                '#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FFFFFF'
            ],

            // 2. 新增：旋转偏移量，用于校正图标初始朝向
            // 如果图标默认朝向左上角 (-45°), 我们需要加 45° 让它朝上 (0°)
            rotationOffset: -45, // <--- 在这里调整校正角度

            ...options,
        };

        if (!this.config.element || !this.config.particleContainer) {
            console.error('SmoothCursor: Element or Particle Container not found.');
            return;
        }

        this.state = {
            target: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            velocity: { x: 0, y: 0 },
            // 将初始旋转设置为偏移量，这样页面加载时它就是正的
            rotation: this.config.rotationOffset, 
            targetRotation: this.config.rotationOffset,
        };

        this.isPulsing = false;

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.update = this.update.bind(this);

        this.init();
    }

    init() {
        window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        window.addEventListener('load', () => {
            this.config.element.style.setProperty('--scale', '1');
        }, { once: true });
        this.update();
    }

    handleMouseMove(e) {
        if (!this.isPulsing) {
            this.state.target.x = e.clientX;
            this.state.target.y = e.clientY;
        }
    }

    update() {
        this.tryRandomPulse();

        const { position, target, velocity } = this.state;
        const currentDamping = this.isPulsing ? 0.98 : this.config.damping;
        const currentStiffness = this.isPulsing ? 0 : this.config.stiffness;

        const dx = target.x - position.x;
        const dy = target.y - position.y;
        
        velocity.x = (velocity.x + dx * currentStiffness) * currentDamping;
        velocity.y = (velocity.y + dy * currentStiffness) * currentDamping;
        
        position.x += velocity.x;
        position.y += velocity.y;

        // --- 旋转计算 ---
        const speed = Math.hypot(velocity.x, velocity.y);
        if (speed > 0.1) {
            // 计算出的目标角度 (atan2) 是基于笛卡尔坐标系的，0度朝右
            // 我们加上 90 度让它朝上，这是之前就有的逻辑
            const angleInDegrees = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI) + 90;
            // 3. 在这里应用最终的校正偏移
            this.state.targetRotation = angleInDegrees + this.config.rotationOffset;
        }
        
        // 平滑过渡到目标角度
        let angleDiff = this.state.targetRotation - this.state.rotation;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        this.state.rotation += angleDiff * 0.1; // 使用 0.1 的固定旋转速度

        // 更新 CSS
        const style = this.config.element.style;
        style.setProperty('--x', `${position.x}px`);
        style.setProperty('--y', `${position.y}px`);
        style.setProperty('--rotate', `${this.state.rotation}deg`);

        requestAnimationFrame(this.update);
    }

    tryRandomPulse() {
        if (!this.isPulsing && Math.random() < this.config.pulseChance) {
            this.isPulsing = true;

            const angle = Math.random() * 2 * Math.PI;
            this.state.velocity.x += Math.cos(angle) * this.config.pulseMagnitude;
            this.state.velocity.y += Math.sin(angle) * this.config.pulseMagnitude;

            this.createParticleBurst(this.state.position.x, this.state.position.y);

            setTimeout(() => {
                this.isPulsing = false;
            }, this.config.pulseDuration);
        }
    }

    createParticleBurst(x, y) {
        for (let i = 0; i < this.config.particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            const randomColor = this.config.particleColors[Math.floor(Math.random() * this.config.particleColors.length)];
            particle.style.backgroundColor = randomColor;

            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * this.config.particleSpread;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            const endScale = Math.random() * 0.5;

            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.setProperty('--transform-end', `translate(${endX}px, ${endY}px) scale(${endScale})`);

            this.config.particleContainer.appendChild(particle);

            particle.addEventListener('animationend', () => {
                particle.remove();
            });
        }
    }

    destroy() {
        // ... (destroy logic)
    }
}

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    const cursor = new SmoothCursor();
});
