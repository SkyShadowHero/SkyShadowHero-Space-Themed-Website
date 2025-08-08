/**
 * SmoothCursor - The Definitive & Final Working Edition (Lerp-Based)
 * This version replaces the faulty spring simulation with a robust Linear Interpolation (Lerp) model
 * to definitively fix the "not moving" bug, while retaining all features.
 *
 * @author Manus
 * @version 20.0.0 (Definitive Lerp Fix)
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 元素获取 ---
    const cursorContainer = document.getElementById('smooth-cursor');
    const rotator = document.getElementById('cursor-rotator');
    const particleContainer = document.getElementById('particle-container');

    if (!cursorContainer || !rotator || !particleContainer) {
        console.error("Cursor elements not found!");
        return;
    }

    // --- 2. 动态应用样式 ---
    document.body.style.cursor = 'none';
    document.body.style.fontFamily = 'sans-serif';
    document.body.style.textAlign = 'center';
    document.body.style.padding = '2rem';
    document.body.style.backgroundColor = '#f0f0f0';

    cursorContainer.style.position = 'fixed';
    cursorContainer.style.top = '0';
    cursorContainer.style.left = '0';
    cursorContainer.style.zIndex = '1';
    cursorContainer.style.pointerEvents = 'none';
    cursorContainer.style.willChange = 'transform';
    cursorContainer.style.transform = 'scale(0)';

    rotator.style.willChange = 'transform';
    rotator.style.transformOrigin = 'center center';

    particleContainer.style.position = 'absolute';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.transformOrigin = 'center center';

    // --- 3. 状态和核心变量 ---
    const state = {
        mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        cursor: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        velocity: { x: 0, y: 0 },
        rotation: 0,
        scale: 1,
        mode: 'CRUISING',
        lastUpdateTime: Date.now(),
        iconAngleCorrection: -45,
        boostTimeout: null,
        scaleTimeout: null,
    };

    // --- 4. 粒子系统 (保持不变) ---
    const particles = [];
    function createParticle(velocity, isBurst = false) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.backgroundColor = 'rgba(255, 220, 100, 0.9)';
        particle.style.borderRadius = '50%';
        particleContainer.appendChild(particle);

        const speed = Math.hypot(velocity.x, velocity.y);
        const physicalAngleRad = Math.atan2(velocity.y, velocity.x);
        const baseEmissionAngle = physicalAngleRad + Math.PI;
        const coneAngleRad = 60 * (Math.PI / 180);
        const randomAngleOffset = (Math.random() - 0.5) * coneAngleRad;
        const finalEmissionAngle = baseEmissionAngle + randomAngleOffset;

        let emissionSpeed = speed * 0.5 + Math.random();
        if (isBurst) {
            emissionSpeed = (Math.random() * 0.5 + 0.5) * speed * 2;
        }

        particles.push({
            element: particle, x: 0, y: 16,
            vx: Math.cos(finalEmissionAngle) * emissionSpeed,
            vy: Math.sin(finalEmissionAngle) * emissionSpeed,
            life: 1000, createdAt: Date.now(),
        });
    }

    function updateParticles() {
        const now = Date.now();
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const age = now - p.createdAt;
            if (age > p.life) {
                p.element.remove();
                particles.splice(i, 1);
                continue;
            }
            p.x += p.vx;
            p.y += p.vy;
            p.element.style.opacity = 1 - (age / p.life);
            p.element.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
        }
    }

    // --- 5. 事件监听 ---
    window.addEventListener('mousemove', (e) => {
        state.mouse.x = e.clientX;
        state.mouse.y = e.clientY;
    });

    // --- 6. 核心动画循环 (全新逻辑) ---
    function animate() {
        const now = Date.now();
        const delta = now - state.lastUpdateTime;
        state.lastUpdateTime = now;

        // --- 移动逻辑 (Lerp) ---
        if (state.mode === 'CRUISING') {
            const lastX = state.cursor.x;
            const lastY = state.cursor.y;

            // 使用线性插值平滑地移动光标
            state.cursor.x += (state.mouse.x - state.cursor.x) * 0.15; // 0.15 是平滑系数
            state.cursor.y += (state.mouse.y - state.cursor.y) * 0.15;

            // 根据位置变化计算速度
            if (delta > 0) {
                state.velocity.x = (state.cursor.x - lastX) / delta;
                state.velocity.y = (state.cursor.y - lastY) / delta;
            }
        } else { // BOOSTING 模式
            // 在加速模式下，只受惯性影响，逐渐减速
            state.cursor.x += state.velocity.x * delta;
            state.cursor.y += state.velocity.y * delta;
            state.velocity.x *= 0.98; // 阻尼
            state.velocity.y *= 0.98;
        }

        // --- 旋转逻辑 ---
        const speed = Math.hypot(state.velocity.x, state.velocity.y);
        if (speed > 0.01) {
            const physicalAngle = Math.atan2(state.velocity.y, state.velocity.x) * (180 / Math.PI);
            const targetRotation = physicalAngle + 90 + state.iconAngleCorrection;
            // 使用 Lerp 平滑旋转
            let diff = targetRotation - state.rotation;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            state.rotation += diff * 0.1; // 0.1 是旋转平滑系数
        }

        // --- 缩放和粒子逻辑 ---
        if (speed > 0.1) {
            state.scale = 0.95;
            clearTimeout(state.scaleTimeout);
            state.scaleTimeout = setTimeout(() => { state.scale = 1; }, 150);
            if (state.mode === 'CRUISING' && Math.random() < 0.5) {
                createParticle(state.velocity);
            }
        }

        // --- 加速逻辑 ---
        if (state.mode === 'CRUISING' && Math.random() < 0.002) {
            state.mode = 'BOOSTING';
            for (let i = 0; i < 80; i++) {
                createParticle(state.velocity, true);
            }
            const boostAngleRad = (state.rotation - 90 - state.iconAngleCorrection) * (Math.PI / 180);
            const boostForce = 0.5; // 调整冲力单位
            state.velocity.x += Math.cos(boostAngleRad) * boostForce;
            state.velocity.y += Math.sin(boostAngleRad) * boostForce;
            
            clearTimeout(state.boostTimeout);
            state.boostTimeout = setTimeout(() => {
                state.mode = 'CRUISING';
            }, 800);
        }

        // --- 应用样式 ---
        updateParticles();
        cursorContainer.style.transform = `translate(${state.cursor.x}px, ${state.cursor.y}px) translate(-50%, -50%)`;
        rotator.style.transform = `rotate(${state.rotation}deg) scale(${state.scale})`;

        requestAnimationFrame(animate);
    }

    // --- 7. 启动 ---
    cursorContainer.style.transform = 'scale(1)';
    animate();
});

    particleContainer.style.position = 'absolute';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.transformOrigin = 'center center';

    // --- 3. 自定义弹簧物理模拟 ---
    function createSpring(initialValue, config) {
        let value = initialValue;
        let velocity = 0;
        let target = initialValue;
        return {
            set: (newValue) => { target = newValue; },
            get: () => value,
            update: () => {
                const tension = target - value;
                const dampingForce = -config.damping * velocity;
                const acceleration = (tension * config.stiffness) + dampingForce;
                velocity += acceleration;
                value += velocity;
            }
        };
    }

    // --- 4. 初始化弹簧状态 ---
    const cursorX = createSpring(window.innerWidth / 2, { stiffness: 0.05, damping: 0.75 });
    const cursorY = createSpring(window.innerHeight / 2, { stiffness: 0.05, damping: 0.75 });
    const rotation = createSpring(0, { stiffness: 0.05, damping: 0.6 });
    const scale = createSpring(1, { stiffness: 0.1, damping: 0.6 });

    // --- 5. 状态和引用变量 ---
    const state = {
        lastMousePos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        velocity: { x: 0, y: 0 },
        lastUpdateTime: Date.now(),
        previousAngle: 0,
        accumulatedRotation: 0,
        mode: 'CRUISING',
        scaleTimeout: null,
        boostTimeout: null,
        iconAngleCorrection: -45,
    };

    // --- 6. 粒子系统 ---
    const particles = [];
    function createParticle(velocity, isBurst = false) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.backgroundColor = 'rgba(255, 220, 100, 0.9)';
        particle.style.borderRadius = '50%';
        particleContainer.appendChild(particle);

        const speed = Math.hypot(velocity.x, velocity.y);
        const physicalAngleRad = Math.atan2(velocity.y, velocity.x);
        const baseEmissionAngle = physicalAngleRad + Math.PI;
        const coneAngleRad = 60 * (Math.PI / 180);
        const randomAngleOffset = (Math.random() - 0.5) * coneAngleRad;
        const finalEmissionAngle = baseEmissionAngle + randomAngleOffset;

        let emissionSpeed = speed * 0.5 + Math.random();
        if (isBurst) {
            emissionSpeed = (Math.random() * 0.5 + 0.5) * speed * 2;
        }

        particles.push({
            element: particle, x: 0, y: 16,
            vx: Math.cos(finalEmissionAngle) * emissionSpeed,
            vy: Math.sin(finalEmissionAngle) * emissionSpeed,
            life: 1000, createdAt: Date.now(),
        });
    }

    function updateParticles() {
        const now = Date.now();
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const age = now - p.createdAt;
            if (age > p.life) {
                p.element.remove();
                particles.splice(i, 1);
                continue;
            }
            p.x += p.vx;
            p.y += p.vy;
            p.element.style.opacity = 1 - (age / p.life);
            p.element.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
        }
    }

    // --- 7. 核心事件处理和动画循环 ---
    function handleMouseMove(e) {
        if (state.mode === 'BOOSTING') return;

        const pos = { x: e.clientX, y: e.clientY };
        
        // --- 核心修正: 所有与鼠标直接相关的计算都必须在这里 ---
        const now = Date.now();
        const delta = now - state.lastUpdateTime;
        if (delta > 0) {
            state.velocity = {
                x: (pos.x - state.lastMousePos.x) / delta,
                y: (pos.y - state.lastMousePos.y) / delta,
            };
        }
        state.lastUpdateTime = now;
        state.lastMousePos = pos;

        // 更新弹簧目标
        cursorX.set(pos.x);
        cursorY.set(pos.y);

        const speed = Math.hypot(state.velocity.x, state.velocity.y);
        if (state.mode === 'CRUISING' && speed > 5) {
            if (Math.random() < 0.5) {
                createParticle(state.velocity);
            }
        }

        if (speed > 0.1) {
            const physicalAngle = Math.atan2(state.velocity.y, state.velocity.x) * (180 / Math.PI);
            const targetAngle = physicalAngle + 90 + state.iconAngleCorrection;
            
            let diff = targetAngle - state.previousAngle;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            state.accumulatedRotation += diff;
            state.previousAngle = targetAngle;
            
            rotation.set(state.accumulatedRotation);
            
            scale.set(0.95);
            clearTimeout(state.scaleTimeout);
            state.scaleTimeout = setTimeout(() => scale.set(1), 150);
        }
    }

    function boostLogic() {
        if (state.mode === 'CRUISING' && Math.random() < 0.002) {
            state.mode = 'BOOSTING';
            for (let i = 0; i < 80; i++) {
                createParticle(state.velocity, true);
            }
            const boostAngleRad = (rotation.get() - 90 - state.iconAngleCorrection) * (Math.PI / 180);
            const boostForce = 25;
            cursorX.set(cursorX.get() + Math.cos(boostAngleRad) * boostForce * 10);
            cursorY.set(cursorY.get() + Math.sin(boostAngleRad) * boostForce * 10);
            
            clearTimeout(state.boostTimeout);
            state.boostTimeout = setTimeout(() => {
                state.mode = 'CRUISING';
            }, 800);
        }
    }

    function animate() {
        // 更新所有弹簧的状态
        cursorX.update();
        cursorY.update();
        rotation.update();
        scale.update();
        
        // 更新粒子和游戏逻辑
        updateParticles();
        boostLogic();

        // 将弹簧的计算结果应用到样式上
        cursorContainer.style.transform = `translate(${cursorX.get()}px, ${cursorY.get()}px) translate(-50%, -50%)`;
        rotator.style.transform = `rotate(${rotation.get()}deg) scale(${scale.get()})`;
        
        requestAnimationFrame(animate);
    }

    // --- 8. 启动 ---
    window.addEventListener('mousemove', handleMouseMove);
    cursorContainer.style.transform = 'scale(1)';
    animate();
});
    particleContainer.style.position = 'absolute';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.transformOrigin = 'center center';

    // --- 3. 自定义弹簧物理模拟 ---
    function createSpring(initialValue, config) {
        let value = initialValue;
        let velocity = 0;
        let target = initialValue;
        return {
            set: (newValue) => { target = newValue; },
            get: () => value,
            update: () => {
                const tension = target - value;
                const dampingForce = -config.damping * velocity;
                const acceleration = (tension * config.stiffness) + dampingForce;
                velocity += acceleration;
                value += velocity;
            }
        };
    }

    // --- 4. 初始化弹簧状态 ---
    const cursorX = createSpring(window.innerWidth / 2, { stiffness: 0.05, damping: 0.75 });
    const cursorY = createSpring(window.innerHeight / 2, { stiffness: 0.05, damping: 0.75 });
    const rotation = createSpring(0, { stiffness: 0.05, damping: 0.6 });
    const scale = createSpring(1, { stiffness: 0.1, damping: 0.6 });

    // --- 5. 状态和引用变量 ---
    const state = {
        lastMousePos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        velocity: { x: 0, y: 0 },
        lastUpdateTime: Date.now(),
        previousAngle: 0,
        accumulatedRotation: 0,
        mode: 'CRUISING',
        scaleTimeout: null,
        boostTimeout: null,
        iconAngleCorrection: -45,
    };

    // --- 6. 粒子系统 ---
    const particles = [];
    function createParticle(velocity, isBurst = false) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.backgroundColor = 'rgba(255, 220, 100, 0.9)';
        particle.style.borderRadius = '50%';
        particleContainer.appendChild(particle);

        const speed = Math.hypot(velocity.x, velocity.y);
        const physicalAngleRad = Math.atan2(velocity.y, velocity.x);
        const baseEmissionAngle = physicalAngleRad + Math.PI;
        const coneAngleRad = 60 * (Math.PI / 180);
        const randomAngleOffset = (Math.random() - 0.5) * coneAngleRad;
        const finalEmissionAngle = baseEmissionAngle + randomAngleOffset;

        let emissionSpeed = speed * 0.5 + Math.random();
        if (isBurst) {
            emissionSpeed = (Math.random() * 0.5 + 0.5) * speed * 2;
        }

        particles.push({
            element: particle, x: 0, y: 16,
            vx: Math.cos(finalEmissionAngle) * emissionSpeed,
            vy: Math.sin(finalEmissionAngle) * emissionSpeed,
            life: 1000, createdAt: Date.now(),
        });
    }

    function updateParticles() {
        const now = Date.now();
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const age = now - p.createdAt;
            if (age > p.life) {
                p.element.remove();
                particles.splice(i, 1);
                continue;
            }
            p.x += p.vx;
            p.y += p.vy;
            p.element.style.opacity = 1 - (age / p.life);
            p.element.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
        }
    }

    // --- 7. 核心事件处理和动画循环 ---
    function handleMouseMove(e) {
        if (state.mode === 'BOOSTING') return;

        const pos = { x: e.clientX, y: e.clientY };
        
        const now = Date.now();
        const delta = now - state.lastUpdateTime;
        if (delta > 0) {
            state.velocity = {
                x: (pos.x - state.lastMousePos.x) / delta,
                y: (pos.y - state.lastMousePos.y) / delta,
            };
        }
        state.lastUpdateTime = now;
        state.lastMousePos = pos;

        cursorX.set(pos.x);
        cursorY.set(pos.y);

        const speed = Math.hypot(state.velocity.x, state.velocity.y);
        if (state.mode === 'CRUISING' && speed > 5) {
            // 增加巡航时的粒子密度
            if (Math.random() < 0.5) { // 50%的几率在快速移动时产生粒子
                createParticle(state.velocity);
            }
        }

        if (speed > 0.1) {
            const physicalAngle = Math.atan2(state.velocity.y, state.velocity.x) * (180 / Math.PI);
            const targetAngle = physicalAngle + 90 + state.iconAngleCorrection;
            
            let diff = targetAngle - state.previousAngle;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            state.accumulatedRotation += diff;
            state.previousAngle = targetAngle;
            
            rotation.set(state.accumulatedRotation);
            
            scale.set(0.95);
            clearTimeout(state.scaleTimeout);
            state.scaleTimeout = setTimeout(() => scale.set(1), 150);
        }
    }

    function boostLogic() {
        // <--- 改动点: 加速概率从 0.01 (1%) 降低到 0.002 (0.2%)
        if (state.mode === 'CRUISING' && Math.random() < 0.002) {
            state.mode = 'BOOSTING';
            // <--- 改动点: 爆发粒子从 50 增加到 80
            for (let i = 0; i < 80; i++) {
                createParticle(state.velocity, true);
            }
            const boostAngleRad = (rotation.get() - 90 - state.iconAngleCorrection) * (Math.PI / 180);
            const boostForce = 25;
            cursorX.set(cursorX.get() + Math.cos(boostAngleRad) * boostForce * 10);
            cursorY.set(cursorY.get() + Math.sin(boostAngleRad) * boostForce * 10);
            
            clearTimeout(state.boostTimeout);
            state.boostTimeout = setTimeout(() => {
                state.mode = 'CRUISING';
            }, 800);
        }
    }

    function animate() {
        cursorX.update();
        cursorY.update();
        rotation.update();
        scale.update();
        updateParticles();
        boostLogic();

        cursorContainer.style.transform = `translate(${cursorX.get()}px, ${cursorY.get()}px) translate(-50%, -50%)`;
        rotator.style.transform = `rotate(${rotation.get()}deg) scale(${scale.get()})`;
        
        requestAnimationFrame(animate);
    }

    // --- 8. 启动 ---
    window.addEventListener('mousemove', handleMouseMove);
    cursorContainer.style.transform = 'scale(1)';
    animate();
});

    particleContainer.style.position = 'absolute';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.transformOrigin = 'center center';

    // --- 3. 自定义弹簧物理模拟 ---
    function createSpring(initialValue, config) {
        let value = initialValue;
        let velocity = 0;
        let target = initialValue;
        return {
            set: (newValue) => { target = newValue; },
            get: () => value,
            update: () => {
                const tension = target - value;
                const dampingForce = -config.damping * velocity;
                const acceleration = (tension * config.stiffness) + dampingForce;
                velocity += acceleration;
                value += velocity;
            }
        };
    }

    // --- 4. 初始化弹簧状态 ---
    const cursorX = createSpring(window.innerWidth / 2, { stiffness: 0.05, damping: 0.75 });
    const cursorY = createSpring(window.innerHeight / 2, { stiffness: 0.05, damping: 0.75 });
    const rotation = createSpring(0, { stiffness: 0.05, damping: 0.6 });
    const scale = createSpring(1, { stiffness: 0.1, damping: 0.6 });

    // --- 5. 状态和引用变量 ---
    const state = {
        lastMousePos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        velocity: { x: 0, y: 0 },
        lastUpdateTime: Date.now(),
        previousAngle: 0,
        accumulatedRotation: 0,
        mode: 'CRUISING',
        scaleTimeout: null,
        boostTimeout: null,
        iconAngleCorrection: -45, // <-- 核心修正: 补偿 iconfont 的朝向
    };

    // --- 6. 粒子系统 ---
    const particles = [];
    function createParticle(velocity, isBurst = false) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.backgroundColor = 'rgba(255, 220, 100, 0.9)';
        particle.style.borderRadius = '50%';
        particleContainer.appendChild(particle);

        const speed = Math.hypot(velocity.x, velocity.y);
        const physicalAngleRad = Math.atan2(velocity.y, velocity.x);
        const baseEmissionAngle = physicalAngleRad + Math.PI;
        const coneAngleRad = 60 * (Math.PI / 180);
        const randomAngleOffset = (Math.random() - 0.5) * coneAngleRad;
        const finalEmissionAngle = baseEmissionAngle + randomAngleOffset;

        let emissionSpeed = speed * 0.5 + Math.random();
        if (isBurst) {
            emissionSpeed = (Math.random() * 0.5 + 0.5) * speed * 2;
        }

        particles.push({
            element: particle, x: 0, y: 16, // 从火箭中心点下方发射 (1rem = 16px)
            vx: Math.cos(finalEmissionAngle) * emissionSpeed,
            vy: Math.sin(finalEmissionAngle) * emissionSpeed,
            life: 1000, createdAt: Date.now(),
        });
    }

    function updateParticles() {
        const now = Date.now();
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const age = now - p.createdAt;
            if (age > p.life) {
                p.element.remove();
                particles.splice(i, 1);
                continue;
            }
            p.x += p.vx;
            p.y += p.vy;
            p.element.style.opacity = 1 - (age / p.life);
            p.element.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
        }
    }

    // --- 7. 核心事件处理和动画循环 ---
    function handleMouseMove(e) {
        if (state.mode === 'BOOSTING') return;

        const pos = { x: e.clientX, y: e.clientY };
        
        const now = Date.now();
        const delta = now - state.lastUpdateTime;
        if (delta > 0) {
            state.velocity = {
                x: (pos.x - state.lastMousePos.x) / delta,
                y: (pos.y - state.lastMousePos.y) / delta,
            };
        }
        state.lastUpdateTime = now;
        state.lastMousePos = pos;

        cursorX.set(pos.x);
        cursorY.set(pos.y);

        const speed = Math.hypot(state.velocity.x, state.velocity.y);
        if (state.mode === 'CRUISING' && speed > 5) {
            createParticle(state.velocity);
        }

        if (speed > 0.1) {
            // --- 旋转逻辑 (包含最终校准) ---
            const physicalAngle = Math.atan2(state.velocity.y, state.velocity.x) * (180 / Math.PI);
            const targetAngle = physicalAngle + 90 + state.iconAngleCorrection;
            
            // 使用最短路径进行旋转
            let diff = targetAngle - state.previousAngle;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            state.accumulatedRotation += diff;
            state.previousAngle = targetAngle; // 更新为目标角度
            
            rotation.set(state.accumulatedRotation);
            
            scale.set(0.95);
            clearTimeout(state.scaleTimeout);
            state.scaleTimeout = setTimeout(() => scale.set(1), 150);
        }
    }

    function boostLogic() {
        if (state.mode === 'CRUISING' && Math.random() < 0.01) {
            state.mode = 'BOOSTING';
            for (let i = 0; i < 50; i++) {
                createParticle(state.velocity, true);
            }
            const boostAngleRad = (rotation.get() - 90 - state.iconAngleCorrection) * (Math.PI / 180);
            const boostForce = 25;
            cursorX.set(cursorX.get() + Math.cos(boostAngleRad) * boostForce * 10);
            cursorY.set(cursorY.get() + Math.sin(boostAngleRad) * boostForce * 10);
            
            clearTimeout(state.boostTimeout);
            state.boostTimeout = setTimeout(() => {
                state.mode = 'CRUISING';
            }, 800);
        }
    }

    function animate() {
        cursorX.update();
        cursorY.update();
        rotation.update();
        scale.update();
        updateParticles();
        boostLogic();

        cursorContainer.style.transform = `translate(${cursorX.get()}px, ${cursorY.get()}px) translate(-50%, -50%)`;
        rotator.style.transform = `rotate(${rotation.get()}deg) scale(${scale.get()})`;
        
        requestAnimationFrame(animate);
    }

    // --- 8. 启动 ---
    window.addEventListener('mousemove', handleMouseMove);
    cursorContainer.style.transform = 'scale(1)';
    animate();
});
