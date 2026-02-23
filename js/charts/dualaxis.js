// js/chart7.js

function drawDualAxisChart() {
    const container = d3.select("#viz-dualaxis");
    container.html(""); // Clear previous content

    const width = container.node().getBoundingClientRect().width || 800;
    const height = 450;
    const margin = { top: 40, right: 70, bottom: 100, left: 60 }; 

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("font-family", "var(--font-body)");

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("background", "var(--card)")
        .style("color", "var(--text)")
        .style("padding", "10px 15px")
        .style("border", "1px solid var(--line)")
        .style("border-radius", "4px") // Sharper corners for academic look
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", "0.85rem")
        .style("z-index", "100")
        .style("box-shadow", "var(--shadow)");

    const parseTime = d3.timeParse("%Y-%m");
    const formatTime = d3.timeFormat("%b %Y");

    // Academic Colors
    const colorProtests = "#5c7080"; // Muted Slate Blue/Gray
    const colorFatalities = "#d13438"; // Deep Crimson

    d3.csv("data/processed/chart7_dual_axis.csv").then(data => {
        data.forEach(d => {
            d.date = parseTime(d.YEAR_MONTH);
            d.protests = +d.Protest_Events;
            d.fatalities = +d.Civilian_Fatalities;
        });

        data.sort((a, b) => a.date - b.date);

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([margin.left, width - margin.right]);

        const yLeft = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.protests) * 1.1])
            .range([height - margin.bottom, margin.top]);

        const yRight = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.fatalities) * 1.1])
            .range([height - margin.bottom, margin.top]);

        // --- GRIDLINES (Academic aesthetic) ---
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yLeft)
                .ticks(6)
                .tickSize(-(width - margin.left - margin.right))
                .tickFormat("")
            )
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line")
                .attr("stroke", "var(--line)")
                .attr("stroke-opacity", 0.4)
                .attr("stroke-dasharray", "3,3")
            );

        // --- AXES ---
        const xAxisGroup = svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(formatTime));
            
        xAxisGroup.select(".domain").attr("stroke", "var(--line)");
        xAxisGroup.selectAll(".tick line").attr("stroke", "var(--line)");
        xAxisGroup.selectAll(".tick text").attr("fill", "var(--muted)").style("font-family", "var(--font-mono)");

        // Y Axis Left (Protests)
        const yAxisLeft = svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yLeft).ticks(6));

        yAxisLeft.select(".domain").remove();
        yAxisLeft.selectAll(".tick line").attr("stroke", "none");
        yAxisLeft.selectAll(".tick text").attr("fill", colorProtests).style("font-family", "var(--font-mono)");
        
        yAxisLeft.append("text")
            .attr("x", -margin.top)
            .attr("y", -45)
            .attr("fill", colorProtests)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .text("Protest Events");

        // Y Axis Right (Fatalities)
        const yAxisRight = svg.append("g")
            .attr("transform", `translate(${width - margin.right},0)`)
            .call(d3.axisRight(yRight).ticks(6));

        yAxisRight.select(".domain").remove();
        yAxisRight.selectAll(".tick line").attr("stroke", "none");
        yAxisRight.selectAll(".tick text").attr("fill", colorFatalities).style("font-family", "var(--font-mono)");

        yAxisRight.append("text")
            .attr("x", -margin.top)
            .attr("y", 45)
            .attr("fill", colorFatalities)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .text("Civilian Fatalities");

        // --- DRAW LINES ---

        // 1. Protests Line (Thicker, more stable)
        const lineProtests = d3.line()
            .x(d => x(d.date))
            .y(d => yLeft(d.protests))
            .curve(d3.curveMonotoneX); // Smooths the curve slightly

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", colorProtests)
            .attr("stroke-width", 2.5)
            .attr("d", lineProtests);

        // 2. Fatalities Line (Sharper, slightly thinner)
        const lineFatalities = d3.line()
            .x(d => x(d.date))
            .y(d => yRight(d.fatalities))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", colorFatalities)
            .attr("stroke-width", 2)
            .attr("d", lineFatalities);

        // --- INTERACTIONS ---
        const focus = svg.append("g").style("display", "none");

        focus.append("line")
            .attr("class", "hover-line")
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .style("stroke", "var(--muted)")
            .style("stroke-width", "1px")
            .style("stroke-dasharray", "4,4");

        const circleProtest = focus.append("circle").attr("r", 4.5).attr("fill", colorProtests).attr("stroke", "var(--card)").attr("stroke-width", 2);
        const circleFatality = focus.append("circle").attr("r", 4.5).attr("fill", colorFatalities).attr("stroke", "var(--card)").attr("stroke-width", 2);

        svg.append("rect")
            .attr("width", width - margin.left - margin.right)
            .attr("height", height - margin.top - margin.bottom)
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => { focus.style("display", null); tooltip.style("opacity", 1); })
            .on("mouseout", () => { focus.style("display", "none"); tooltip.style("opacity", 0); })
            .on("mousemove", mousemove);

        const bisectDate = d3.bisector(d => d.date).left;

        function mousemove(event) {
            const x0 = x.invert(d3.pointer(event)[0] + margin.left);
            const i = bisectDate(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            let d = d0;
            if (d1) {
                d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            }

            focus.select(".hover-line").attr("transform", `translate(${x(d.date)}, 0)`);
            circleProtest.attr("transform", `translate(${x(d.date)}, ${yLeft(d.protests)})`);
            circleFatality.attr("transform", `translate(${x(d.date)}, ${yRight(d.fatalities)})`);

            tooltip.html(`
                <div style="margin-bottom: 6px; font-weight: 600; font-family: var(--font-mono); font-size: 0.9em; border-bottom: 1px solid var(--line); padding-bottom: 4px;">
                    ${formatTime(d.date)}
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span style="color:${colorProtests};">● Protests:</span> 
                    <strong style="margin-left: 15px;">${d3.format(",")(d.protests)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color:${colorFatalities};">● Fatalities:</span> 
                    <strong style="margin-left: 15px;">${d3.format(",")(d.fatalities)}</strong>
                </div>
            `)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        }
    });
}

document.addEventListener("DOMContentLoaded", drawDualAxisChart);