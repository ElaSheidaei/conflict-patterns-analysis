// js/chart1.js

function drawStreamgraph() {
  const container = d3.select("#viz-streamgraph");
  container.html("");

  const width = container.node().getBoundingClientRect().width || 800;
  const height = 400;
  const margin = { top: 40, right: 175, bottom: 50, left: 60 };

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("font-family", "var(--font-body)");

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "d3-tooltip")
    .style("position", "absolute")
    .style("background", "var(--card)")
    .style("color", "var(--text)")
    .style("padding", "10px 15px")
    .style("border", "1px solid var(--line)")
    .style("border-radius", "8px")
    .style("box-shadow", "var(--shadow)")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("font-size", "0.85rem")
    .style("z-index", "100");

  const MIN_YEAR = 2000; //  start from 2000

  d3.csv("data/processed/chart1_streamgraph.csv").then(raw => {

    raw.forEach(d => {
      d.Year = +d.Year;
      d.Interstate = +d.Interstate;
      d.Intrastate = +d.Intrastate;
      d["One-sided violence"] = +d["One-sided violence"];
      d["Non-state"] = +d["Non-state"];
    });

    //  Filter years
    const data = raw.filter(d => d.Year >= MIN_YEAR);

    const keys = ["Non-state", "Interstate", "One-sided violence","Intrastate"];

    // STACKED AREA (baseline 0) instead of silhouette
    const stack = d3.stack()
      .keys(keys)
      .offset(d3.stackOffsetNone);

    const series = stack(data);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.Year))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(series, s => d3.max(s, d => d[1]))])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(["Non-state", "Interstate", "One-sided violence", "Intrastate"])
      .range([
        "#8d6e63", // Non-state: Dark Amber / Dirty Yellow 
        "#37474f", // Interstate: Cold Blue-Gray 
        "#670C0F", // One-sided violence: Deep Crimson / Blood Red 
        "#bf360c"  // Intrastate
      ]);

    const area = d3.area()
      .curve(d3.curveCatmullRom.alpha(0.6)) // smooth + elegant
      .x(d => x(d.data.Year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));

    // layers
    const paths = svg.selectAll("path.layer")
      .data(series)
      .join("path")
      .attr("class", "layer")
      .attr("fill", d => color(d.key))
      .attr("d", area)
      .attr("stroke", "var(--bg)")
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        d3.selectAll(".layer").style("opacity", 0.15);
        d3.select(this).style("opacity", 1).attr("stroke-width", 2);
        tooltip.style("opacity", 1);
      })
      .on("mousemove", function (event, d) {
        const mouseX = d3.pointer(event, this)[0];
        const hoveredYear = Math.round(x.invert(mouseX));
        const yearData = data.find(row => row.Year === hoveredYear);
        const value = yearData ? yearData[d.key] : 0;

        tooltip.html(`
          <strong style="color:${color(d.key)}">${d.key}</strong><br/>
          Year: ${hoveredYear}<br/>
          Deaths: <strong>${d3.format(",")(value)}</strong>
        `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        d3.selectAll(".layer").style("opacity", 1).attr("stroke-width", 0.5);
        tooltip.style("opacity", 0);
      });

    // X axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(8))
      .call(g => g.select(".domain").attr("stroke", "var(--line)"))
      .call(g => g.selectAll(".tick line").attr("stroke", "var(--line)"))
      .call(g => g.selectAll(".tick text").attr("fill", "var(--muted)").style("font-family", "var(--font-mono)"));

    // // Y axis (now meaningful!)
    // svg.append("g")
    //   .attr("transform", `translate(${margin.left},0)`)
    //   .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(".2s")))
    //   .call(g => g.select(".domain").attr("stroke", "var(--line)"))
    //   .call(g => g.selectAll(".tick line").attr("stroke", "var(--line)"))
    //   .call(g => g.selectAll(".tick text").attr("fill", "var(--muted)").style("font-family", "var(--font-mono)"));

    // Labels
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", margin.top - 12)
      .attr("fill", "var(--muted)")
      .style("font-size", "12px")
      .style("font-family", "var(--font-mono)")
      .text("Deaths (stacked total)");

    svg.append("text")
      .attr("x", (width - margin.right + margin.left) / 2)
      .attr("y", height - 12)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--muted)")
      .style("font-size", "12px")
      .style("font-family", "var(--font-mono)")
      .text("Year");

    // Legend (with hover isolate)
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    keys.slice().reverse().forEach((key, i) => {
      const row = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`)
        .on("mouseover", () => {
          d3.selectAll(".layer").style("opacity", d => d.key === key ? 1 : 0.1);
        })
        .on("mouseout", () => {
          d3.selectAll(".layer").style("opacity", 1);
        });

      row.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(key))
        .attr("rx", 2);

      row.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .attr("fill", "var(--text)")
        .style("font-size", "12px")
        .style("font-family", "var(--font-mono)")
        .text(key);
    });

  });
}

document.addEventListener("DOMContentLoaded", drawStreamgraph);
