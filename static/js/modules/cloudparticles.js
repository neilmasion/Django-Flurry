export function setupCloudParticles() {
    const canvas = document.getElementById('cloudCanvas');
    if (!canvas) return;

    let ctx;
    try {
        ctx = canvas.getContext('2d');
        if (!ctx) return;
    } catch (e) {
        return;
    }

    // ── Theme detection ──────────────────────────────────────────────────────────
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    // ── Stars (built on resize) ──────────────────────────────────────────────────
    let stars = [];

    function buildStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 7000);
        for (let i = 0; i < count; i++) {
            stars.push({
                x:        Math.random() * canvas.width,
                y:        Math.random() * canvas.height * 0.65,
                r:        0.4 + Math.random() * 1.1,
                alpha:    0.3 + Math.random() * 0.65,
                twinkle:  0.003 + Math.random() * 0.005,
                phase:    Math.random() * Math.PI * 2,
            });
        }
    }

    // ── Resize ───────────────────────────────────────────────────────────────────
    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        buildStars();  // safe because buildStars is defined above
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Draw stars ───────────────────────────────────────────────────────────────
    function drawStars(t) {
        if (!isDark()) return;
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            const a = s.alpha * (0.5 + 0.5 * Math.sin(t * s.twinkle * 60 + s.phase));
            ctx.save();
            ctx.globalAlpha = a;
            ctx.fillStyle   = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ── Aurora glow (light mode) – no ctx.filter, uses radial gradients ──────────
    let auroraT = 0;
    function drawAurora() {
        if (isDark()) return;
        auroraT += 0.004;
        const w = canvas.width, h = canvas.height;
        const bands = [
            { cy: h * 0.15, amp: 55, alpha: 0.06, radius: w * 0.55 },
            { cy: h * 0.28, amp: 45, alpha: 0.04, radius: w * 0.50 },
        ];
        for (let i = 0; i < bands.length; i++) {
            const b    = bands[i];
            const yOff = Math.sin(auroraT + i * 1.5) * b.amp;
            const cy   = b.cy + yOff;
            const grad = ctx.createRadialGradient(w * 0.5, cy, 0, w * 0.5, cy, b.radius);
            grad.addColorStop(0, 'rgba(255,255,255,' + b.alpha + ')');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.fillStyle   = grad;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    }

    // ── Clouds (3 parallax layers, NO ctx.filter, NO destination-out) ────────────
    const LAYERS = [
        { count: 4, rMin: 55, rMax: 85,  speedMin: 0.08, speedMax: 0.13, yRange: [0.04, 0.28], alphaMin: 0.10, alphaMax: 0.17 },
        { count: 6, rMin: 32, rMax: 60,  speedMin: 0.17, speedMax: 0.27, yRange: [0.10, 0.48], alphaMin: 0.07, alphaMax: 0.13 },
        { count: 8, rMin: 18, rMax: 36,  speedMin: 0.28, speedMax: 0.44, yRange: [0.14, 0.58], alphaMin: 0.04, alphaMax: 0.09 },
    ];

    function makeCloud(layer, startAnywhere) {
        const r    = layer.rMin + Math.random() * (layer.rMax - layer.rMin);
        const yLo  = layer.yRange[0];
        const yHi  = layer.yRange[1];
        return {
            x:     startAnywhere ? Math.random() * (canvas.width + r * 4) - r * 2 : -(r * 3 + Math.random() * 180),
            y:     (yLo + Math.random() * (yHi - yLo)) * canvas.height,
            r,
            speed: layer.speedMin + Math.random() * (layer.speedMax - layer.speedMin),
            alpha: layer.alphaMin + Math.random() * (layer.alphaMax - layer.alphaMin),
            puffs: 3 + Math.floor(Math.random() * 4),
            layer,
        };
    }

    const clouds = [];
    for (let li = 0; li < LAYERS.length; li++) {
        const layer = LAYERS[li];
        for (let i = 0; i < layer.count; i++) {
            clouds.push(makeCloud(layer, true));
        }
    }

    function drawCloud(c) {
        const darkMode = isDark();
        const alpha    = darkMode ? c.alpha * 0.30 : c.alpha;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = '#ffffff';

        // Base centre puff
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        // Extra puffs spread across the top arc
        for (let p = 0; p < c.puffs; p++) {
            const frac  = (p + 0.5) / c.puffs;
            const angle = frac * Math.PI;                        // 0 → π across cloud top
            const px    = c.x + Math.cos(angle) * c.r * 0.80;
            const py    = c.y - Math.abs(Math.sin(angle)) * c.r * 0.50;
            const pr    = c.r * (0.45 + Math.random() * 0.28);
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // ── Birds ────────────────────────────────────────────────────────────────────
    const BIRD_COUNT = 5;
    const birds      = [];

    function makeBird(startAnywhere) {
        return {
            x:         startAnywhere ? Math.random() * canvas.width : -70,
            y:         (0.06 + Math.random() * 0.26) * canvas.height,
            vy:        (Math.random() - 0.5) * 0.15,
            speed:     0.5 + Math.random() * 0.7,
            size:      4 + Math.random() * 6,
            phase:     Math.random() * Math.PI * 2,
            alpha:     0.18 + Math.random() * 0.16,
            flapSpeed: 0.035 + Math.random() * 0.035,
        };
    }

    for (let i = 0; i < BIRD_COUNT; i++) birds.push(makeBird(true));

    function drawBird(b, t) {
        const flap     = Math.sin(t * b.flapSpeed * 60 + b.phase);
        const wingLift = b.size * 0.5 * flap;
        ctx.save();
        ctx.globalAlpha = isDark() ? b.alpha * 0.35 : b.alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1.1;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.quadraticCurveTo(b.x - b.size * 0.5, b.y - wingLift, b.x - b.size, b.y);
        ctx.moveTo(b.x, b.y);
        ctx.quadraticCurveTo(b.x + b.size * 0.5, b.y - wingLift, b.x + b.size, b.y);
        ctx.stroke();
        ctx.restore();
    }

    // ── Animation loop ───────────────────────────────────────────────────────────
    function animate(ts) {
        const t = (ts || 0) / 1000;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawAurora();
        drawStars(t);

        for (let i = 0; i < clouds.length; i++) {
            const c = clouds[i];
            c.x += c.speed;
            if (c.x - c.r * 3 > canvas.width) {
                const fresh = makeCloud(c.layer, false);
                Object.assign(c, fresh);
            }
            drawCloud(c);
        }

        for (let i = 0; i < birds.length; i++) {
            const b = birds[i];
            b.x += b.speed;
            b.y += b.vy;
            if (b.x > canvas.width + 80) {
                Object.assign(b, makeBird(false));
            }
            drawBird(b, t);
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}