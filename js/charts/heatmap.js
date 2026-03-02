// js/chart10.js

function drawChart10() {
  const container = d3.select("#viz-heatmap");
  container.html("");
  container.style("position", "relative");

  const width = container.node().getBoundingClientRect().width || 800;
  const height = 450;
  const margin = { top: 50, right: 30, bottom: 110, left: 50 };
  const marginGap  = { top: 60, right: 30, bottom: 140, left: 170 };

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("font-family", "var(--font-body)");
  const heatLayer = svg.append("g").attr("class", "heat-layer");
  const gapLayer  = svg.append("g")
    .attr("class", "gap-layer")
    .style("opacity", 0)
    .style("pointer-events", "none");
    
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

  function placeTooltip(mx, my) {
  const pad = 12;

  // show first so we can measure
  tooltip.style("opacity", 1);

  const tip = tooltip.node().getBoundingClientRect();
  const box = container.node().getBoundingClientRect();

  // mx,my are relative to container, convert to container space clamps
  let left = mx + pad;
  let top  = my + pad;

  const maxLeft = box.width  - tip.width  - pad;
  const maxTop  = box.height - tip.height - pad;

  left = Math.max(pad, Math.min(left, maxLeft));
  top  = Math.max(pad, Math.min(top,  maxTop));

  tooltip.style("left", left + "px").style("top", top + "px");
}

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthIndex = new Map(monthNames.map((m,i) => [m, i+1]));

  Promise.all([
    d3.csv("data/processed/chart10_heatmap.csv"),
    d3.csv("data/processed/chart10_void_gap.csv")
  ]).then(([heatWide, gapRaw]) => {

    const vizRoot  = d3.select(container.node().closest(".viz"));
    const headTitle = vizRoot.select(".viz-title");
    const headMeta  = vizRoot.select(".viz-meta");
    const headFoot  = vizRoot.select(".viz-foot");

    function setHead(mode){
        if(mode === "heatmap"){
            headTitle.text("State Repression Over Time (2017–2025)");
            headMeta.text("Calendar heatmap — ACLED recorded fatalities");
            headFoot.text("Hover for month • “No data” is a first-class value");
        } else if(mode === "spotlight"){
            headTitle.text("Blackout Months During Uprisings (2017–2025)");
            headMeta.text("Calendar heatmap — ACLED recorded fatalities");
            headFoot.text("Scroll to reveal the gap • ACLED vs reported estimates");
        } else if(mode === "gap"){
            headTitle.text("Reported vs Recorded Fatalities During Blackouts (2019 & 2022)");
            headMeta.text("Comparison plot — ACLED records vs independent estimates");
            headFoot.text("Hover shows sources • Blackouts blind international datasets");
        }
    }
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
      .domain([0, vmax * 1.5])
      .interpolator(d3.interpolateReds);

    // --- Heatmap color legend ---
    const legendW = 140, legendH = 8;
    const legendX = width - margin.right - legendW - 10;
    const legendY = margin.top - 30;

    const defs = svg.append("defs");
    const grad = defs.append("linearGradient")
    .attr("id", "heatLegendGrad")
    .attr("x1", "0%").attr("x2", "100%")
    .attr("y1", "0%").attr("y2", "0%");

    grad.selectAll("stop")
    .data(d3.range(0, 1.0001, 0.1))
    .join("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => d3.interpolateReds(d));

    const heatLegend = heatLayer.append("g")
    .attr("class", "heat-legend")
    .attr("transform", `translate(${legendX},${legendY})`);

    heatLegend.append("rect")
    .attr("width", legendW)
    .attr("height", legendH)
    .attr("rx", 4)
    .attr("fill", "url(#heatLegendGrad)")
    .attr("stroke", "rgba(255,255,255,0.18)")
    .attr("stroke-width", 1);

    heatLegend.append("text")
    .attr("x", 0)
    .attr("y", -4)
    .attr("fill", "rgba(255,255,255,0.65)")
    .style("font-family", "var(--font-mono)")
    .style("font-size", "10px")
    .text("Recorded deaths");

    heatLegend.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("fill", "rgba(255,255,255,0.65)")
    .style("font-family", "var(--font-mono)")
    .style("font-size", "10px")
    .text("0");

    heatLegend.append("text")
    .attr("x", legendW)
    .attr("y", 20)
    .attr("text-anchor", "end")
    .attr("fill", "rgba(255,255,255,0.65)")
    .style("font-family", "var(--font-mono)")
    .style("font-size", "10px")
    .text(d3.format(",")(vmax));

    // Background group for heatmap
    const heatG = heatLayer.append("g").attr("class", "heatmap-layer");

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
        placeTooltip(mx, my);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // Axes
    heatLayer.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => monthNames[d-1]))
      .call(g => g.select(".domain").attr("stroke","rgba(255,255,255,0.12)"))
      .call(g => g.selectAll(".tick line").attr("stroke","rgba(255,255,255,0.12)"))
      .call(g => g.selectAll(".tick text")
        .attr("fill","var(--muted)")
        .style("font-family","var(--font-mono)"));

    heatLayer.append("g")
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

    let gapBuilt = false;
    function buildGapOnce() {
        if (gapBuilt) return;
        gapBuilt = true;

        const m = marginGap; 

        const gapData = gapRaw.map(d => ({
            event: d.Event,
            blackout: d.Internet_Blackout,
            acled: +d.ACLED_Reported_Deaths,
            real: +d.Real_Estimated_Deaths,
            source: d.Source
        }));

        const yGap = d3.scaleBand()
            .domain(gapData.map(d => d.event))
            .range([m.top, height - m.bottom])
            .padding(0.55);

        const xGap = d3.scaleLinear()
            .domain([0, d3.max(gapData, d => d.real) || 1])
            .nice()
            .range([m.left, width - m.right]);

        // axes (draw into gapLayer!)
        gapLayer.append("g")
            .attr("transform", `translate(0,${height - m.bottom})`)
            .call(d3.axisBottom(xGap).ticks(5));
        gapLayer.selectAll(".tick text")
            .attr("fill", "var(--muted)")
            .style("font-family", "var(--font-mono)");
            gapLayer.selectAll(".domain, .tick line")
            .attr("stroke", "rgba(255,255,255,0.15)");    
        gapLayer.append("text")
            .attr("x", m.left + (width - m.left - m.right) / 2)
            .attr("y", height - m.bottom + 45)
            .attr("text-anchor", "middle")
            .attr("fill", "rgba(255,255,255,0.75)")
            .style("font-family", "var(--font-mono)")
            .style("font-size", "11px")
            .style("font-weight", "600")
            .text("Estimated deaths (ACLED vs reported)");

        gapLayer.append("g")
            .attr("transform", `translate(${m.left - 10},0)`)
            .call(d3.axisLeft(yGap).tickSize(0))
            .call(g => g.select(".domain").remove()
        );
        gapLayer.selectAll(".tick text")
            .attr("dy", -(yGap.bandwidth() / 2) + 2)  // move labels upward onto your line
            .attr("dx", "6px")  // add some horizontal padding;

        // small title inside plot area (not stuck at top)
        gapLayer.append("text")
            .attr("x", 15)
            .attr("y", m.top -30)
            .attr("fill", "rgba(255,255,255,0.55)")
            .attr("fill","var(--muted)")
            .style("font-family", "var(--font-mono)")
            .style("font-size", "11px")
            .text("ACLED recorded vs reported estimates • Blackout periods spotlight missingness");

        // dumbbells
        gapLayer.selectAll("line.gap")
            .data(gapData)
            .join("line")
            .attr("x1", d => xGap(d.acled))
            .attr("x2", d => xGap(d.real))
            .attr("y1", d => yGap(d.event))
            .attr("y2", d => yGap(d.event))
            .attr("stroke", "#bc1f1f")
            .attr("stroke-width", 4)
            .attr("stroke-linecap", "round");

        gapLayer.selectAll("circle.acled")
            .data(gapData)
            .join("circle")
            .attr("class", "acled")
            .attr("cx", d => xGap(d.acled))
            .attr("cy", d => yGap(d.event))
            .attr("r", 6)
            .attr("fill", "rgba(255,255,255,0.55)");
        gapLayer.selectAll("circle.acled")
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                tooltip.html(`
                <div style="margin-bottom: 6px; font-weight: 600; font-family: var(--font-mono); border-bottom: 1px solid var(--line); padding-bottom: 4px;">
                    ${d.event}
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px;">
                    <span style="color:var(--muted);">ACLED recorded:</span>
                    <strong>${d3.format(",")(d.acled)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px;">
                    <span style="color:var(--muted);">Reported estimate:</span>
                    <strong style="color:#d13438;">${d3.format(",")(d.real)}</strong>
                </div>
                <div style="margin-top:6px; color:var(--muted); font-size:0.78rem;">
                    Source: ${d.source || "—"}
                </div>
                `);

                const [mx, my] = d3.pointer(event, container.node());
                placeTooltip(mx, my);

                // small visible feedback
                d3.select(event.currentTarget).attr("r", 9);
            })
            .on("mousemove", (event) => {
                const [mx, my] = d3.pointer(event, container.node());
                placeTooltip(mx, my);
            })
            .on("mouseout", (event) => {
                tooltip.style("opacity", 0);
                d3.select(event.currentTarget).attr("r", 6);
            });

        gapLayer.selectAll("circle.real")
            .data(gapData)
            .join("circle")
            .attr("class", "real")
            .attr("cx", d => xGap(d.real))
            .attr("cy", d => yGap(d.event))
            .attr("r", 8)
            .attr("fill", "#bc1f1f");
        gapLayer.selectAll("circle.real")
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                // const x = event.clientX + window.scrollX;
                // const y = event.clientY + window.scrollY;

                tooltip.html(`
                <div style="margin-bottom: 6px; font-weight: 600; font-family: var(--font-mono); border-bottom: 1px solid var(--line); padding-bottom: 4px;">
                    ${d.event}
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px;">
                    <span style="color:var(--muted);">ACLED recorded:</span>
                    <strong>${d3.format(",")(d.acled)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px;">
                    <span style="color:var(--muted);">Reported estimate:</span>
                    <strong style="color:#d13438;">${d3.format(",")(d.real)}</strong>
                </div>
                <div style="margin-top:6px; color:var(--muted); font-size:0.78rem;">
                    Source: ${d.source || "—"}
                </div>
                `);

                // tooltip
                // .style("opacity", 1)
                // .style("left", (x + 15) + "px")
                // .style("top", (y - 28) + "px");
                const [mx, my] = d3.pointer(event, container.node());
                placeTooltip(mx, my);

                d3.select(event.currentTarget).attr("r", 11);
            })
            .on("mousemove", (event) => {
                const [mx, my] = d3.pointer(event, container.node());
                placeTooltip(mx, my);
            })
            .on("mouseout", (event) => {
                tooltip.style("opacity", 0);
                d3.select(event.currentTarget).attr("r", 8);
        });
        const legendX = width - m.right - 450;
        const legendY = m.top ;

        const legend = gapLayer.append("g")
        .attr("class", "gap-legend")
        .attr("transform", `translate(${legendX},${legendY})`)
        .style("font-family", "var(--font-mono)")
        .style("font-size", "11px");

        legend.append("circle")
        .attr("cx", 0).attr("cy", 0).attr("r", 6)
        .attr("fill", "rgba(255,255,255,0.55)");

        legend.append("text")
        .attr("x", 12).attr("y", 4)
        .attr("fill", "rgba(255,255,255,0.75)")
        .text("ACLED recorded");

        legend.append("circle")
        .attr("cx", 0).attr("cy", 18).attr("r", 8)
        .attr("fill", "#bc1f1f");

        legend.append("text")
        .attr("x", 12).attr("y", 22)
        .attr("fill", "rgba(255,255,255,0.75)")
        .text("Reported estimate");
        const bb = legend.node().getBBox();
        legend.insert("rect", ":first-child")
        .attr("x", bb.x - 10)
        .attr("y", bb.y - 8)
        .attr("width", bb.width + 20)
        .attr("height", bb.height + 16)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("fill", "rgba(0,0,0,0.25)")
        .attr("stroke", "rgba(255,255,255,0.14)")
        .attr("stroke-width", 1);
    }
    function stage1() {
        setHead("heatmap");
        heatLayer.style("opacity", 1).style("pointer-events", "all");
        heatLayer.select(".heat-legend").style("opacity", 1);
        gapLayer.style("opacity", 0).style("pointer-events", "none");

        cells.transition().duration(250).attr("opacity", 1);
    }

    function stage2() {
        setHead("spotlight");
        heatLayer.style("opacity", 1).style("pointer-events", "all");
        heatLayer.select(".heat-legend").style("opacity", 1);
        gapLayer.style("opacity", 0).style("pointer-events", "none");

        cells.transition().duration(250)
            .attr("opacity", d => {
            const isNov2019 = (d.year === 2019 && d.month === 11);
            const isFall2022 = (d.year === 2022 && d.month >= 9 && d.month <= 12);
            return (isNov2019 || isFall2022) ? 1 : 0.12;
            });
    }

    function stage3() {
        setHead("gap");
        buildGapOnce();

        heatLayer.style("opacity", 0).style("pointer-events", "none");
        heatLayer.select(".heat-legend").style("opacity", 0);
        gapLayer.style("opacity", 1).style("pointer-events", "all");
    }

    // Expose controls
    window.chart10Stages = { stage1, stage2, stage3 };

    // Default
    stage1();
  });

  
}

document.addEventListener("DOMContentLoaded", drawChart10);