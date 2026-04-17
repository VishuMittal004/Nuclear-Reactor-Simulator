# Nuclear Reactor Simulation Dashboard

A high-fidelity, interactive, and scientifically-grounded nuclear reactor simulator built with React. This dashboard models a real-time neutron chain reaction, providing a professional interface for academic demonstration and physics exploration.

## Project Overview

This simulator provides a visual representation of a simplified nuclear reactor core. It uses a **point-kinetics model** to simulate neutron population dynamics based on user-controlled reactivity parameters.

### Core Physics Model

The simulation operates on the exponential growth/decay of the neutron population:
$$N(t+1) = N(t) \times k_{eff}$$

Where:
- **$N(t)$**: Neutron population at time $t$.
- **$k_{eff}$**: Effective multiplication factor.
  - **$k < 1$ (Subcritical)**: The reaction dies out.
  - **$k = 1$ (Critical)**: The reaction is stable (steady state).
  - **$k > 1$ (Supercritical)**: Explosive exponential growth.

---

## Key Features

- **Real-time Controls**: 
  - **Control Rods**: Adjust insertion percentage ($0\% - 100\%$) to absorb neutrons and lower $k_{eff}$.
  - **Neutron Source**: Inject external neutrons to jumpstart or stabilize the reaction.
  - **Fuel Efficiency**: Modify the fuel's fission cross-section to change reactivity.
- **Live Data Visualization**: 
  - Recharts-powered interactive line graph tracking neutron population over time.
  - Dynamic Y-axis auto-scaling and historical trend analysis.
- **Component-Based Dashboard**:
  - **Reactor Status Panel**: Visual core representation with animated criticality indicators.
  - **Metrics Dashboard**: Real-time display of $k_{eff}$, thermal power (MW), and doubling time.
- **Educational Layer**: 
  - Integrated tooltips and documentation explaining nuclear engineering concepts.
  - Clear visual feedback for reactor states (Stable, Supercritical, SCRAM Warning).
- **Performance-Ready**: Built on **React 19** and **Vite 8** for a buttery-smooth 60fps simulation loop.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Physics**: Custom JavaScript Point-Kinetics Engine

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Nuclear Phy PBL"
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Note: Use `--legacy-peer-deps` due to Vite 8 peer dependency requirements for Recharts)*

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## Project Structure

```text
/src
  /components
    ControlPanel.jsx   # UI sliders and simulation toggles
    GraphPanel.jsx     # Recharts integration and live trends
    StatusPanel.jsx    # Core visualizer and diagnostic metrics
  /utils
    physicsEngine.js   # The mathematical heart of the simulation
  App.jsx              # Main orchestrator and state management
  index.css            # Global styles and sci-fi theme tokens
index.html             # Entry point and SEO meta tags
```

---

## Educational Use Case

This tool is designed to help students and enthusiasts understand:
1. **Reactivity Control**: How control rods balance fission events.
2. **Criticality**: The fine line between a dying reaction and a runaway one.
3. **Power Scaling**: How thermal power output is proportional to neutron flux.

---

## Disclaimer

*This simulation is for educational purposes only. It uses simplified point-kinetics equations and does not account for complex variables like thermal-hydraulic feedback, delayed neutron precursors, or xenon poisoning.*

---

**Developed for the Nuclear Physics PBL Project by VIPANSHU MITTAL.**
