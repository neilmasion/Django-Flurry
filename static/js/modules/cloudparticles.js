export function setupCloudParticles() {
    const canvas = document.getElementById('cloudCanvas');
    if (!canvas) return;

    let ctx;
    try {
        ctx = canvas.getContext('2d');
        if (!ctx) return;
    } catch (e) { return; }

    // ── Theme helper ─────────────────────────────────────────────────────────────
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    // ── Resize ───────────────────────────────────────────────────────────────────
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initStars();
        initClouds();
    }
    window.addEventListener('resize', resize);

    // ── Stars (dark mode only) ────────────────────────────────────────────────────
    let stars = [];
    function initStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 7000);
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.65,
                r: 0.5 + Math.random() * 1.0,
                alpha: 0.3 + Math.random() * 0.7,
                twinkle: 0.001 + Math.random() * 0.004,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    function drawStars(t) {
        if (!isDark()) return;
        stars.forEach(s => {
            const a = s.alpha * (0.4 + 0.6 * Math.sin(t * s.twinkle * 60 + s.phase));
            ctx.save();
            ctx.globalAlpha = a;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // ── Clouds (3-Layer Parallax) ────────────────────────────────────────────────
    let clouds = [];
    const CLOUD_LAYERS = [
        { count: 5, alphaMin: 0.40, alphaMax: 0.75, speedMin: 0.28, speedMax: 0.48, yRange: [0.75, 0.95], label: 'Foreground' },
        { count: 7, alphaMin: 0.18, alphaMax: 0.35, speedMin: 0.12, speedMax: 0.22, yRange: [0.65, 0.85], label: 'Midground' },
        { count: 10, alphaMin: 0.05, alphaMax: 0.15, speedMin: 0.06, speedMax: 0.12, yRange: [0.55, 0.75], label: 'Background' }
    ];

    function makePuffs(baseR) {
        const puffs = [];
        const count = 7 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
            puffs.push({
                ox: (Math.random() - 0.5) * baseR * 2.3,
                oy: (Math.random() - 0.4) * baseR * 1.3,
                r: baseR * (0.55 + Math.random() * 0.75)
            });
        }
        return puffs;
    }

    function makeCloud(layer, startAnywhere) {
        const baseR = 45 + Math.random() * 85;
        const x = startAnywhere ? Math.random() * (canvas.width + 500) - 250 : -baseR * 4;
        return {
            x: x,
            y: (layer.yRange[0] + Math.random() * (layer.yRange[1] - layer.yRange[0])) * canvas.height,
            baseR: baseR,
            speed: layer.speedMin + Math.random() * (layer.speedMax - layer.speedMin),
            puffs: makePuffs(baseR),
            alpha: layer.alphaMin + Math.random() * (layer.alphaMax - layer.alphaMin),
            layerIndex: CLOUD_LAYERS.indexOf(layer)
        };
    }

    function initClouds() {
        clouds = [];
        CLOUD_LAYERS.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                clouds.push(makeCloud(layer, true));
            }
        });
        clouds.sort((a, b) => b.layerIndex - a.layerIndex);
    }

    function drawCloud(c) {
        const dark = isDark();
        ctx.save();
        ctx.globalAlpha = dark ? c.alpha * 0.65 : c.alpha;

        c.puffs.forEach(p => {
            const px = c.x + p.ox;
            const py = c.y + p.oy;
            const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r);
            if (dark) {
                grad.addColorStop(0, 'rgba(20, 45, 90, 1)');
                grad.addColorStop(0.6, 'rgba(12, 25, 60, 0.8)');
                grad.addColorStop(1, 'rgba(5, 12, 35, 0)');
            } else {
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.5, 'rgba(235, 245, 255, 0.9)');
                grad.addColorStop(1, 'rgba(210, 225, 255, 0)');
            }
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // ── Sun (Pure Starburst Lens Flare) ──────────────────────────────────────────
    function drawSun(cx, cy, t) {
        const w = canvas.width, h = canvas.height;
        const pulse = 1 + 0.04 * Math.sin(t * 1.3);
        const rayRot = t * 0.09;
        const CORE_R = Math.min(w, h) * 0.10;
        const RAY_LONG = CORE_R * 5.5;
        const RAY_SHORT = CORE_R * 3.0;
        const RAY_COUNT = 24;

        // 1a. Ambient Blooms
        const superBloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, CORE_R * 14 * pulse);
        const bloomAlpha = isDark() ? 0.45 : 0.62;
        const subBloomAlpha = isDark() ? 0.15 : 0.24;
        superBloom.addColorStop(0, `rgba(255,255,230,${bloomAlpha})`);
        superBloom.addColorStop(0.5, `rgba(255,255,210,${subBloomAlpha})`);
        superBloom.addColorStop(1, 'rgba(255,255,200,0)');
        ctx.save(); ctx.fillStyle = superBloom; ctx.beginPath(); ctx.arc(cx, cy, CORE_R * 14 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, CORE_R * 9 * pulse);
        const coreBloomAlpha = isDark() ? 0.65 : 0.82;
        bloom.addColorStop(0, `rgba(255,255,240,${coreBloomAlpha})`);
        bloom.addColorStop(0.6, 'rgba(255,255,220,0.22)');
        bloom.addColorStop(1, 'rgba(255,255,220,0)');
        ctx.save(); ctx.fillStyle = bloom; ctx.beginPath(); ctx.arc(cx, cy, CORE_R * 9 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        // 2. Starburst Rays
        const rayAlphaBase = isDark() ? 1.0 : 1.25; // Slightly softer in light mode
        for (let i = 0; i < RAY_COUNT; i++) {
            const angle = (i / RAY_COUNT) * Math.PI * 2 + rayRot;
            const isLong = i % 2 === 0;
            const rayLen = (isLong ? RAY_LONG : RAY_SHORT) * pulse;
            const rayWidth = isLong ? CORE_R * 0.10 : CORE_R * 0.065;
            const tipX = cx + Math.cos(angle) * rayLen, tipY = cy + Math.sin(angle) * rayLen;
            const perpAngle = angle + Math.PI / 2;
            const bx1 = cx + Math.cos(perpAngle) * rayWidth, by1 = cy + Math.sin(perpAngle) * rayWidth;
            const bx2 = cx - Math.cos(perpAngle) * rayWidth, by2 = cy - Math.sin(perpAngle) * rayWidth;
            const rayGrad = ctx.createLinearGradient(cx, cy, tipX, tipY);
            rayGrad.addColorStop(0, `rgba(255,255,255,${rayAlphaBase})`);
            rayGrad.addColorStop(1, 'rgba(255,255,220,0)');
            ctx.save(); ctx.fillStyle = rayGrad; ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(tipX, tipY); ctx.lineTo(bx2, by2); ctx.closePath(); ctx.fill(); ctx.restore();
        }

        // 3. Central Glow Halos
        const midGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, CORE_R * 3.5 * pulse);
        midGlow.addColorStop(0, 'rgba(255,255,255,1.0)');
        midGlow.addColorStop(1, 'rgba(255,255,235,0)');
        ctx.save(); ctx.fillStyle = midGlow; ctx.beginPath(); ctx.arc(cx, cy, CORE_R * 3.5 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        // 5. Lens Flare Streaks
        const flareAlpha = 0.28 + 0.12 * Math.sin(t * 0.9);
        const fLX = CORE_R * 11, fH = CORE_R * 0.12;
        const fg = ctx.createLinearGradient(cx - fLX, cy, cx + fLX, cy);
        fg.addColorStop(0, 'rgba(255,255,255,0)'); fg.addColorStop(0.5, `rgba(255,255,255,${flareAlpha * 1.45})`); fg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save(); ctx.fillStyle = fg; ctx.fillRect(cx - fLX, cy - fH, fLX * 2, fH * 2); ctx.restore();

        // 6. Specular Sparkles
        const sparkAngles = [0, Math.PI / 3, Math.PI * 2 / 3, Math.PI, Math.PI * 4 / 3, Math.PI * 5 / 3];
        sparkAngles.forEach((ang, idx) => {
            const dist = CORE_R * (2.6 + 1.2 * Math.sin(t * 0.7 + idx));
            const sx = cx + Math.cos(ang + rayRot * 0.5) * dist, sy = cy + Math.sin(ang + rayRot * 0.5) * dist;
            const sa = 0.5 + 0.5 * Math.sin(t * 1.5 + idx * 1.1), sR = CORE_R * 0.08;
            const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sR * 3);
            sg.addColorStop(0, `rgba(255,255,255,${sa})`); sg.addColorStop(1, 'rgba(255,255,230,0)');
            ctx.save(); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, sR * 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        });
    }

    // ── Moon (Realistic Rocky Moon with White Glow) ──────────────────────────────
    function drawMoon(cx, cy, t) {
        const h = canvas.height;
        const pulse = 1 + 0.04 * Math.sin(t * 1.0);
        const moonR = Math.min(canvas.width, h) * 0.11;

        // 1. Triple-Layer Smooth Glow
        const superHaze = ctx.createRadialGradient(cx, cy, 0, cx, cy, moonR * 19 * pulse);
        superHaze.addColorStop(0, 'rgba(255,255,255,0.08)'); superHaze.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save(); ctx.fillStyle = superHaze; ctx.beginPath(); ctx.arc(cx, cy, moonR * 19 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        const wideGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, moonR * 10 * pulse);
        wideGlow.addColorStop(0, 'rgba(255,255,255,0.18)'); wideGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save(); ctx.fillStyle = wideGlow; ctx.beginPath(); ctx.arc(cx, cy, moonR * 10 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, moonR * 4.6);
        bloom.addColorStop(0, 'rgba(255,255,255,0.65)'); bloom.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save(); ctx.fillStyle = bloom; ctx.beginPath(); ctx.arc(cx, cy, moonR * 4.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        // 2. Moon Disc (Silver)
        const disc = ctx.createRadialGradient(cx - moonR * 0.25, cy - moonR * 0.25, 0, cx, cy, moonR);
        disc.addColorStop(0, '#ffffff'); disc.addColorStop(0.6, '#f2f2f2'); disc.addColorStop(1, '#e2e2e2');
        ctx.save(); ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(cx, cy, moonR, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        // 3. Realistic Smooth Craters
        const crat = [
            { x: -0.3, y: -0.2, r: 0.15, a: 0.12 }, { x: 0.2, y: -0.4, r: 0.12, a: 0.15 }, { x: 0.4, y: 0.1, r: 0.22, a: 0.10 },
            { x: -0.1, y: 0.4, r: 0.18, a: 0.12 }, { x: -0.5, y: 0.1, r: 0.10, a: 0.14 }, { x: 0.1, y: 0.2, r: 0.08, a: 0.18 }
        ];
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, moonR, 0, Math.PI * 2); ctx.clip();
        crat.forEach(c => {
            const rx = cx + c.x * moonR, ry = cy + c.y * moonR, rr = c.r * moonR;
            const cGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
            cGrad.addColorStop(0, `rgba(0, 30, 65, ${c.a})`); cGrad.addColorStop(1, 'rgba(0, 5, 20, 0)');
            ctx.save(); ctx.shadowBlur = rr * 0.55; ctx.shadowColor = `rgba(0, 20, 50, ${c.a * 0.5})`;
            ctx.beginPath(); ctx.fillStyle = cGrad; ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            ctx.beginPath(); ctx.strokeStyle = `rgba(255, 255, 255, ${c.a * 0.22})`; ctx.lineWidth = 1;
            ctx.arc(rx + rr * 0.2, ry + rr * 0.2, rr * 0.9, 0, Math.PI * 2); ctx.stroke();
        });
        ctx.restore();

        // 4. Orbiting Stars
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2 + t * 0.02, dist = moonR * (3.6 + 2.0 * ((i % 3) / 3));
            const sx = cx + Math.cos(ang) * dist, sy = cy + Math.sin(ang) * dist;
            const sa = 0.4 + 0.6 * Math.sin(t * (0.6 + i * 0.3) + i);
            ctx.save(); ctx.globalAlpha = sa; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy, 0.9 + (i % 3) * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
    }

    // ── Animation Loop ────────────────────────────────────────────────────────────
    function animate(ms) {
        const t = (ms || 0) / 1000;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Position: Top-Right
        const cx = canvas.width * 0.82;
        const cy = canvas.height * 0.20;

        drawStars(t);

        // Clouds: Draw background/midground/foreground sorted by depth
        clouds.forEach(c => {
            c.x += c.speed;
            const layer = CLOUD_LAYERS[c.layerIndex];
            if (c.x - c.baseR * 4 > canvas.width) {
                Object.assign(c, makeCloud(layer, false));
            }
            drawCloud(c);
        });

        if (isDark()) drawMoon(cx, cy, t);
        else drawSun(cx, cy, t);

        requestAnimationFrame(animate);
    }

    // Initialize
    resize();
    requestAnimationFrame(animate);
}