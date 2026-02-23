// js/chart8.js

function drawRidgelineChart() {
    const container = d3.select("#viz-ridgeline");
    container.html(""); // Clear previous content

    const width = container.node().getBoundingClientRect().width || 800;
    const height = 550; 
    const margin = { top: 10, right: 30, bottom: 220, left: 70 }; // Adjusted for labels

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("font-family", "var(--font-body)");

    // Tooltip setup (Kept your exact style)
    const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("background", "var(--card)")
        .style("color", "var(--text)")
        .style("padding", "10px 15px")
        .style("border", "1px solid var(--line)")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", "0.85rem")
        .style("z-index", "100")
        .style("box-shadow", "var(--shadow)");

    // Colors
    const colorBloody = "#d13438"; // Academic Crimson
    const colorNormal = "#5c7080"; // Muted Slate Blue/Gray

    d3.csv("data/processed/chart8_ridgeline.csv").then(data => {
        // Parse data for WEEKLY structure
        data.forEach(d => {
            d.WEEK_NUM = +d.WEEK_NUM;
            d.YEAR = d.YEAR.toString();
            d.Events = +d.Events;
            d.Fatalities = +d.Fatalities;
        });

        // Get unique years and sort chronologically (Newest at top usually looks best for Ridgeline, but sorting oldest at top works too)
        const years = Array.from(new Set(data.map(d => d.YEAR))).sort((a, b) => b - a);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const dataByYear = d3.group(data, d => d.YEAR);

        // --- SCALES ---
        
        // X Axis: Weeks (1 to 53)
        const x = d3.scaleLinear()
            .domain([1, 53])
            .range([margin.left, width - margin.right]);

        // Y Axis: Years (Position of each baseline)
        const y = d3.scalePoint()
            .domain(years)
            .range([margin.top, height - margin.bottom])
            .padding(0.5);

        // Z Axis: Height of the peaks (Fatalities)
        // OVERLAP MAGIC: Multiplying by 3.5 allows the tallest peaks to overlap up to 3.5 rows above!
        const maxPeakHeight = y.step() * 3.5;
        const z = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Fatalities)])
            .range([0, -maxPeakHeight]); 

        // --- AXES ---
        
        // X Axis (Approximate Months mapped to Weeks)
        const monthWeeks = [3, 7, 11, 16, 20, 24, 29, 33, 37, 42, 46, 50];
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x)
                .tickValues(monthWeeks)
                .tickFormat((d, i) => monthNames[i])
            );
            
        xAxis.select(".domain").attr("stroke", "var(--line)");
        xAxis.selectAll(".tick line").attr("stroke", "var(--line)");
        xAxis.selectAll(".tick text").attr("fill", "var(--muted)").style("font-family", "var(--font-mono)");

        // Explicit X-Axis Label ("Month")
        xAxis.append("text")
            .attr("x", margin.left + (width - margin.left - margin.right) / 2)
            .attr("y", 40) // Position below ticks
            .attr("fill", "var(--text)")
            .style("font-family", "var(--font-mono)")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("letter-spacing", "0.5px")
            .attr("text-anchor", "middle")
            .text("Month of the Year");

        // Y Axis (Years)
        const yAxis = svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickSize(0));

        yAxis.select(".domain").remove();
        yAxis.selectAll(".tick text")
            .attr("fill", d => (d === "2019" || d === "2022") ? colorBloody : "var(--text)")
            .style("font-family", "var(--font-mono)")
            .style("font-weight", d => (d === "2019" || d === "2022") ? "bold" : "600")
            .style("font-size", "12px")
            .attr("dx", "-10");

        // Explicit Y-Axis Label ("Year")
        yAxis.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 2))
            .attr("fill", "var(--text)")
            .style("font-family", "var(--font-mono)")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("letter-spacing", "0.5px")
            .attr("text-anchor", "middle")
            .text("Year");

        // --- DRAW RIDGES ---

        // area/line generators with curveBasis for smooth natural mountains
        const area = d3.area()
            .x(d => x(d.WEEK_NUM))
            .y0(0) 
            .y1(d => z(d.Fatalities)) 
            .curve(d3.curveBasis); 

        const line = d3.line()
            .x(d => x(d.WEEK_NUM))
            .y(d => z(d.Fatalities))
            .curve(d3.curveBasis);

        // Group for each year
        const yearGroups = svg.selectAll(".year-group")
            .data(years)
            .join("g")
            .attr("class", "year-group")
            .attr("transform", d => `translate(0,${y(d)})`);

        // Baseline for each year (makes the lanes very clear)
        yearGroups.append("line")
            .attr("x1", margin.left)
            .attr("x2", width - margin.right)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "var(--line)")
            .attr("stroke-width", 1)
            .attr("opacity", 0.5);

        // Draw areas (Highlighting 2019 and 2022)
        yearGroups.append("path")
            .datum(d => dataByYear.get(d) || [])
            .attr("fill", d => {
                const year = d[0] ? d[0].YEAR : "";
                return (year === "2019" || year === "2022") ? colorBloody : colorNormal;
            }) 
            .attr("fill-opacity", d => {
                const year = d[0] ? d[0].YEAR : "";
                return (year === "2019" || year === "2022") ? 0.8 : 0.3;
            })
            .attr("stroke", "none")
            .attr("d", area);

        // Draw lines on top of the ridges
        yearGroups.append("path")
            .datum(d => dataByYear.get(d) || [])
            .attr("fill", "none")
            .attr("stroke", d => {
                const year = d[0] ? d[0].YEAR : "";
                return (year === "2019" || year === "2022") ? "#8a1c1f" : "var(--line)";
            }) 
            .attr("stroke-width", d => {
                const year = d[0] ? d[0].YEAR : "";
                return (year === "2019" || year === "2022") ? 2 : 1;
            })
            .attr("d", line);

        // --- INVISIBLE HOVER OVERLAY ---
        // Catch mouse smoothly on the exact peaks
        svg.append("g").selectAll(".hover-dot")
            .data(data.filter(d => d.Fatalities > 10)) // Only attach dots where there are actual fatalities
            .join("circle")
            .attr("class", "hover-dot")
            .attr("cx", d => x(d.WEEK_NUM))
            .attr("cy", d => y(d.YEAR) + (z(d.Fatalities) * 0.66))
            .attr("r", 25) // Large invisible radius for easy hovering
            .attr("fill", "transparent")
            .style("pointer-events", "all")
            .on("mouseover", function(event, d) {
                // Dim all ridges slightly to highlight the current hover
                svg.selectAll(".year-group path").attr("opacity", 0.3);

                // Show a small visible dot where hovered
                d3.select(this)
                    .attr("fill", "var(--bg)")
                    .attr("stroke", colorBloody)
                    .attr("stroke-width", 2)
                    .attr("r", 5);

                // Approximate Month Name from Week Number for Tooltip
                const approxMonthIndex = Math.floor((d.WEEK_NUM - 1) / 4.4);
                const approxMonth = monthNames[Math.min(approxMonthIndex, 11)];

                // Populate Tooltip
                tooltip.html(`
                    <div style="margin-bottom: 6px; font-weight: 600; font-family: var(--font-mono); font-size: 0.9em; border-bottom: 1px solid var(--line); padding-bottom: 4px;">
                        ~${approxMonth} ${d.YEAR}
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color:${colorBloody};">● Fatalities:</span> 
                        <strong style="margin-left: 15px;">${d3.format(",")(d.Fatalities)}</strong>
                    </div>
                `)
                .style("opacity", 1)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                // Restore ridges back to their original defined opacities based on year
                svg.selectAll(".year-group path")
                   .attr("opacity", 1); // We rely on fill-opacity being set correctly earlier
                
                // Hide dot and tooltip
                d3.select(this)
                    .attr("fill", "transparent")
                    .attr("stroke", "none")
                    .attr("r", 15);
                tooltip.style("opacity", 0);
            });
    });
}

document.addEventListener("DOMContentLoaded", drawRidgelineChart);