/**
 * SmoothCursor - The Definitive Rewrite
 * This version uses the professional Popmotion animation library to guarantee
 * a stable and accurate spring simulation, directly translating the original React logic.
 *
 * @author Manus
 * @version 22.0.0 (Definitive Rewrite)
 */
document.addEventListener('DOMContentLoaded', () => {
    // 检查 Popmotion 是否已加载
    if (typeof popmotion === 'undefined') {
        console.error('Popmotion library not found. Make sure it is included.');
        return;
    }

    // --- 1. 元素获取 ---
    const cursorContainer = document.getElementById('smooth-cursor');
    const rotator = document.getElementById('cursor-rotator');

    if (!cursorContainer || !rotator) {
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
    cursorContainer.style.zIndex = '1'; // Z-INDEX 设置为 1
    cursorContainer.style.pointerEvents = 'none';
    cursorContainer.style.willChange = 'transform';
    cursorContainer.style.transform = 'scale(0)';

    rotator.style.willChange = 'transform';
    rotator.style.transformOrigin = 'center center';

    // --- 3. 状态和引用变量 (与原版逻辑一致) ---
    const state = {
        lastMousePos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        velocity: { x: 0, y: 0 },
        lastUpdateTime: Date.now(),
        previousAngle: 0,
        accumulatedRotation: 0,
        scaleTimeout: null,
        iconAngleCorrection: -45, // 补偿 iconfont 的朝向
    };

    // --- 4. 使用 Popmotion 创建弹簧动画 ---
    const springConfig = { stiffness: 400, damping: 45, mass: 1 };
    
    const cursorX = popmotion.spring({ from: window.innerWidth / 2, ...springConfig });
    const cursorY = popmotion.spring({ from: window.innerHeight / 2, ...springConfig });
    const rotation = popmotion.spring({ from: 0, stiffness: 300, damping: 60, mass: 1 });
    const scale = popmotion.spring({ from: 1, stiffness: 500, damping: 35, mass: 1 });

    // --- 5. 核心事件处理 (与原版逻辑一致) ---
    function handleMouseMove(e) {
        const pos = { x: e.clientX, y: e.clientY };
        
        const now = Date.now();
        const delta = (now - state.lastUpdateTime) / 1000; // 转换为秒
        if (delta > 0) {
            state.velocity = {
                x: (pos.x - state.lastMousePos.x) / delta,
                y: (pos.y - state.lastMousePos.y) / delta,
            };
        }
        state.lastUpdateTime = now;
        state.lastMousePos = pos;

        // 驱动弹簧动画到新的目标点
        cursorX.set(pos.x);
        cursorY.set(pos.y);

        const speed = Math.hypot(state.velocity.x, state.velocity.y);

        if (speed > 20) {
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

    // --- 6. 订阅弹簧动画的更新 ---
    cursorX.on('update', (latest) => {
        cursorContainer.style.setProperty('--x', `${latest}px`);
        updateTransform();
    });
    cursorY.on('update', (latest) => {
        cursorContainer.style.setProperty('--y', `${latest}px`);
        updateTransform();
    });
    rotation.on('update', (latest) => {
        rotator.style.setProperty('--rotate', `${latest}deg`);
        updateTransform();
    });
    scale.on('update', (latest) => {
        rotator.style.setProperty('--scale', `${latest}`);
        updateTransform();
    });

    // --- 7. 统一更新 Transform 样式 ---
    function updateTransform() {
        const x = cursorContainer.style.getPropertyValue('--x') || '0px';
        const y = cursorContainer.style.getPropertyValue('--y') || '0px';
        const r = rotator.style.getPropertyValue('--rotate') || '0deg';
        const s = rotator.style.getPropertyValue('--scale') || '1';

        cursorContainer.style.transform = `translate(${x}, ${y}) translate(-50%, -50%)`;
        rotator.style.transform = `rotate(${r}) scale(${s})`;
    }

    // --- 8. 启动 ---
    window.addEventListener('mousemove', handleMouseMove);
    cursorContainer.style.transform = 'scale(1)';
    // 初始设置
    updateTransform();
});
