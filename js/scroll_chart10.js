// js/scroll_chart10.js
document.addEventListener("DOMContentLoaded", () => {
  const wait = setInterval(() => {
    if (!window.chart10Stages) return;
    clearInterval(wait);

    const { stage1, stage2, stage3 } = window.chart10Stages;

    const t1 = document.querySelector('[data-trigger="hm-1"]');
    const t2 = document.querySelector('[data-trigger="hm-2"]');
    const t3 = document.querySelector('[data-trigger="hm-3"]');


    // Helper: observe both enter + exit to support scrolling back up
    function observeTrigger(el, onEnter, onExit) {
      if (!el) return;
      new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) onEnter();
          else onExit && onExit();
        });
      }, { threshold: 0.6 }).observe(el);
    }

    // Stage logic:
    // hm-1 enter -> stage1 (full heatmap)
    // hm-2 enter -> stage2 (spotlight)
    // hm-3 enter -> stage3 (dumbbell)
    //
    // When scrolling back up:
    // leaving hm-3 -> stage2
    // leaving hm-2 -> stage1
    observeTrigger(t1, stage1, null);
    observeTrigger(t2, stage2, () => stage1());
    observeTrigger(t3, stage3, () => stage2());

    // Default on load
    stage1();
  }, 50);
});