// js/chart3.js

// Helper function to shorten long country names for the Y-axis only
function shortenName(name) {
    if (name === "Democratic Republic of Congo") return "DR Congo";
    return name;
}

function drawLollipop() {
    const container = d3.select("#viz-lollipop");
    container.html(""); // Clear previous content

    const width = container.node().getBoundingClientRect().width || 800;
    const height = 450;
    const margin = { top: 30, right: 60, bottom: 120, left: 100 }; // Increased bottom margin for explicit axis label

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("font-family", "var(--font-body)");

    // Tooltip setup (Satisfies Interaction Requirement)
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

    // Load Data
    d3.csv("data/processed/chart3_lollipop.csv").then(data => {
        // Parse strings to integers
        data.forEach(d => d.EVENTS = +d.EVENTS);

        // Sort data: Smallest to largest (D3 draws Y-axis from bottom to top)
        data.sort((a, b) => a.EVENTS - b.EVENTS);

        // Scales
        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.EVENTS) * 1.15]) // Add 15% padding for the text labels
            .range([margin.left, width - margin.right]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.COUNTRY))
            .range([height - margin.bottom, margin.top])
            .padding(1);

        // --- X AXIS AND EXPLICIT LABEL ---
        const xAxisGroup = svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(".2s")));
            
        xAxisGroup.select(".domain").attr("stroke", "var(--line)");
        xAxisGroup.selectAll(".tick line").attr("stroke", "var(--line)");
        xAxisGroup.selectAll(".tick text").attr("fill", "var(--muted)").style("font-family", "var(--font-mono)");

        // Explicit X-Axis Label attached directly to the axis group
        xAxisGroup.append("text")
            .attr("x", margin.left + (width - margin.left - margin.right) / 2) // Center horizontally
            .attr("y", 35) // Position exactly 45 pixels below the axis line
            .attr("text-anchor", "middle")
            .style("fill", "var(--text)")
            .style("font-size", "12px")
            .style("font-family", "var(--font-mono)")
            .style("letter-spacing", "0.5px")
            .text("Total Number of Recorded Events (2017-2025)"); // Explicit label text
        

        // Y Axis (using shortened names)
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickSize(0).tickFormat(d => shortenName(d)))
            .call(g => g.select(".domain").remove()) // Remove the vertical axis line for a cleaner look
            .call(g => g.selectAll(".tick text")
                .attr("fill", "var(--text)")
                .style("font-size", "13px")
                .style("font-weight", "500")
                .attr("dx", "-10")
            );

        // Draw Lollipops
        const lollipops = svg.selectAll(".lollipop")
            .data(data)
            .join("g")
            .attr("class", "lollipop")
            .style("cursor", "pointer");

        // Stems (The lines)
        lollipops.append("line")
            .attr("class", "stem")
            .attr("x1", x(0))
            .attr("x2", d => x(d.EVENTS))
            .attr("y1", d => y(d.COUNTRY))
            .attr("y2", d => y(d.COUNTRY))
            .attr("stroke", "var(--line)")
            .attr("stroke-width", 2);

        // Candies (The circles)
        lollipops.append("circle")
            .attr("class", "candy")
            .attr("cx", d => x(d.EVENTS))
            .attr("cy", d => y(d.COUNTRY))
            .attr("r", 6)
            .attr("fill", "var(--accent)") // Blood red
            .attr("stroke", "var(--bg)")
            .attr("stroke-width", 1.5);

        // Value Labels at the end of each lollipop
        lollipops.append("text")
            .attr("class", "value-label")
            .attr("x", d => x(d.EVENTS) + 12)
            .attr("y", d => y(d.COUNTRY) + 4)
            .style("fill", "var(--muted)")
            .style("font-size", "11px")
            .style("font-family", "var(--font-mono)")
            .text(d => d3.format(",")(d.EVENTS));

        // Interactions (Hover effects)
        lollipops.on("mouseover", function(event, d) {
            d3.selectAll(".lollipop").style("opacity", 0.3); // Dim others
            
            const current = d3.select(this);
            current.style("opacity", 1);
            
            // Highlight current stem and candy
            current.select(".stem").attr("stroke", "var(--text)").attr("stroke-width", 3);
            current.select(".candy").attr("r", 9).attr("fill", "#ff1744"); // Brighter red
            current.select(".value-label").style("fill", "var(--text)").style("font-weight", "bold");

            // Show full name and exact data in tooltip
            tooltip.style("opacity", 1)
                   .html(`
                       <strong>${d.COUNTRY}</strong><br/>
                       Total Events: <span style="color:var(--accent)">${d3.format(",")(d.EVENTS)}</span>
                   `)
                   .style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Restore original styles
            d3.selectAll(".lollipop").style("opacity", 1);
            const current = d3.select(this);
            
            current.select(".stem").attr("stroke", "var(--line)").attr("stroke-width", 2);
            current.select(".candy").attr("r", 6).attr("fill", "var(--accent)");
            current.select(".value-label").style("fill", "var(--muted)").style("font-weight", "normal");

            tooltip.style("opacity", 0);
        });
    });
}

document.addEventListener("DOMContentLoaded", drawLollipop);