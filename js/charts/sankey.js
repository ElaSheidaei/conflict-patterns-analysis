// js/chart9.js

function drawSankeyChart() {
    const container = d3.select("#viz-sankey");
    container.html(""); // Clear previous content

    // Ensure d3.sankey is loaded
    if (typeof d3.sankey !== "function") {
        container.html("<p style='color:red;'>Error: d3-sankey library is missing. Please add the script tag to index.html.</p>");
        return;
    }

    const width = container.node().getBoundingClientRect().width || 800;
    const height = 550;
    const margin = { top: 20, right: 50, bottom: 200, left: 40 }; // Extra right margin for long labels

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
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", "0.85rem")
        .style("z-index", "100")
        .style("box-shadow", "var(--shadow)");

    d3.csv("data/processed/chart9_sankey.csv").then(data => {
        
        // 1. Prepare Nodes and Links
        const nodesSet = new Set();
        data.forEach(d => {
            nodesSet.add(d.source);
            nodesSet.add(d.target);
        });

        // Create an array of node objects
        const nodes = Array.from(nodesSet).map(name => ({ name }));

        // Map names to their index
        const nodeMap = new Map(nodes.map((node, i) => [node.name, i]));

        // Create links
        const links = data.map(d => ({
            source: nodeMap.get(d.source),
            target: nodeMap.get(d.target),
            value: +d.value
        }));

        // 2. Setup Sankey generator
        const sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(40) // Space between nodes vertically
            .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

        // Generate the Sankey layout
        const { nodes: graphNodes, links: graphLinks } = sankey({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links.map(d => Object.assign({}, d))
        });

        // 3. Color Logic
        function getNodeColor(name) {
            if (name === "Killed" || name === "Executed") return "#d13438"; // Blood Red
            if (name === "Status Unknown (The Void)") return "#222222"; // Deep Black/Void
            if (name === "Protesters") return "#5c7080"; // Muted Slate
            if (name === "Released on Bail") return "#8b9ba8"; // Lighter gray
            return "#404040"; // Dark gray for arrests/prison
        }
        // function getNodeColor(name) {
        //     if (name === "Killed" || name === "Executed") return "#e63946";  // stronger red
        //     if (name === "Status Unknown (The Void)") return "#0f172a";      // deep navy, not black
        //     if (name === "Protesters") return "#94a3b8";                     // light slate
        //     if (name === "Arrested") return "#64748b";                       // mid slate
        //     if (name === "Identified / Tracked") return "#cbd5e1";           // light gray
        //     if (name === "Released on Bail") return "#a8b5c2";
        //     if (name === "Sentenced to Prison") return "#475569";
        //     return "#334155";
        // }

        // 4. Draw Links (The flows)
        const link = svg.append("g")
            .attr("fill", "none")
            .attr("stroke-opacity", 0.55)
            .selectAll("g")
            .data(graphLinks)
            .join("g")
            .style("mix-blend-mode", "screen");

        const path = link.append("path")
            // .attr("d", d3.sankeyLinkHorizontal())
            // .attr("stroke", d => getNodeColor(d.target.name)) // Color flow by its destination
            // .attr("stroke-width", d => Math.max(2, d.width))
            // .style("transition", "stroke-opacity 0.2s");
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", d => getNodeColor(d.target.name))
            .attr("stroke-width", d => Math.max(2, d.width))
            .attr("fill", "none")
            .attr("stroke-opacity", 0.55)
            .style("cursor", "pointer");

        

        // Link Interactions
        path.on("mouseover", function(event, d) {
            d3.selectAll("path").attr("stroke-opacity", 0.1); // Dim others
            d3.select(this).attr("stroke-opacity", 0.7); // Highlight current

            tooltip.html(`
                <div style="margin-bottom: 5px; font-family: var(--font-mono); font-size: 0.9em; border-bottom: 1px solid var(--line); padding-bottom: 4px;">
                    <strong>${d.source.name} ➔ ${d.target.name}</strong>
                </div>
                <div>Volume: <strong>${d3.format(",")(d.value)}</strong> individuals</div>
                <div style="margin-top: 8px; font-size: 0.75rem; color: var(--muted); font-style: italic; border-top: 1px dotted var(--line); padding-top: 4px;">
                    Cumulative estimate (HRANA-compiled), Feb 21 2023
                </div>
            `)
            .style("opacity", 1)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.selectAll("path").attr("stroke-opacity", 0.3);
            tooltip.style("opacity", 0);
        });

        // 5. Draw Nodes (The blocks)
        const node = svg.append("g")
            .selectAll("rect")
            .data(graphNodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => Math.max(1, d.y1 - d.y0))
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => getNodeColor(d.name))
            .attr("stroke", "var(--bg)")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer");

       // Node Interactions
        node.on("mouseover", function(event, d) {
            tooltip.html(`
                <div style="font-family: var(--font-mono); font-weight: bold;">${d.name}</div>
                <div>Total: <strong>${d3.format(",")(d.value)}</strong></div>
                <div style="margin-top: 8px; font-size: 0.75rem; color: var(--muted); font-style: italic; border-top: 1px dotted var(--line); padding-top: 4px;">
                    Cumulative estimate (HRANA-compiled), Feb 21 2023
                </div>
            `)
            .style("opacity", 1)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });

        // 6. Draw Node Labels
        svg.append("g")
            .style("font-family", "var(--font-mono)")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .attr("fill", "var(--text)")
            .selectAll("text")
            .data(graphNodes)
            .join("text")
            .attr("x", d => d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", d => {
                // Shift 'Identified / Tracked' up slightly
                if (d.name === "Identified / Tracked") return "-0.1em"; 
                // Shift 'Released on Bail' down slightly
                if (d.name === "Released on Bail") return "0.9em";      
                // Default vertical centering for all other labels
                return "0.35em";                                        
            })
            .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
            .text(d => d.name)
            // Add custom coloring to text labels for extreme emphasis on "The Void" and "Killed"
            .attr("fill", d => {
                if (d.name === "Killed" || d.name === "Executed") return "#ff4d4d";
                if (d.name === "Status Unknown (The Void)") return "var(--text)"; 
                return "var(--text)";
            })
            // Make "The Void" font even more prominent
            .style("font-style", "normal")
            .style("font-size", "11px");

        });
}

document.addEventListener("DOMContentLoaded", drawSankeyChart);