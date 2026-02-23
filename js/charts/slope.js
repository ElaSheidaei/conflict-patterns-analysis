async function drawSlopeChart() {

    const margin = { top: 40, right: 120, bottom: 40, left: 80 };

    const container = d3.select("#viz-slope");
    const width = (container.node().getBoundingClientRect().width || 800) - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#viz-slope")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

        const data = await d3.csv("data/processed/chart5_slope.csv", d => ({
        country: d.country,
        y2017: +d.year_2017,
        y2025: +d.year_2025
        }));

        console.log("Loaded data:", data);

        const yMax = d3.max(data, d => Math.max(d.y2017, d.y2025));
        console.log("Computed yMax:", yMax);

        const raw = await d3.csv("data/processed/chart5_slope.csv");
        console.log("Raw keys:", Object.keys(raw[0]));

        const maxChange = d3.max(data, d =>
            Math.abs(d.y2025 - d.y2017)
            );

            const widthScale = d3.scaleLinear()
            .domain([0, maxChange])
            .range([1.5, 6]);
        

    const y = d3.scaleLog()
        .domain([1, yMax])
        .range([height, 0]);

    const x = d3.scalePoint()
        .domain(["2017", "2025"])
        .range([0, width]);

    // Y Axis
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6, "~s"))
        
    // X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("line")
        .attr("x1", x("2025"))
        .attr("x2", x("2025"))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .attr("opacity", 0.6);

    // Group for each country
    const groups = svg.selectAll(".slope-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "slope-group");

    // Lines
    groups.append("line")
        .attr("class", "slope-line")
        .attr("x1", x("2017"))
        .attr("x2", x("2025"))
        .attr("y1", d => y(d.y2017))
        .attr("y2", d => y(d.y2025))
        .attr("stroke", d =>
        d.y2025 > d.y2017 ? "#d23b3b" : "#5c88c9"
        )
        .attr("stroke-width", d =>
            widthScale(Math.abs(d.y2025 - d.y2017)))
        .attr("opacity", 0.8);

    // Circles 2017
    groups.append("circle")
        .attr("cx", x("2017"))
        .attr("cy", d => y(d.y2017))
        .attr("r", 4)
        .attr("fill", "#999");

    // Circles 2025
    groups.append("circle")
        .attr("cx", x("2025"))
        .attr("cy", d => y(d.y2025))
        .attr("r", 4)
        .attr("fill", "#999");

    // Country labels (right side)
    groups.append("text")
        .attr("x", x("2025") + 8)
        .attr("y", d => y(d.y2025))
        .attr("dy", "0.35em")
        .attr("class", "slope-label")
        .text(d => d.country);

    // Hover interaction
    groups
        .on("mouseover", function() {
        d3.selectAll(".slope-line").attr("opacity", 0.15);
        d3.select(this).select(".slope-line")
            .attr("stroke-width", 4)
            .attr("opacity", 1);
        })
        .on("mouseout", function() {
        d3.selectAll(".slope-line")
            .attr("opacity", 0.8);
        });


}