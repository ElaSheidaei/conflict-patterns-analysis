async function drawStackedBar() {

  const margin = { top: 40, right: 40, bottom: 40, left: 140 };

  const container = d3.select("#viz-stacked100");
  const width = (container.node().getBoundingClientRect().width || 800) - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("body").append("div")
    .attr("class", "d3-tooltip")
    .style("position", "absolute")
    .style("background", "var(--card)")
    .style("color", "var(--text)")
    .style("padding", "10px 15px")
    .style("border", "1px solid var(--line)")
    .style("border-radius", "8px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("font-size", "0.85rem")
    .style("z-index", "100")
    .style("box-shadow", "var(--shadow)");

  const data = await d3.csv("data/processed/chart6_stacked.csv", d => ({
    country: d.COUNTRY,
    Military: +d.Military_pct,
    Civil: +d.Civil_pct,
    Repression: +d.Repression_pct
  }));

  const keys = ["Military", "Civil", "Repression"];

  const stack = d3.stack().keys(keys);
  const stackedData = stack(data);

  const y = d3.scaleBand()
    .domain(data.map(d => d.country))
    .range([0, height])
    .padding(0.3);

  const x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width]);

  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(["#4da3ff", "#888888", "#d23b3b"]);

  // Draw bars
  svg.append("g")
    .selectAll("g")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter()
    .append("rect")
    .attr("y", d => y(d.data.country))
    .attr("x", d => x(d[0]))
    .attr("height", y.bandwidth())
    .attr("width", d => x(d[1]) - x(d[0]))
    .on("mouseover", function(event, d) {
    tooltip
      .style("opacity", 1)
      .html(`
        <strong>${d.data.country}</strong><br/>
        ${d3.format(".1f")(d[1] - d[0])}%
      `)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        tooltip.style("opacity", 0);
    });

  // Y Axis
  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "#ccc");

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => d + "%"))
    .selectAll("text")
    .style("fill", "#ccc");

}


drawStackedBar();