# The Protector’s Shadow: When the Protector Becomes the Threat

Interactive Data Visualization Project  
MSc Data Visualization — Final Project  

Live Website:  
https://elasheidaei.github.io/conflict-patterns-analysis/

---

## 1. Project Overview

This project investigates the structural transformation of modern conflict,
arguing that contemporary violence increasingly manifests as internal repression
rather than traditional interstate warfare.

Through a narrative sequence of global trends, regional patterns, and focused case studies,
the project visualizes:

- The long-term shift in conflict typologies
- Civilian targeting patterns in the Middle East
- Protest–repression dynamics in Iran
- Reporting gaps during periods of censorship and blackout

The objective is not to establish causal claims, but to reveal structural patterns
through transparent and reproducible data transformations.

---

## 2. Narrative Structure

The website follows a four-chapter structure:

1. Global Conflict Transformation  
2. Regional Civilian Violence (Middle East)  
3. Structural Protest Patterns (Iran)  
4. The Void: Case Study & Reporting Gaps  

Each chapter relies on independently processed datasets documented below.

---

## 3. Data Sources

### 3.1 UCDP Conflict Data (via Our World in Data)

- Armed conflict deaths by type (1946–2024):  
  https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type.csv

- One-sided violence deaths:  
  https://ourworldindata.org/grapher/deaths-from-one-sided-violence.csv

Original source:  
Uppsala Conflict Data Program (UCDP)  
https://ucdp.uu.se/

---

### 3.2 ACLED — Armed Conflict Location & Event Data

- ACLED Middle East aggregated dataset  
  (Downloaded via ACLED Data Portal — subscription-based access)  
  https://acleddata.com/data-export-tool/

- Events targeting civilians (country-year aggregation)  
  https://acleddata.com/data-export-tool/

Note: ACLED data require registration and are not publicly downloadable without access credentials.

---

### 3.3 United Nations World Population Prospects

- Population data (WPP):  
  https://population.un.org/wpp/Download/Standard/CSV/

Used for per-capita normalization (ISO code merge).

---

### 3.4 HRANA — Iran 2022 Protest Documentation

Primary comprehensive report:  
https://www.en-hrana.org/a-comprehensive-report-of-the-first-82-days-of-nationwide-protests-in-iran/

Daily statistics compilation:  
https://github.com/justin-2028/Daily-Statistics-of-the-2022-Iran-Protests

Secondary reference:  
UK Parliament Commons Library Briefing (CBP-9679)  
https://commonslibrary.parliament.uk/research-briefings/cbp-9679/

---

### 3.5 Reporting Gap Context

- Reuters Special Report (Dec 23, 2019):  
  https://www.reuters.com/article/us-iran-protests-specialreport-idUSKBN1YR0QR

- NetBlocks (Nov 2019 Internet Shutdown):  
  https://netblocks.org/reports/internet-restored-in-iran-after-protest-shutdown-dAmqddA9

- NetBlocks (2022 Protest Disruptions):  
  https://netblocks.org/reports/internet-disrupted-in-iran-amid-protests-over-death-of-mahsa-amini-X8qVEwAD

---

## 4. Methodological Framework

All preprocessing was conducted in Python (Pandas).

Core operations include:

- Data harmonization (ISO codes, column standardization)
- Temporal filtering (chapter-specific ranges)
- Spatial and categorical aggregation
- Share computation and structural comparison
- Optional per-capita normalization
- Export of lightweight, chart-ready CSV/JSON files

No statistical imputation was performed.

Missing data were treated as uncertainty rather than corrected.

---

## 5. Chapter-Specific Data Pipelines

### Chapter 1 — Global Context
Notebook: `01_Data_Preprocessing_Global_Context.ipynb`

- Filter Entity == "World"
- Annual aggregation by conflict type
- One-sided violence country aggregation
- Optional population merge for per-capita normalization

Outputs:
- chart1_streamgraph.csv
- chart2_choropleth.csv
- chart2_choropleth_extended.csv
- chart3_lollipop.csv

---

### Chapter 2 — Regional Civilian Violence
Notebook: `02_Data_Preprocessing_Regional_Analysis.ipynb`

- Filter Middle East dataset (2017–2025)
- Spatial aggregation for dot map
- Country-level comparison (slope)
- Share computation for stacked bars

Outputs:
- chart4_dotmap.csv
- chart5_slope.csv
- chart6_stacked.csv

---

### Chapter 3 — Structural Protest Patterns (Iran)
Notebook: `03_Data_Preprocessing_Pattern.ipynb`

- Iran subset (2017–2025)
- Event-type filtering
- Monthly aggregation (dual-axis)
- Weekly distribution (ridgeline)

Outputs:
- chart7_dual_axis.csv
- chart8_ridgeline.csv

---

## 6. Reproducibility

To reproduce preprocessing:

1. Install Python 3.10+
2. Install dependencies:
```bash
pip install pandas numpy openpyxl
```


3. Run notebooks in order:

- 01_Data_Preprocessing_Global_Context.ipynb
- 02_Data_Preprocessing_Regional_Analysis.ipynb
- 03_Data_Preprocessing_Pattern.ipynb
- 04_Data_Preprocessing_The_Void.ipynb

To serve the website locally:
```bash
python -m http.server 8000
```


Open:
http://localhost:8000

---

## 7. Repository Structure

/PROJECT
│
├── css/                  → Website styling
├── data/
│   ├── raw/              → Original downloaded datasets
│   └── processed/        → Cleaned, aggregated CSVs used by charts
├── js/
│   ├── charts/           → D3 chart-specific scripts
│   ├── main.js           → Global interactions
│   └── scroll_chart10.js → Scroll-trigger logic
├── notebooks/            → Python preprocessing notebooks
├── index.html            → Main website
└── README.md             → Documentation


---

## 8. Limitations

- Conflict reporting depends on monitoring capacity and press freedom.
- Aggregation reduces local granularity.
- ACLED and UCDP represent documented cases, not exhaustive totals.
- The “reporting gap” framing is interpretative and does not modify datasets.

---

## 9. Ethical Note

Given the political sensitivity of the Iranian case study,
all figures are sourced from documented public reports.
The project avoids speculative correction of official datasets.
