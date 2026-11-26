// the bar in x-bar.css can be pressed and dragged; its height stands for the whole page
(() => {
  const root = document.documentElement, W = 8;
  const go = e => scrollTo(0, (root.scrollHeight - innerHeight) * Math.min(1, Math.max(0, e.clientY / innerHeight)));
  let held = false;
  addEventListener('pointerdown', e => {
    if (e.clientX < innerWidth - W) return;
    held = true; root.setPointerCapture(e.pointerId); e.preventDefault(); go(e);
  });
  addEventListener('pointermove', e => { if (held) go(e); });
  addEventListener('pointerup', () => { held = false; });
  addEventListener('pointercancel', () => { held = false; });
})();
