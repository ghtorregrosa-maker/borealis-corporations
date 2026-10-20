/* Aurora boreal del hero: cortinas de luz sobre un fiordo. Respeta "reducir movimiento". */
(() => {
  'use strict';
  const canvas = document.getElementById('aurora');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const start = performance.now();
  let w = 0, h = 0, stars = [], ridge = [], raf = 0, visible = true;

  const bands = [
    { hue: 160, base: 0.36, amp: 0.09, freq: 0.0036, speed: 0.00021, alpha: 0.5, phase: 0 },
    { hue: 178, base: 0.44, amp: 0.07, freq: 0.0052, speed: 0.00015, alpha: 0.4, phase: 2 },
    { hue: 268, base: 0.32, amp: 0.06, freq: 0.0029, speed: 0.00012, alpha: 0.34, phase: 4 }
  ];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars = Array.from({ length: Math.round((w * h) / 9000) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.65,
      r: Math.random() * 1.1 + 0.25,
      p: Math.random() * Math.PI * 2
    }));

    ridge = [];
    for (let x = 0; x <= w + 12; x += 12) {
      const n = Math.sin(x * 0.006) * 0.5 + Math.sin(x * 0.017 + 1.3) * 0.28 + Math.sin(x * 0.041 + 0.4) * 0.12;
      ridge.push([x, h * (0.86 - n * 0.09)]);
    }
    draw(performance.now());
  }

  function draw(now) {
    const t = now - start;
    ctx.globalCompositeOperation = 'source-over';
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#031019');
    sky.addColorStop(1, '#0B2B3A');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      const tw = reduce.matches ? 0.7 : 0.55 + 0.45 * Math.sin(t * 0.0012 + s.p);
      ctx.fillStyle = 'rgba(230,245,255,' + (0.75 * tw).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'lighter';
    const step = 7;
    for (const b of bands) {
      for (let x = 0; x < w; x += step) {
        const wave = Math.sin(x * b.freq + t * b.speed + b.phase) * b.amp * h
                   + Math.sin(x * b.freq * 2.3 - t * b.speed * 1.7) * b.amp * h * 0.45;
        const y = b.base * h + wave;
        const len = h * 0.36 * (0.6 + 0.4 * Math.sin(x * 0.004 + t * 0.0004 + b.phase));
        const g = ctx.createLinearGradient(0, y, 0, y + len);
        g.addColorStop(0, 'hsla(' + b.hue + ',90%,62%,0)');
        g.addColorStop(0.18, 'hsla(' + b.hue + ',90%,62%,' + b.alpha + ')');
        g.addColorStop(1, 'hsla(' + b.hue + ',90%,55%,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, step + 1, len);
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#04141E';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (const p of ridge) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(w + 12, h);
    ctx.closePath();
    ctx.fill();
  }

  function loop(now) {
    if (!visible || reduce.matches) { raf = 0; return; }
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function play() {
    if (!raf && visible && !reduce.matches) raf = requestAnimationFrame(loop);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) play();
    }).observe(canvas);
  }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);

  reduce.addEventListener('change', () => { draw(performance.now()); play(); });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) play(); });

  resize();
  play();
})();
