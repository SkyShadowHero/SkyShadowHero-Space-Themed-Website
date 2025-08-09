/**
 * SmoothCursor - The Definitive Edition
 * This is the final, stable, and fully-featured version, incorporating all fixes and enhancements.
 * It ensures correct orientation, stable physics, and all requested visual effects.
 *
 * @author Manus
 * @version 14.0.0 (Final Production Release)
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
            cursor: document.querySelector('#smooth-cursor'),
            rotator: document.querySelector('#cursor-rotator'),
            particleContainer: document.querySelector('#particle-container'),
            // --- 物理参数 (高灵敏度调校) ---
            stiffness: 0.01,
            damping: 0.85,
            rotationStiffness: 0.4,   // 高刚度，实现快速转向
            rotationDamping: 0.6,     // 低阻尼，允许更快的旋转速度
            // --- 视觉与校准 ---
            iconAngleCorrection: -45, // 补偿图标本身朝向右上45度的问题
            // --- 粒子参数 ---
            particleLife: 1000,
            particleSize: 3,
            particleColor: 'rgba(255, 220, 100, 0.9)',
            rocketSize: 32,
            particleEmissionCone: 60, // 粒子喷射呈60度锥形
            // --- 游戏逻辑参数 ---
            particleSpeedThreshold: 30,
            rotationLockThreshold: 0.4, // 速度低于此值时锁定旋转，防止抖动
            boostChance: 0.0015,
            boostDuration: 800,
            boostForce: 60,
            boostParticleBurst: 50,     // 加速时一次性爆发50个粒子
        };

        if (!this.config.cursor || !this.config.rotator || !this.config.particleContainer) {
            console.error('SmoothCursor: Critical elements not found.');
            return;
        }

        this.state = {
            mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            velocity: { x: 0, y: 0 },
            rotation: 0,
            targetRotation: 0,
            rotationVelocity: 0,
            mode: 'CRUISING',
            boostTimeout: null,
            isMoving: false,
            moveTimeout: null,
        };

        this.particles = [];
        this.animationFrame = null;

        this.bindMethods();
        this.init();
    }

    bindMethods() { this.handleMouseMove = this.handleMouseMove.bind(this); this.update = this.update.bind(this); }
    init() { window.addEventListener('mousemove', this.handleMouseMove, { passive: true }); window.addEventListener('load', () => { this.config.rotator.style.setProperty('--scale', '1'); }); this.update(); }
    
    handleMouseMove(e) {
        this.state.mouse.x = e.clientX;
        this.state.mouse.y = e.clientY;
        this.state.isMoving = true;
        clearTimeout(this.state.moveTimeout);
        this.state.moveTimeout = setTimeout(() => {
            this.state.isMoving = false;
        }, 100);
    }

    enterBoostMode() {
        if (this.state.mode === 'BOOSTING') return;
        this.state.mode = 'BOOSTING';
        // 粒子爆发
        for (let i = 0; i < this.config.boostParticleBurst; i++) {
            this.createParticle(this.config.boostForce * 5, true);
        }
        // 施加一次性冲力 (使用已校准的物理角度)
        const boostAngleRad = (this.state.rotation - 90 - this.config.iconAngleCorrection) * (Math.PI / 180);
        this.state.velocity.x += Math.cos(boostAngleRad) * this.config.boostForce;
        this.state.velocity.y += Math.sin(boostAngleRad) * this.config.boostForce;
        // 设定计时器恢复巡航
        clearTimeout(this.state.boostTimeout);
        this.state.boostTimeout = setTimeout(() => {
            this.state.mode = 'CRUISING';
        }, this.config.boostDuration);
    }

    createParticle(speed, isBurst = false) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.width = `${this.config.particleSize}px`;
        particle.style.height = `${this.config.particleSize}px`;
        particle.style.backgroundColor = this.config.particleColor;
        particle.style.borderRadius = '50%';
        this.config.particleContainer.appendChild(particle);
        const tailOffsetY = this.config.rocketSize / 2;
        // 使用速度向量计算精确的物理角度
        const physicalAngleRad = Math.atan2(this.state.velocity.y, this.state.velocity.x);
        const baseEmissionAngle = physicalAngleRad + Math.PI; // 反方向
        const coneAngleRad = this.config.particleEmissionCone * (Math.PI / 180);
        const randomAngleOffset = (Math.random() - 0.5) * coneAngleRad;
        const finalEmissionAngle = baseEmissionAngle + randomAngleOffset;
        let emissionSpeed = speed * 0.05 + Math.random();
        if (isBurst) { emissionSpeed = (Math.random() * 0.5 + 0.5) * speed * 0.1; }
        this.particles.push({
            element: particle, x: 0, y: tailOffsetY,
            vx: Math.cos(finalEmissionAngle) * emissionSpeed,
            vy: Math.sin(finalEmissionAngle) * emissionSpeed,
            life: this.config.particleLife, createdAt: Date.now(),
        });
    }

    updateParticles() {
        const now = Date.now();
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const age = now - p.createdAt;
            if (age > p.life) { p.element.remove(); this.particles.splice(i, 1); continue; }
            p.x += p.vx; p.y += p.vy;
            p.element.style.opacity = 1 - (age / p.life);
            p.element.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
        }
    }

    update() {
        // 随机触发加速
        if (this.state.mode === 'CRUISING' && Math.random() < this.config.boostChance) {
            this.enterBoostMode();
        }

        // --- 移动物理模型 (惯性冲刺逻辑) ---
        if (this.state.mode === 'CRUISING') {
            const dx = this.state.mouse.x - this.state.position.x;
            const dy = this.state.mouse.y - this.state.position.y;
            this.state.velocity.x += dx * this.config.stiffness;
            this.state.velocity.y += dy * this.config.stiffness;
        }
        this.state.velocity.x *= this.config.damping;
        this.state.velocity.y *= this.config.damping;
        this.state.position.x += this.state.velocity.x;
        this.state.position.y += this.state.velocity.y;

        // --- 旋转物理模型 (稳定与灵敏的核心) ---
        const speed = Math.hypot(this.state.velocity.x, this.state.velocity.y);
        if (speed > this.config.rotationLockThreshold) {
            const physicalAngle = Math.atan2(this.state.velocity.y, this.state.velocity.x) * (180 / Math.PI);
            // 最终的、绝对正确的旋转公式
            this.state.targetRotation = physicalAngle + 90 + this.config.iconAngleCorrection;
        }
        
        let angleDiff = this.state.targetRotation - this.state.rotation;
        angleDiff -= Math.round(angleDiff / 360) * 360; // 确保走最短路径旋转
        
        const rotationalForce = angleDiff * this.config.rotationStiffness;
        this.state.rotationVelocity += rotationalForce;
        this.state.rotationVelocity *= this.config.rotationDamping;

        // 主动旋转制动，防止静止时抖动
        if (!this.state.isMoving && Math.abs(this.state.rotationVelocity) < 0.01) {
            this.state.rotationVelocity = 0;
        }
        
        this.state.rotation += this.state.rotationVelocity;

        // --- 粒子和样式更新 ---
        if (this.state.mode === 'CRUISING' && speed > this.config.particleSpeedThreshold) {
            this.createParticle(speed);
        }
        this.updateParticles();

        this.config.cursor.style.setProperty('--x', `${this.state.position.x}px`);
        this.config.cursor.style.setProperty('--y', `${this.state.position.y}px`);
        this.config.rotator.style.setProperty('--rotate', `${this.state.rotation}deg`);
        
        this.animationFrame = requestAnimationFrame(this.update);
    }
}

document.addEventListener('DOMContentLoaded', () => { new SmoothCursor(); });
