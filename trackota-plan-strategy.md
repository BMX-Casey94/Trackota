# TRD Dashboard - Customise Guide
**Hackathon:** Hack the Track (Toyota GR)  
**Approach:** Dashboard React + Connect Real APIs + Toyota Dataset

CONTEXT:
- This is a real-time analytics dashboard for Toyota GR Cup race engineers
- Target users: Race engineers making split-second pit stop decisions
- Design inspiration: Modern F1 broadcast graphics with glassmorphism aesthetic

LAYOUT & COMPONENTS:
1. Top Banner (full width):
   - Current lap counter (e.g., "LAP 24/45")
   - Live race status indicator with pulsing animation
   - Session type (Practice/Qualifying/Race)
   - Weather conditions mini-widget

2. Left Sidebar (30% width):
   - Live Race Metrics Card:
     * Current position (large, bold)
     * Gap to car ahead/behind (green/red indicators)
     * Tire compound with color-coded badge (Soft=Red, Medium=Yellow, Hard=White)
     * Laps on current tires with progress bar
     * Fuel level gauge with percentage
   
3. Main Center Area (45% width):
   - Large Tire Degradation Line Chart:
     * X-axis: Lap number
     * Y-axis: Lap time (seconds)
     * Gradient fill below line
     * Vertical reference line for current lap
     * Highlighted "pit window" zones (use semi-transparent overlay)
   
4. Right Sidebar (25% width):
   - Strategy Recommendation Cards (stacked):
     * Each card shows: Action, Lap number, Tire compound, Risk level
     * Use alert-style borders (blue for optimal, yellow for caution)
     * Include reasoning text
   - Scenario Simulator Controls:
     * Slider for "Pit on Lap X"
     * Dropdown for tire compound selection
     * "Simulate Safety Car" toggle button

5. Bottom Section:
   - Mini competitor position tracker showing Top 3 drivers

---

## 🎯 Project Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (TRD Dashboard React - Forked)          │
│  - Material UI v5 components                            │
│  - ApexCharts for visualisations                        │
│  - British English throughout                           │
│  - Custom pit strategy components                       │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP REST API
┌─────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI - Python)                             │
│  - Processes Toyota GR Cup dataset (CSV)                │
│  - Tyre degradation ML model                            │
│  - Pit strategy optimisation algorithm                  │
│  - Real-time simulation endpoints                       │
└─────────────────────────────────────────────────────────┘
                          ↕ Reads from
┌─────────────────────────────────────────────────────────┐
│  DATA LAYER                                             │
│  - Toyota GR Cup race telemetry (CSV from hackathon)    │
│  - Lap times, tyre compounds, pit stops                 │
│  - Historical race data                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Implementation Plan

### PHASE 1:

#### 1.1 Download Toyota GR Cup Dataset

```bash
# Create data directory in project root
mkdir -p data

# Go to https://trddev.com/hackathon-2025 and download ALL available datasets
# The dataset includes:
# - Race telemetry data (lap times, speeds, GPS)
# - Tyre compound information
# - Pit stop timings
# - Section/sector analysis files (S1.a, S1.b, S2.a, S2.b, S3.a, S3.b)
# - Vehicle identification data (chassis numbers, car numbers)
# - Official timing results

# Place downloaded files in: data/
# Expected structure:
# data/
#   ├── race_telemetry.csv
#   ├── pit_stops.csv
#   ├── lap_times.csv
#   ├── sector_analysis.csv
#   └── vehicle_info.csv
```

**Important Dataset Notes:**
- Vehicle ID format: `GR86-004-78` (chassis: 004, car number: 78)
- Lap counts may be erroneous (sometimes reported as lap #32768)
- Sections correspond to track map divisions (red lines + start/finish)
- Each section has two subsections (a and b)

#### 1.2 Setup Python Backend (Separate Directory)

```bash
# Go back to parent directory
cd ..

# Create backend directory alongside frontend
mkdir pit-strategy-backend
cd pit-strategy-backend

# Setup Python environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```
(etc, etc.)

