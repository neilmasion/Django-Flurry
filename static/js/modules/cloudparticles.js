export function setupCloudParticles() {
    const canvas = document.getElementById('cloudCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Resize ──────────────────────────────────────────────────────────────────
    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        buildStars();
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Theme detection ─────────────────────────────────────────────────────────
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    // ── Stars (dark mode) ───────────────────────────────────────────────────────
    let stars = [];
    function buildStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 6000);
        for (let i = 0; i < count; i++) {
            stars.push({
                x:        Math.random() * canvas.width,
                y:        Math.random() * canvas.height * 0.65,
                r:        0.4 + Math.random() * 1.2,
                alpha:    0.3 + Math.random() * 0.7,
                twinkle:  0.003 + Math.random() * 0.006,
                phase:    Math.random() * Math.PI * 2,
            });
        }
    }

    function drawStars(t) {
        if (!isDark()) return;
        stars.forEach(s => {
            const a = s.alpha * (0.55 + 0.45 * Math.sin(t * s.twinkle * 60 + s.phase));
            ctx.save();
            ctx.globalAlpha = a;
            ctx.fillStyle   = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // ── Aurora glow (light mode only) ───────────────────────────────────────────
    let auroraT = 0;
    function drawAurora() {
        if (isDark()) return;
        auroraT += 0.004;
        const w = canvas.width, h = canvas.height;
        const bands = [
            { cy: h * 0.18, amp: 60, color0: 'rgba(255,255,255,0.055)', color1: 'rgba(255,255,255,0)' },
            { cy: h * 0.30, amp: 50, color0: 'rgba(255,255,255,0.04)',  color1: 'rgba(255,255,255,0)' },
        ];
        bands.forEach((b, i) => {
            const yOff = Math.sin(auroraT + i * 1.4) * b.amp;
            const grad = ctx.createRadialGradient(
                w * 0.5, b.cy + yOff, 0,
                w * 0.5, b.cy + yOff, w * 0.55
            );
            grad.addColorStop(0, b.color0);
            grad.addColorStop(1, b.color1);
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.fillStyle   = grad;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        });
    }

    // ── Clouds (3 parallax layers) ───────────────────────────────────────────────
    const LAYERS = [
        { count: 4,  rMin: 55, rMax: 90,  speedMin: 0.08, speedMax: 0.14, yRange: [0.05, 0.30], alphaMin: 0.11, alphaMax: 0.18, blur: 16 },
        { count: 6,  rMin: 35, rMax: 65,  speedMin: 0.18, speedMax: 0.28, yRange: [0.10, 0.50], alphaMin: 0.08, alphaMax: 0.14, blur: 10 },
        { count: 8,  rMin: 20, rMax: 40,  speedMin: 0.30, speedMax: 0.46, yRange: [0.15, 0.60], alphaMin: 0.05, alphaMax: 0.10, blur:  4 },
    ];

    function makeCloud(layer, startAnywhere) {
        const r = layer.rMin + Math.random() * (layer.rMax - layer.rMin);
        const [yLo, yHi] = layer.yRange;
        return {
            x:     startAnywhere ? Math.random() * (canvas.width + r * 4) - r * 2 : -(r * 3 + Math.random() * 200),
            y:     (yLo + Math.random() * (yHi - yLo)) * canvas.height,
            r,
            speed: layer.speedMin + Math.random() * (layer.speedMax - layer.speedMin),
            alpha: layer.alphaMin + Math.random() * (layer.alphaMax - layer.alphaMin),
            puffs: 3 + Math.floor(Math.random() * 4),
            blur:  layer.blur,
            layer,
        };
    }

    const clouds = [];
    LAYERS.forEach(layer => {
        for (let i = 0; i < layer.count; i++) clouds.push(makeCloud(layer, true));
    });

    function drawCloud(c) {
        ctx.save();
        if (c.blur > 0) ctx.filter = `blur(${c.blur}px)`;
        ctx.globalAlpha = isDark() ? c.alpha * 0.35 : c.alpha;
        ctx.fillStyle   = '#ffffff';

        // Base puff
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        // Extra top puffs
        for (let p = 0; p < c.puffs; p++) {
            const frac  = p / c.puffs;
            const angle = frac * Math.PI;                     // 0 → π (left to right across top)
            const px    = c.x + Math.cos(angle) * c.r * 0.85;
            const py    = c.y - Math.abs(Math.sin(angle)) * c.r * 0.55;
            const pr    = c.r * (0.50 + Math.random() * 0.30);
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
        }

        // Flat bottom (clip)
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
        ctx.fillRect(c.x - c.r * 2.5, c.y + c.r * 0.65, c.r * 5, c.r * 2);
        ctx.restore();
    }

    // ── Birds ───────────────────────────────────────────────────────────────────
    const birds = [];
    const BIRD_COUNT = 4;

    function makeBird(startAnywhere) {
        const y = (0.08 + Math.random() * 0.28) * canvas.height;
        return {
            x:     startAnywhere ? Math.random() * canvas.width : -60,
            y,
            vy:    (Math.random() - 0.5) * 0.18,
            speed: 0.55 + Math.random() * 0.75,
            size:  5 + Math.random() * 6,
            phase: Math.random() * Math.PI * 2,
            alpha: 0.20 + Math.random() * 0.18,
            flapSpeed: 0.04 + Math.random() * 0.04,
        };
    }

    for (let i = 0; i < BIRD_COUNT; i++) birds.push(makeBird(true));

    function drawBird(b, t) {
        const flap = Math.sin(t * b.flapSpeed * 60 + b.phase);
        const wingLift = b.size * 0.55 * flap;
        ctx.save();
        ctx.globalAlpha = isDark() ? b.alpha * 0.4 : b.alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1.2;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        // Left wing
        ctx.moveTo(b.x, b.y);
        ctx.quadraticCurveTo(b.x - b.size * 0.55, b.y - wingLift, b.x - b.size, b.y);
        // Right wing
        ctx.moveTo(b.x, b.y);
        ctx.quadraticCurveTo(b.x + b.size * 0.55, b.y - wingLift, b.x + b.size, b.y);
        ctx.stroke();
        ctx.restore();
    }

    // ── Main loop ───────────────────────────────────────────────────────────────
    let lastTime = 0;
    function animate(ts) {
        const t = ts / 1000;
        lastTime = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawAurora();
        drawStars(t);

        // Clouds
        clouds.forEach(c => {
            c.x += c.speed;
            if (c.x - c.r * 3 > canvas.width) {
                const fresh = makeCloud(c.layer, false);
                Object.assign(c, fresh);
            }
            drawCloud(c);
        });

        // Birds
        birds.forEach(b => {
            b.x  += b.speed;
            b.y  += b.vy;
            if (b.x > canvas.width + 80) {
                Object.assign(b, makeBird(false));
            }
            drawBird(b, t);
        });

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}