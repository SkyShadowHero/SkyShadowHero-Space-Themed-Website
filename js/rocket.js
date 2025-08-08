/**
 * SmoothCursor - The Definitive & Mobile-Ready Edition
 * This is the final, complete, and stable version, incorporating all fixes and enhancements.
 * It ensures correct orientation, stable physics, all visual effects, and full mobile/touch compatibility.
 *
 * @author Manus
 * @version 15.0.0 (Final Complete Code)
 */
class SmoothCursor {
    constructor(options = {}) {
        this.config = {
            cursor: document.querySelector('#smooth-cursor'),
            rotator: document.querySelector('#cursor-rotator'),
            particleContainer: document.querySelector('#particle-container'),
            // 物理参数 (高灵敏度调校)
            stiffness: 0.03,
            damping: 0.85,
            rotationStiffness: 0.2,
            rotationDamping: 0.7,
            // 视觉与校准
            iconAngleCorrection: -45,
            // 粒子参数
            particleLife: 1000,
            particleSize: 3,
            particleColor: 'rgba(255, 220, 100, 0.9)',
            rocketSize: 32,
            particleEmissionCone: 60,
            // 游戏逻辑参数
            particleSpeedThreshold: 30,
            rotationLockThreshold: 0.1,
            boostChance: 0.0015,
            boostDuration: 800,
            boostForce: 25,
            boostParticleBurst: 50,
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

    bindMethods() {
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.update = this.update.bind(this);
    }

    init() {
        // 同时监听桌面鼠标和移动端触摸事件
        window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        window.addEventListener('touchmove', this.handleTouchMove, { passive: true });

        window.addEventListener('load', () => {
            this.config.rotator.style.setProperty('--scale', '1');
        });
        this.update();
    }
    
    // 统一处理坐标更新，兼容鼠标和触摸
    updateMousePosition(x, y) {
        this.state.mouse.x = x;
        this.state.mouse.y = y;
        this.state.isMoving = true;
        clearTimeout(this.state.moveTimeout);
        this.state.moveTimeout = setTimeout(() => {
            this.state.isMoving = false;
        }, 100);
    }

    handleMouseMove(e) {
        this.updateMousePosition(e.clientX, e.clientY);
    }

    handleTouchMove(e) {
        if (e.touches.length > 0) {
            this.updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
        }
    }

    enterBoostMode() {
        if (this.state.mode === 'BOOSTING') return;
        this.state.mode = 'BOOSTING';
        for (let i = 0; i < this.config.boostParticleBurst; i++) {
            this.createParticle(this.config.boostForce * 5, true);
        }
        const boostAngleRad = (this.state.rotation - 90 - this.config.iconAngleCorrection) * (Math.PI / 180);
        this.state.velocity.x += Math.cos(boostAngleRad) * this.config.boostForce;
        this.state.velocity.y += Math.sin(boostAngleRad) * this.config.boostForce;
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
        const physicalAngleRad = Math.atan2(this.state.velocity.y, this.state.velocity.x);
        const baseEmissionAngle = physicalAngleRad + Math.PI;
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
        if (this.state.mode === 'CRUISING' && Math.random() < this.config.boostChance) {
            this.enterBoostMode();
        }

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

        const speed = Math.hypot(this.state.velocity.x, this.state.velocity.y);
        if (speed > this.config.rotationLockThreshold) {
            const physicalAngle = Math.atan2(this.state.velocity.y, this.state.velocity.x) * (180 / Math.PI);
            this.state.targetRotation = physicalAngle + 90 + this.config.iconAngleCorrection;
        }
        
        let angleDiff = this.state.targetRotation - this.state.rotation;
        angleDiff -= Math.round(angleDiff / 360) * 360;
        
        const rotationalForce = angleDiff * this.config.rotationStiffness;
        this.state.rotationVelocity += rotationalForce;
        this.state.rotationVelocity *= this.config.rotationDamping;

        if (!this.state.isMoving && Math.abs(this.state.rotationVelocity) < 0.01) {
            this.state.rotationVelocity = 0;
        }
        
        this.state.rotation += this.state.rotationVelocity;

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
