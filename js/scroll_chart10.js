// js/scroll_chart10.js
document.addEventListener("DOMContentLoaded", () => {
  const wait = setInterval(() => {
    if (!window.chart10Stages) return;
    clearInterval(wait);

    const { stage1, stage2, stage3 } = window.chart10Stages;

    const heatmapStep = document.querySelector('[data-step="heatmap"]');
    const finaleStep  = document.querySelector('[data-step="finale"]');

    let lastState = null;

    // Stage1: show full heatmap when the heatmap section is in view
    if (heatmapStep) {
      new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            stage1();
            lastState = "s1";
          }
        });
      }, { threshold: 0.6 }).observe(heatmapStep);
    }

    // Finale: drive stage2/stage3 by scroll progress inside the finale section
    function onScroll() {
      if (!finaleStep) return;

      const rect = finaleStep.getBoundingClientRect();
      const vh = window.innerHeight;

      // progress: 0 when finale top hits bottom; 1 when finale bottom hits top
      const progress = (vh - rect.top) / (rect.height + vh);
      const p = Math.max(0, Math.min(1, progress));

      // Tune these thresholds
      if (p > 0.15 && p <= 0.55 && lastState !== "s2") {
        stage2(); // spotlight
        lastState = "s2";
      }
      if (p > 0.55 && lastState !== "s3") {
        stage3(); // dumbbell
        lastState = "s3";
      }
      // If user scrolls back up into finale, restore spotlight/full heatmap smoothly
      if (p <= 0.15 && lastState !== "s1") {
        stage1();
        lastState = "s1";
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }, 50);
});