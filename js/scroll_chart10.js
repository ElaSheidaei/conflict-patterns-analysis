// js/scroll_chart10.js
document.addEventListener("DOMContentLoaded", () => {
  const wait = setInterval(() => {
    if (!window.chart10Stages) return;
    clearInterval(wait);

    const { stage1, stage2, stage3 } = window.chart10Stages;

    // const t1 = document.querySelector('[data-trigger="hm-1"]');
    // const t2 = document.querySelector('[data-trigger="hm-2"]');
    // const t3 = document.querySelector('[data-trigger="hm-3"]');
    const triggers = [
      { el: document.querySelector('[data-trigger="hm-1"]'), fn: stage1 },
      { el: document.querySelector('[data-trigger="hm-2"]'), fn: stage2 },
      { el: document.querySelector('[data-trigger="hm-3"]'), fn: stage3 },
    ].filter(d => d.el);


    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;  
        const hit = triggers.find(t => t.el === e.target);
        if (hit) hit.fn();
      });
    }, {
      threshold: 0.01,
      // “center band” trigger: feels slower + stable
      rootMargin: "-45% 0px -30% 0px"
    });

    triggers.forEach(t => io.observe(t.el));


    // Default on load
    stage1();
  }, 50);
});