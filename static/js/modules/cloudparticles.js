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
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        buildStars();
        buildClouds();
    }
    window.addEventListener('resize', resize);

    // ── Stars (dark mode only) ────────────────────────────────────────────────────
    let stars = [];
    function buildStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 5500);
        for (let i = 0; i < count; i++) {
            stars.push({
                x:       Math.random() * canvas.width,
                y:       Math.random() * canvas.height * 0.55,
                r:       0.5 + Math.random() * 1.2,
                alpha:   0.4 + Math.random() * 0.6,
                twinkle: 0.002 + Math.random() * 0.005,
                phase:   Math.random() * Math.PI * 2,
            });
        }
    }

    function drawStars(t) {
        if (!isDark()) return;
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            const a = s.alpha * (0.45 + 0.55 * Math.sin(t * s.twinkle * 60 + s.phase));
            ctx.save();
            ctx.globalAlpha = a;
            ctx.fillStyle   = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ── Sun / Moon (top-right) ────────────────────────────────────────────────────
    let bodyGlowT = 0;

    function drawCelestialBody() {
        bodyGlowT += 0.007;
        const pulse = 1 + 0.07 * Math.sin(bodyGlowT);
        const dark  = isDark();
        const w = canvas.width, h = canvas.height;
        const cx = w * 0.80;
        const cy = h * 0.15;
        const bodyR = Math.min(w, h) * 0.065;

        if (dark) {
            // ── MOON ──────────────────────────────────────────────────────────────
            // Wide cyan outer halo
            const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, bodyR * 5.5 * pulse);
            halo.addColorStop(0,   'rgba(80,200,255,0.22)');
            halo.addColorStop(0.4, 'rgba(60,160,230,0.10)');
            halo.addColorStop(1,   'rgba(40,120,200,0)');
            ctx.save();
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(cx, cy, bodyR * 5.5 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Inner glow bloom
            const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, bodyR * 2.2);
            bloom.addColorStop(0,   'rgba(200,240,255,0.85)');
            bloom.addColorStop(0.5, 'rgba(120,210,255,0.45)');
            bloom.addColorStop(1,   'rgba(80,170,240,0)');
            ctx.save();
            ctx.fillStyle = bloom;
            ctx.beginPath();
            ctx.arc(cx, cy, bodyR * 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Moon disc
            const disc = ctx.createRadialGradient(cx - bodyR * 0.2, cy - bodyR * 0.2, 0, cx, cy, bodyR);
            disc.addColorStop(0,   '#e8f8ff');
            disc.addColorStop(0.6, '#c0ecff');
            disc.addColorStop(1,   '#90d4f5');
            ctx.save();
            ctx.fillStyle = disc;
            ctx.beginPath();
            ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

        } else {
            // ── SUN ───────────────────────────────────────────────────────────────
            // Wide soft outer glow
            const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, bodyR * 5 * pulse);
            outerGlow.addColorStop(0,   'rgba(255,255,230,0.28)');
            outerGlow.addColorStop(0.35,'rgba(255,255,210,0.13)');
            outerGlow.addColorStop(1,   'rgba(255,255,200,0)');
            ctx.save();
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, bodyR * 5 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Inner halo
            const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, bodyR * 2.0);
            innerGlow.addColorStop(0,   'rgba(255,255,255,1)');
            innerGlow.addColorStop(0.5, 'rgba(255,255,230,0.65)');
            innerGlow.addColorStop(1,   'rgba(255,255,210,0)');
            ctx.save();
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, bodyR * 2.0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Sun disc
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ── Clouds ────────────────────────────────────────────────────────────────────
    // A cloud is a cluster of overlapping circles forming a fluffy shape.
    let clouds = [];

    function makePuffs(baseR) {
        const puffs = [];
        // Bottom row (body)
        const bodyCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < bodyCount; i++) {
            const frac = i / (bodyCount - 1);
            puffs.push({
                ox: (frac - 0.5) * baseR * 2.2,
                oy: baseR * 0.15 + Math.random() * baseR * 0.2,
                r:  baseR * (0.50 + Math.random() * 0.45),
            });
        }
        // Top bumps
        const topCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < topCount; i++) {
            const frac = i / (topCount - 1);
            puffs.push({
                ox: (frac - 0.5) * baseR * 1.6,
                oy: -baseR * (0.25 + Math.random() * 0.45),
                r:  baseR * (0.35 + Math.random() * 0.45),
            });
        }
        return puffs;
    }

    function makeCloud(startAnywhere) {
        const baseR = 30 + Math.random() * 70;          // 30–100 px base radius
        const speed = 0.12 + Math.random() * 0.28;
        const yFrac = 0.04 + Math.random() * 0.62;      // spread across upper 2/3
        const x     = startAnywhere
            ? Math.random() * (canvas.width + baseR * 4) - baseR * 2
            : -(baseR * 3 + Math.random() * 200);
        return {
            x,
            y:     yFrac * canvas.height,
            baseR,
            speed,
            alpha: 0.32 + Math.random() * 0.30,
            puffs: makePuffs(baseR),
        };
    }

    function buildClouds() {
        clouds = [];
        const count = 10 + Math.floor(canvas.width / 200);
        for (let i = 0; i < count; i++) clouds.push(makeCloud(true));
    }

    // Cloud color palettes
    // Light mode: white → icy blue → soft blue (reference: bright daylight clouds)
    const LIGHT_CLOUD_COLORS = [
        [255, 255, 255],  // white
        [220, 238, 255],  // very light blue
        [190, 220, 255],  // light sky blue
        [200, 230, 255],  // ice blue
    ];
    // Dark mode: dark navy → deep blue (reference: night-time moody clouds)
    const DARK_CLOUD_COLORS = [
        [18,  50, 120],   // dark navy
        [12,  35,  90],   // deeper navy
        [28,  65, 150],   // medium navy-blue
        [8,   22,  68],   // very dark navy
    ];

    function drawCloud(c) {
        const dark   = isDark();
        const palette = dark ? DARK_CLOUD_COLORS : LIGHT_CLOUD_COLORS;
        const col    = palette[Math.floor(Math.random() * palette.length)];
        const [r, g, b] = col;
        const a      = c.alpha;

        for (let i = 0; i < c.puffs.length; i++) {
            const p = c.puffs[i];
            // Vary each puff alpha slightly for depth
            const pAlpha = a * (0.7 + Math.random() * 0.3);
            ctx.save();
            ctx.globalAlpha = pAlpha;
            ctx.fillStyle   = `rgb(${r},${g},${b})`;
            ctx.beginPath();
            ctx.arc(c.x + p.ox, c.y + p.oy, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ── Animation loop ────────────────────────────────────────────────────────────
    function animate(ts) {
        const t = (ts || 0) / 1000;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawStars(t);
        drawCelestialBody();

        for (let i = 0; i < clouds.length; i++) {
            const c = clouds[i];
            c.x += c.speed;
            if (c.x - c.baseR * 3 > canvas.width) {
                const fresh = makeCloud(false);
                Object.assign(c, fresh);
            }
            drawCloud(c);
        }

        requestAnimationFrame(animate);
    }

    // Initialize
    resize();
    requestAnimationFrame(animate);
}