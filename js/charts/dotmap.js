document.addEventListener("DOMContentLoaded", () => {

  const container = d3.select("#viz-dotmap");
  if (!container.node()) return;

  const width = container.node().getBoundingClientRect().width;
  const height = 400;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3.geoMercator();
  const path = d3.geoPath().projection(projection);

Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("data/processed/chart4_dotmap.csv"),
]).then(([world, data]) => {
    console.log(data[0]);
    // center of middle east
    projection
      .center([45, 30])
      .scale(width * 1.6)
      .translate([width / 2, height / 2]);
    // Draw map
    svg.append("g")
      .selectAll("path")
      .data(world.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#1a1d26")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5);

    // Clean data
    data = data.filter(d => d.lat && d.lon);

    data.forEach(d => {
      d.lat = +d.lat;
      d.lon = +d.lon;
      d.fatalities = +d.fatalities;
    });

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.fatalities)])
      .range([2, 10]);

    const colorScale = d3.scaleOrdinal()
      .domain(["Protests", "Violence against civilians", "Battles"])
      .range(["#4c78a8", "#d23b3b", "#888"]);

    const circles = svg.append("g")
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => projection([d.lon, d.lat])[0])
      .attr("cy", d => projection([d.lon, d.lat])[1])
      .attr("r", d => radiusScale(d.fatalities))
      .attr("fill", d => colorScale(d.type))
      .attr("opacity", 0.8);

    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(20,20,25,0.95)")
      .style("color", "#fff")
      .style("padding", "10px 14px")
      .style("border", "1px solid #444")
      .style("border-radius", "6px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    circles
      .on("mouseover", function(event, d) {
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.country}</strong><br/>
            ${d.admin1}<br/>
            Type: ${d.type}<br/>
            Fatalities: ${d.fatalities}
          `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      });

    function setLayer(layer) {
      if (layer === "All") {
        circles.style("opacity", 0.7);
      } else {
        circles.style("opacity", d =>
          d.type === layer ? 0.9 : 0.05
        );
      }
    }

    d3.select("#dotmap-layer").on("change", function () {
      const selected = this.value;
      console.log("Layer changed to:", selected);  // 👈 add this
      setLayer(selected);
    });

  }).catch(err => {
    console.error("Dotmap error:", err);
  });

});