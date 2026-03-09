export function setupCloudParticles() {
    const canvas = document.getElementById('cloudCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const clouds = [];
    const count  = Math.max(8, Math.floor(window.innerWidth / 180));

    function makeCloud() {
        return {
            x:     Math.random() * canvas.width,
            y:     Math.random() * canvas.height,
            r:     30 + Math.random() * 55,
            speed: 0.12 + Math.random() * 0.22,
            alpha: 0.04 + Math.random() * 0.1,
            puffs: 2 + Math.floor(Math.random() * 3)
        };
    }

    for (let i = 0; i < count; i++) clouds.push(makeCloud());

    function drawCloud(c) {
        ctx.save();
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle   = '#ffffff';
        const pr = c.r;
        ctx.beginPath();
        ctx.arc(c.x, c.y, pr, 0, Math.PI * 2);
        ctx.fill();
        for (let p = 0; p < c.puffs; p++) {
            const angle = (p / c.puffs) * Math.PI - Math.PI / 2;
            const px    = c.x + Math.cos(angle) * pr * 0.7;
            const py    = c.y + Math.sin(angle) * pr * 0.45;
            const psize = pr * (0.55 + Math.random() * 0.25);
            ctx.beginPath();
            ctx.arc(px, py, psize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        clouds.forEach(c => {
            c.x += c.speed;
            if (c.x - c.r * 2 > canvas.width) {
                c.x     = -c.r * 2;
                c.y     = Math.random() * canvas.height;
                c.alpha = 0.04 + Math.random() * 0.1;
                c.r     = 30 + Math.random() * 55;
            }
            drawCloud(c);
        });
        requestAnimationFrame(animate);
    }

    animate();
}