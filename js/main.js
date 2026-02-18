// Scrollytelling step activation (smooth transitions)
// This satisfies: "Mixed text + charts", "Smooth transitions", "Highlight key takeaways"

document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".step");

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        steps.forEach(s => s.classList.remove("is-active"));
        entry.target.classList.add("is-active");

        // Future: trigger chart updates per step
        // const stepName = entry.target.dataset.step;
        // window.dispatchEvent(new CustomEvent("stepEnter", { detail: { stepName } }));
      }
    });
  }, { threshold: 0.35 });

  steps.forEach(s => io.observe(s));

  // Toggle buttons: just UI state for now (charts later)
  function setPressed(groupSelector, activeId){
    document.querySelectorAll(groupSelector).forEach(btn => {
      btn.setAttribute("aria-pressed", btn.id === activeId ? "true" : "false");
    });
  }

  const mapAbs = document.getElementById("btn-map-abs");
  const mapRate = document.getElementById("btn-map-rate");
  if (mapAbs && mapRate){
    mapAbs.addEventListener("click", () => setPressed("#btn-map-abs, #btn-map-rate", "btn-map-abs"));
    mapRate.addEventListener("click", () => setPressed("#btn-map-abs, #btn-map-rate", "btn-map-rate"));
  }

  const stEv = document.getElementById("btn-stacked-events");
  const stFa = document.getElementById("btn-stacked-fatal");
  if (stEv && stFa){
    stEv.addEventListener("click", () => setPressed("#btn-stacked-events, #btn-stacked-fatal", "btn-stacked-events"));
    stFa.addEventListener("click", () => setPressed("#btn-stacked-events, #btn-stacked-fatal", "btn-stacked-fatal"));
  }
  // Render Streamgraph (Chart 1)
  if (window.renderStreamgraph) {
    window.renderStreamgraph({
      containerId: "viz-streamgraph",
      dataPath: "data/processed/chart1_streamgraph.csv",
      yLabel: "Deaths",
      xLabel: "Year"
  });
  }

  if (window.renderChoropleth) {
  window.renderChoropleth({
    containerId: "viz-choropleth",
    dataPath: "data/processed/chart2_choropleth.csv",
    title: "One-sided violence (total)",
    valueLabel: "Recorded deaths"
  });
  }


});
