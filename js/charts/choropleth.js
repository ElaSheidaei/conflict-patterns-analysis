// js/chart2.js

// Global variables
let mapG, mapSvg, legendG;
let mapData = [];
let currentMode = 'absolute'; // 'absolute' or 'rate'

// --- COLOR SETTINGS ---
// 1. Absolute (Total Deaths)
// Reversed: Starts Light/Vibrant -> Ends Dark/Dried Blood
const ABS_LOW = "#cb7171";  // Light Red / Salmon (Low deaths)
const ABS_HIGH = "#500202"; // Deep Dark Red (High deaths)

// 2. Per Capita (Risk): "Toxic Theme"
const RATE_LOW = "#ebca97"; // Light Lavender
const RATE_HIGH = "#a53d04"; // Deep Purple

let colorScaleAbsolute, colorScaleRate;
let maxAbs, maxRate;

async function drawChoropleth() {
    const container = d3.select("#viz-choropleth");
    container.html(""); 

    const width = container.node().getBoundingClientRect().width || 800;
    const height = 500;

    // 1. Create SVG
    mapSvg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("background", "var(--bg)");

    // Layer 1: Map (Bottom)
    mapG = mapSvg.append("g").attr("class", "map-layer");

    // Layer 2: Legend (Top - Fixed)
    // Moved to Top-Left (20, 20) to avoid being hidden
    legendG = mapSvg.append("g")
        .attr("class", "legend-layer")
        .attr("transform", `translate(20, 30)`); 

    // Tooltip
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

    // 2. Load Data
    try {
        const [geoData, csvData] = await Promise.all([
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
            d3.csv("data/processed/chart2_choropleth_extended.csv") 
        ]);

        mapData = csvData;
        maxAbs = d3.max(csvData, d => +d.Fatalities);
        maxRate = d3.max(csvData, d => +d.Fatalities_Per_100k);

        // 3. Define Color Scales 
        // Using Log scale for Absolute to handle distinct outliers better
        colorScaleAbsolute = d3.scaleLog()
            .domain([100, maxAbs]) 
            .range([ABS_LOW, ABS_HIGH])
            .interpolate(d3.interpolateRgb);

        // Using Sqrt scale for Rate to balance the colors
        colorScaleRate = d3.scaleSqrt()
            .domain([0, maxRate]) 
            .range([RATE_LOW, RATE_HIGH])
            .interpolate(d3.interpolateRgb);

        // 4. Draw Map
        const projection = d3.geoNaturalEarth1().fitSize([width, height], geoData);
        const pathGenerator = d3.geoPath().projection(projection);

        mapG.selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("d", pathGenerator)
            .attr("fill", d => getColor(d.id))
            .attr("stroke", "#0b0c10")
            .attr("stroke-width", 0.3)
            .attr("cursor", "pointer")
            .on("mouseover", function(event, d) {
                const data = getData(d.id);
                
                // Highlight Border Only
                d3.select(this)
                    .transition().duration(100)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5);
                
                d3.select(this).raise();

                // Tooltip
                let content = `<strong>${d.properties.name}</strong><br/>`;
                if (data) {
                    content += `Total Deaths: <span style="color:${ABS_LOW}">${d3.format(",")(data.Fatalities)}</span><br/>`;
                    content += `Per 100k: <span style="color:${RATE_LOW}">${d3.format(".2f")(data.Fatalities_Per_100k)}</span>`;
                } else {
                    content += `<span style="color:var(--muted)">No data available</span>`;
                }

                tooltip.style("opacity", 1)
                       .html(content)
                       .style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition().duration(200)
                    .attr("stroke", "#0b0c10")
                    .attr("stroke-width", isZoomed ? 0.1 : 0.3);
                tooltip.style("opacity", 0);
            });

        // 5. Initial Setup
        drawLegend(currentMode);
        setupButtons();

    } catch (error) {
        console.error("Error:", error);
    }

    // --- Helpers ---
    function getData(code) { return mapData.find(d => d.Code === code); }

    function getColor(code) {
        const d = getData(code);
        if (!d) return "#1a1c24"; // No data
        
        if (currentMode === 'absolute') {
            return d.Fatalities > 0 ? colorScaleAbsolute(d.Fatalities) : "#1a1c24";
        } else {
            return d.Fatalities_Per_100k > 0 ? colorScaleRate(d.Fatalities_Per_100k) : "#1a1c24";
        }
    }

    // --- LEGEND FUNCTION (FIXED) ---
    function drawLegend(mode) {
        legendG.html(""); // Clear old legend

        // Definitions for Gradient
        const defs = mapSvg.append("defs");
        const gradientId = `grad-${mode}`;
        // Clean up old defs
        mapSvg.selectAll(`linearGradient`).remove(); 

        const linearGradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        // Set stops based on mode colors
        const startColor = mode === 'absolute' ? ABS_LOW : RATE_LOW;
        const endColor = mode === 'absolute' ? ABS_HIGH : RATE_HIGH;

        linearGradient.append("stop").attr("offset", "0%").attr("stop-color", startColor);
        linearGradient.append("stop").attr("offset", "100%").attr("stop-color", endColor);

        // Legend Background 
        legendG.append("rect")
            .attr("x", -10)
            .attr("y", -20)
            .attr("width", 180)
            .attr("height", 60)
            .attr("fill", "var(--bg)")
            .attr("opacity", 0.8)
            .attr("rx", 5);

        // Gradient Bar
        legendG.append("rect")
            .attr("width", 160)
            .attr("height", 12)
            .style("fill", `url(#${gradientId})`)
            .attr("rx", 2);

        // Labels
        const title = mode === 'absolute' ? "Total Fatalities" : "Deaths per 100k";
        const maxValText = mode === 'absolute' ? d3.format(".1s")(maxAbs) : d3.format(".1f")(maxRate);

        // Title
        legendG.append("text")
            .attr("x", 0)
            .attr("y", -6)
            .style("fill", "var(--text)")
            .style("font-size", "12px")
            .style("font-family", "var(--font-mono)")
            .text(title);

        // Min/Max Text
        legendG.append("text")
            .attr("x", 0)
            .attr("y", 24)
            .style("fill", "var(--muted)")
            .style("font-size", "10px")
            .text("Low");

        legendG.append("text")
            .attr("x", 160)
            .attr("y", 24)
            .attr("text-anchor", "end")
            .style("fill", "var(--muted)")
            .style("font-size", "10px")
            .text(maxValText);
    }

    function setupButtons() {
        const btnAbs = document.getElementById("btn-map-abs");
        const btnRate = document.getElementById("btn-map-rate");
        if(!btnAbs || !btnRate) return;

        // Clone to clear listeners
        const newAbs = btnAbs.cloneNode(true);
        const newRate = btnRate.cloneNode(true);
        btnAbs.parentNode.replaceChild(newAbs, btnAbs);
        btnRate.parentNode.replaceChild(newRate, btnRate);

        newAbs.addEventListener("click", () => {
            currentMode = 'absolute';
            updateView(newAbs);
        });

        newRate.addEventListener("click", () => {
            currentMode = 'rate';
            updateView(newRate);
        });
    }

    function updateView(activeBtn) {
        // Update Colors
        mapG.selectAll("path")
            .transition().duration(750)
            .attr("fill", d => getColor(d.id));
        
        // Update Legend
        drawLegend(currentMode);

        // Update Buttons
        document.querySelectorAll('.btn').forEach(b => b.setAttribute("aria-pressed", "false"));
        activeBtn.setAttribute("aria-pressed", "true");
    }
}

// Global Zoom 
let isZoomed = false;
window.zoomMap = function(targetRegion) {
    if (!mapG) return;
    const width = 800; const height = 500;

    if (targetRegion === 'mideast') {
        isZoomed = true;
        mapG.transition().duration(1500)
            .attr("transform", `translate(${-width * 1.7}, ${-height * 0.75}) scale(4.2)`);
        mapG.selectAll("path").transition().duration(1500).attr("stroke-width", 0.1);
    } else {
        isZoomed = false;
        mapG.transition().duration(1500)
            .attr("transform", "translate(0,0) scale(1)");
        mapG.selectAll("path").transition().duration(1500).attr("stroke-width", 0.3);
    }
};

document.addEventListener("DOMContentLoaded", drawChoropleth);