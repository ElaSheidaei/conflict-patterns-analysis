// js/slope.js

async function drawSlopeChart() {
  const margin = { top: 40, right: 140, bottom: 40, left: 140 };

  const container = d3.select("#viz-slope");
  container.html(""); // clear previous svg if any

  const fullWidth = (container.node().getBoundingClientRect().width || 800);
  const fullHeight = 400;

  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .attr("viewBox", [0, 0, fullWidth, fullHeight])
    .style("font-family", "var(--font-body)")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // -----------------------------
  // 1. Load data (generic columns)
  // -----------------------------
  const raw = await d3.csv("data/processed/chart5_slope.csv");

  if (!raw.length || raw.columns.length < 3) {
    console.warn("chart5_slope.csv must have at least 3 columns");
    return;
  }

  const countryCol = raw.columns[0];
  const colA = raw.columns[1];
  const colB = raw.columns[2];

  const data = raw.map(d => ({
    country: d[countryCol],
    a: +d[colA],
    b: +d[colB]
  })).filter(d => d.a > 0 && d.b > 0); // log scale needs > 0

  const yMin = d3.min(data, d => Math.min(d.a, d.b));
  const yMax = d3.max(data, d => Math.max(d.a, d.b));

  // -----------------------------
  // 2. Scales & axes
  // -----------------------------
  const x = d3.scalePoint()
    .domain(["A", "B"])
    .range([0, width])
    .padding(0.5);

  // log scale like your current chart
  const y = d3.scaleLog()
    .domain([yMin, yMax])
    .range([height, 0])
    .nice();

  const yAxis = d3.axisLeft(y)
    .ticks(5, "~s");

  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis)
    .selectAll("text")
    .style("fill", "var(--muted)")
    .style("font-family", "var(--font-mono)")
    .style("font-size", "11px");

  svg.select(".y-axis .domain").attr("stroke", "var(--line)");
  svg.selectAll(".y-axis .tick line")
    .attr("stroke", "rgba(255,255,255,0.08)");

  // vertical helper lines (like examples)
  ["A", "B"].forEach(key => {
    svg.append("line")
      .attr("x1", x(key))
      .attr("x2", x(key))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-dasharray", "3,4");
  });

  // axis titles above
  svg.append("text")
    .attr("x", x("A"))
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("fill", "var(--muted)")
    .style("font-size", "11px")
    .style("font-family", "var(--font-mono)")
    .text(colA);

  svg.append("text")
    .attr("x", x("B"))
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("fill", "var(--muted)")
    .style("font-size", "11px")
    .style("font-family", "var(--font-mono)")
    .text(colB);

  // -----------------------------
  // 3. Lines + endpoints + labels
  // -----------------------------
  const formatValue = d3.format(",");    // 1,905,932
  const groups = svg.selectAll(".slope-group")
    .data(data)
    .join("g")
    .attr("class", "slope-group");

  const colorUp = "#d23b3b";   // red
  const colorDown = "#4da3ff"; // blue

  function lineColor(d) {
    return d.b >= d.a ? colorUp : colorDown;
  }

  // lines
  groups.append("line")
    .attr("class", "slope-line")
    .attr("x1", x("A"))
    .attr("x2", x("B"))
    .attr("y1", d => y(d.a))
    .attr("y2", d => y(d.b))
    .attr("stroke", d => lineColor(d))
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.5);

  // left circles
  groups.append("circle")
    .attr("cx", x("A"))
    .attr("cy", d => y(d.a))
    .attr("r", 4)
    .attr("fill", d => lineColor(d));

  // right circles
  groups.append("circle")
    .attr("cx", x("B"))
    .attr("cy", d => y(d.b))
    .attr("r", 4)
    .attr("fill", d => lineColor(d));

  // left labels: Country + valueA
  groups.append("text")
    .attr("class", "slope-label")
    .attr("x", x("A") - 8)
    .attr("y", d => y(d.a) + 4)
    .attr("text-anchor", "end")
    .style("fill", d => lineColor(d))
    .style("font-size", "11px")
    .style("font-family", "var(--font-mono)")
    .text(d => `${d.country} ${formatValue(d.a)}`);

  // right labels: valueB
  groups.append("text")
    .attr("class", "slope-label")
    .attr("x", x("B") + 8)
    .attr("y", d => y(d.b) + 4)
    .attr("text-anchor", "start")
    .style("fill", d => lineColor(d))
    .style("font-size", "11px")
    .style("font-family", "var(--font-mono)")
    .text(d => formatValue(d.b));

  // -----------------------------
  // 4. Hover interactions
  // -----------------------------
  groups
    .style("cursor", "pointer")
    .on("mouseover", function (_, d) {
      // fade others
      groups.selectAll(".slope-line")
        .attr("stroke-opacity", 0.08);

      d3.select(this).select(".slope-line")
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 3);

      d3.select(this).selectAll("circle")
        .attr("r", 5);

      d3.select(this).selectAll("text.slope-label")
        .style("font-weight", "600");
    })
    .on("mouseout", function () {
      groups.selectAll(".slope-line")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 2);

      groups.selectAll("circle")
        .attr("r", 4);

      groups.selectAll("text.slope-label")
        .style("font-weight", "400");
    });
}

// expose to main.js
window.drawSlopeChart = drawSlopeChart;