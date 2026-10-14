function animateLoop(now) {
    const loopStart = performance.now();
    const dtSeconds = Math.min(0.1, (now - lastSimTick) / 1000);
    lastSimTick = now;

    const t0 = performance.now();
    updateSimulationLogic(dtSeconds);
    const t1 = performance.now();
    updateFishPhysics(dtSeconds);
    const t2 = performance.now();

    if (state.renderMode === '3d' && typeof renderAquarium3D === 'function') {
        renderAquarium3D(now);
    } else {
        renderAquarium(now);
    }
    const t3 = performance.now();

    profilerMetrics.simTimeMs = t1 - t0;
    profilerMetrics.physicsTimeMs = t2 - t1;
    profilerMetrics.renderTimeMs = t3 - t2;
    profilerMetrics.totalLoopMs = t3 - loopStart;

    requestAnimationFrame(animateLoop);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    if (typeof invalidateBgGradients === 'function') invalidateBgGradients();
});

window.onload = function () {
    resizeCanvas();
    initAmbientParticles();
    loadGame();
    if (typeof initQuestsState === 'function') initQuestsState();
    updateHUD();
    const theme = LIGHT_THEMES[state.lightThemeIndex || 0];
    document.getElementById('light-theme-label').textContent = theme.name;
    lastSimTick = performance.now();

    // Async initialization for ES module 3D Engine
    const targetMode = state.renderMode || '3d';
    const check3DReady = setInterval(() => {
        if (typeof initThreeScene === 'function' && typeof setRenderMode === 'function') {
            clearInterval(check3DReady);
            setRenderMode(targetMode);
        }
    }, 40);

    requestAnimationFrame(animateLoop);
};
