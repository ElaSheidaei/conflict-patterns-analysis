// js/chart10.js

function drawChart10() {
  const container = d3.select("#viz-heatmap");
  container.html("");
  container.style("position", "relative");

  const width = container.node().getBoundingClientRect().width || 800;
  const height = 450;
  const margin = { top: 20, right: 30, bottom: 110, left: 50 };
  const marginGap  = { top: 100, right: 30, bottom: 90, left: 170 };

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("font-family", "var(--font-body)");

  // Tooltip INSIDE container (stable)
  container.selectAll(".d3-tooltip").remove();
  const tooltip = container.append("div")
    .attr("class", "d3-tooltip")
    .style("position", "absolute")
    .style("background", "var(--card)")
    .style("color", "var(--text)")
    .style("padding", "8px 12px")
    .style("border", "1px solid var(--line)")
    .style("border-radius", "6px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("font-size", "0.8rem")
    .style("box-shadow", "var(--shadow)");

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthIndex = new Map(monthNames.map((m,i) => [m, i+1]));

  Promise.all([
    d3.csv("data/processed/chart10_heatmap.csv"),
    d3.csv("data/processed/chart10_void_gap.csv")
  ]).then(([heatWide, gapRaw]) => {

    // ---------------------------
    // 1) RESHAPE HEATMAP (wide -> long)
    // ---------------------------
    const heatData = [];
    heatWide.forEach(row => {
      const year = +row.YEAR;
      monthNames.forEach(m => {
        heatData.push({
          year,
          month: monthIndex.get(m),
          monthName: m,
          value: +row[m]
        });
      });
    });

    const years = Array.from(new Set(heatData.map(d => d.year))).sort((a,b)=>a-b);

    const x = d3.scaleBand()
      .domain(d3.range(1,13))
      .range([margin.left, width - margin.right])
      .padding(0.06);

    const y = d3.scaleBand()
      .domain(years)
      .range([margin.top, height - margin.bottom])
      .padding(0.06);

    const vmax = d3.max(heatData, d => d.value) || 1;

    // sequential reds (no custom styling needed)
    const color = d3.scaleSequential()
      .domain([0, vmax])
      .interpolator(d3.interpolateReds);

    // Background group for heatmap
    const heatG = svg.append("g").attr("class", "heatmap-layer");

    const cells = heatG.selectAll("rect")
      .data(heatData)
      .join("rect")
      .attr("x", d => x(d.month))
      .attr("y", d => y(d.year))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => d.value === 0 ? "rgba(255,255,255,0.03)" : color(d.value))
      .attr("stroke", "rgba(255,255,255,0.08)")
      .attr("stroke-width", 0.8)
      .style("cursor", "default")
      .on("mousemove", function(event, d){
        const [mx,my] = d3.pointer(event, container.node());
        tooltip.html(`
          <div style="font-family: var(--font-mono); font-weight: 700; margin-bottom: 4px;">
            ${d.monthName} ${d.year}
          </div>
          <div>ACLED recorded deaths: <strong>${d3.format(",")(d.value)}</strong></div>
        `)
        .style("left", (mx + 12) + "px")
        .style("top", (my + 12) + "px")
        .style("opacity", 1);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => monthNames[d-1]))
      .call(g => g.select(".domain").attr("stroke","rgba(255,255,255,0.12)"))
      .call(g => g.selectAll(".tick line").attr("stroke","rgba(255,255,255,0.12)"))
      .call(g => g.selectAll(".tick text")
        .attr("fill","var(--muted)")
        .style("font-family","var(--font-mono)"));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick text")
        .attr("fill","var(--text)")
        .style("font-family","var(--font-mono)")
        .style("font-weight","700"));

    // ---------------------------
    // 2) STAGES
    // ---------------------------
    function stage1() {
      // Full heatmap
      cells.transition().duration(450).attr("opacity", 1);
    }

    function stage2() {
      // Spotlight: Nov 2019 + Fall 2022 (Sep–Dec)
      cells.transition().duration(450)
        .attr("opacity", d => {
          const isNov2019 = (d.year === 2019 && d.month === 11);
          const isFall2022 = (d.year === 2022 && d.month >= 9 && d.month <= 12);
          return (isNov2019 || isFall2022) ? 1 : 0.12;
        });
    }

    function stage3() {
      // Fade heatmap out then replace with dumbbell chart
      tooltip.style("opacity", 0);

      heatG.transition().duration(350).attr("opacity", 0).on("end", () => {
        heatG.remove();
        svg.selectAll(".axis-layer").remove(); // (none, but safe)

        // Clear axes groups (we'll redraw)
        svg.selectAll("g").filter(function() {
          // remove old axes groups too
          return d3.select(this).attr("transform")?.includes("translate");
        }).remove();

        // ---------------------------
        // Dumbbell from chart10_void_gap.csv
        // Columns:
        // Event, Internet_Blackout, ACLED_Reported_Deaths, Real_Estimated_Deaths, The_Void_Gap, Source
        // ---------------------------
        const gapData = gapRaw.map(d => ({
          event: d.Event,
          blackout: d.Internet_Blackout,
          acled: +d.ACLED_Reported_Deaths,
          real: +d.Real_Estimated_Deaths,
          gap: +d.The_Void_Gap,
          source: d.Source
        }));

        const m = marginGap;
        const yGap = d3.scaleBand()
          .domain(gapData.map(d => d.event))
          .range([m.top, height - m.bottom])
          .padding(0.55);

        const xGap = d3.scaleLinear()
          .domain([0, d3.max(gapData, d => d.real) || 1])
          .nice()
          .range([m.left, width - m.right]);

        // Axes
        svg.append("g")
          .attr("transform", `translate(0,${height - m.bottom})`)
          .call(d3.axisBottom(xGap).ticks(5))
          .call(g => g.select(".domain").attr("stroke","rgba(255,255,255,0.12)"))
          .call(g => g.selectAll(".tick line").attr("stroke","rgba(255,255,255,0.12)"))
          .call(g => g.selectAll(".tick text")
            .attr("fill","var(--muted)")
            .style("font-family","var(--font-mono)"));

        svg.append("g")
          .attr("transform", `translate(${m.left},0)`)
          .call(d3.axisLeft(yGap).tickSize(0))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick text")
            .attr("fill","var(--text)")
            .style("font-family","var(--font-mono)")
            .style("font-weight","700"));

        // Dumbbell lines
        const g = svg.append("g").attr("class", "gap-layer");

        g.selectAll("line.gap")
          .data(gapData)
          .join("line")
          .attr("class", "gap")
          .attr("x1", d => xGap(d.acled))
          .attr("x2", d => xGap(d.real))
          .attr("y1", d => yGap(d.event))
          .attr("y2", d => yGap(d.event))
          .attr("stroke", "rgba(228,61,75,0.85)")
          .attr("stroke-width", 4)
          .attr("stroke-linecap", "round");

        // ACLED dot
        g.selectAll("circle.acled")
          .data(gapData)
          .join("circle")
          .attr("class", "acled")
          .attr("cx", d => xGap(d.acled))
          .attr("cy", d => yGap(d.event))
          .attr("r", 6)
          .attr("fill", "rgba(255,255,255,0.55)");

        // Real / Estimated dot
        g.selectAll("circle.real")
          .data(gapData)
          .join("circle")
          .attr("class", "real")
          .attr("cx", d => xGap(d.real))
          .attr("cy", d => yGap(d.event))
          .attr("r", 8)
          .attr("fill", "rgba(228,61,75,0.95)");

        // Hover tooltip on dumbbell
        g.selectAll("circle.real, circle.acled, line.gap")
          .on("mousemove", function(event, d){
            const [mx,my] = d3.pointer(event, container.node());
            tooltip.html(`
              <div style="font-family: var(--font-mono); font-weight: 700; margin-bottom: 4px;">
                ${d.event}
              </div>
              <div>ACLED recorded: <strong>${d3.format(",")(d.acled)}</strong></div>
              <div>Reported estimate: <strong>${d3.format(",")(d.real)}</strong></div>
              <div style="margin-top:6px; color: var(--muted); font-size: 0.78rem;">
                Internet blackout: ${d.blackout} • Source: ${d.source}
              </div>
            `)
            .style("left", (mx + 12) + "px")
            .style("top", (my + 12) + "px")
            .style("opacity", 1);
          })
          .on("mouseout", () => tooltip.style("opacity", 0));

        // Small legend line (optional, clean)
        svg.append("text")
          .attr("x", margin.left)
          .attr("y", margin.top - 14)
          .attr("fill", "rgba(255,255,255,0.55)")
          .style("font-family","var(--font-mono)")
          .style("font-size","11px")
          .text("ACLED recorded vs reported estimates • Blackout periods spotlight missingness");
      });
    }

    // Expose controls
    window.chart10Stages = { stage1, stage2, stage3 };

    // Default
    stage1();
  });

  
}

document.addEventListener("DOMContentLoaded", drawChart10);