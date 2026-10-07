// ====== 星海之境 · Canvas 星空背景 + 交互 ======
(function() {
    const canvas = document.getElementById('universe');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    const stars = [];
    const meteors = [];
    const oceanParticles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 星星
    for (let i = 0; i < 300; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.7,
            r: Math.random() * 1.5 + 0.3,
            alpha: Math.random(),
            speed: Math.random() * 0.008 + 0.002
        });
    }

    // 海洋粒子
    for (let i = 0; i < 150; i++) {
        oceanParticles.push({
            x: Math.random() * width,
            y: height * 0.5 + Math.random() * height * 0.5,
            r: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.5 + 0.1,
            speedY: Math.random() * 0.3 + 0.1,
            speedX: Math.random() * 0.2 - 0.1
        });
    }

    // 流星
    function spawnMeteor() {
        if (meteors.length < 3 && Math.random() < 0.005) {
            meteors.push({
                x: Math.random() * width,
                y: Math.random() * height * 0.3,
                len: Math.random() * 80 + 40,
                speed: Math.random() * 6 + 4,
                angle: Math.PI / 4 + Math.random() * 0.2,
                alpha: 1
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // 绘制星星
        stars.forEach(star => {
            star.alpha += star.speed;
            const a = Math.abs(Math.sin(star.alpha));
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 230, 255, ${a * 0.8})`;
            ctx.fill();
        });

        // 绘制海洋粒子
        oceanParticles.forEach(p => {
            p.y -= p.speedY;
            p.x += p.speedX;
            if (p.y < height * 0.5) {
                p.y = height;
                p.x = Math.random() * width;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha * 0.4})`;
            ctx.fill();
        });

        // 绘制流星
        spawnMeteor();
        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            m.x += Math.cos(m.angle) * m.speed;
            m.y += Math.sin(m.angle) * m.speed;
            m.alpha -= 0.015;

            if (m.alpha <= 0) {
                meteors.splice(i, 1);
                continue;
            }

            const grad = ctx.createLinearGradient(
                m.x, m.y,
                m.x - Math.cos(m.angle) * m.len,
                m.y - Math.sin(m.angle) * m.len
            );
            grad.addColorStop(0, `rgba(200, 230, 255, ${m.alpha})`);
            grad.addColorStop(1, 'rgba(200, 230, 255, 0)');

            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(
                m.x - Math.cos(m.angle) * m.len,
                m.y - Math.sin(m.angle) * m.len
            );
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        requestAnimationFrame(draw);
    }
    draw();
})();

// ====== 滚动动画 ======
(function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .article-card, .timeline-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
})();

// ====== 导航高亮 ======
(function() {
    const links = document.querySelectorAll('.nav-links a');
    const current = window.location.pathname;
    links.forEach(link => {
        if (link.getAttribute('href') && current.includes(link.getAttribute('href').replace('../', '').replace('./', ''))) {
            link.classList.add('active');
        }
    });
})();
