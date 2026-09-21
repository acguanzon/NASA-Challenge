# CLPS Lunar Mission Browser: Architecture & Implementation Plan

An interactive, high-precision 3D geospatial dashboard and ephemeris calculation system for exploring NASA's Commercial Lunar Payload Services (CLPS) missions, surface landing sites, and environmental parameters.

---

## 1. Context & Scope Verification

### System Architecture Stack
- **Frontend:** React / Vite / TypeScript with Three.js & `@react-three/fiber` (or CesiumJS) for photorealistic 3D lunar rendering, client-side NASA LOLA elevation/bump mapping, landing coordinate pins, daylight terminator shaders, and mission trajectories.
- **Backend:** Python FastAPI service (`/api/astro`, `/api/missions`, `/api/spatial`) providing sub-solar point vectors, Earth Direct-to-Earth (DTE) look angles (azimuth/elevation), illumination schedules, and terrain clearance models.
- **Data Engine:** IAU 2000 Moon planetary reference frame (`moon_pa_de440` compliant orientation matrices, selenographic coordinate transformations, and sub-solar/sub-Earth coordinates calculated with high-precision analytical ephemeris in pure NumPy).
- **Spatial Catalog & Schema:** PostgreSQL + PostGIS SQL DDL (IAU 2000 Moon CRS) with a bundled JSON/SQLite local spatial engine for immediate standalone operation and zero-dependency development.

---

## 2. User Review Required

> [!IMPORTANT]
> **Planetary Coordinate Standard Adherence**
> Lunar landing coordinates are standardized as:
> - **Latitude:** `[-90.0°, +90.0°]` (North positive)
> - **Longitude:** `[0.0°, 360.0°]` or `[-180.0°, +180.0°]` (East positive)
> - **Elevation / Radius:** Referenced to the mean lunar radius $R_{Moon} = 1737.4\text{ km}$.
> Any mission without a landed fix (e.g. future task orders or candidate landing ellipses) will be explicitly designated as **"Target Candidate Region"**.

> [!NOTE]
> **Backend Service Architecture**
> Because external Python package installation to PyPI is firewalled in this environment, the FastAPI ephemeris engine will run on the pre-installed standard stack (`fastapi`, `uvicorn`, `pydantic`, `numpy`, `scipy`, `SQLAlchemy`), utilizing our built-in high-precision IAU Moon libration and JPL planetary ephemeris vector math modules.

---

## 3. Open Questions

1. **3D Engine Preference:** Would you prefer **Three.js** with custom GLSL lunar shaders (instant load, procedural high-res LOLA normal mapping, custom terminator and Earth-vector illumination) or **CesiumJS** (via Cesium npm package)? *Recommendation: Three.js for smooth client-side performance, customized mission marker overlays, and zero third-party token reliance.*
2. **Launch Timeline Baseline:** Should the dashboard default to real-time ephemeris (current timestamp) or provide an interactive orbital timeline slider (e.g. scrubbing between 2024 and 2027 to observe illumination cycles at Malapert A, Reiner Gamma, and Schrödinger Basin)? *Recommendation: Provide interactive time-scrubbing with a "Live Now" toggle.*

---

## 4. Proposed Changes & Components

### Component A: Full-Stack Project Scaffolding
- Initialize the root workspace structure:
  - `frontend/`: Vite + React + TypeScript + Lucide-react + Tailwind/Custom NASA Glassmorphism UI tokens.
  - `backend/`: Python FastAPI astronomical calculation microservice.
  - `data/`: Canonical CLPS mission catalog, payload specs, and PostGIS schema DDL.

---

### Component B: Backend Astro & Ephemeris Engine (`backend/`)
#### [NEW] [main.py](file:///d:/coding%20apps/NASA/backend/main.py)
- FastAPI app exposing endpoints:
  - `GET /api/missions`: Filter and query CLPS missions by vendor, status, or landing site.
  - `GET /api/missions/{id}`: Full mission specification, scientific payloads, and coordinate telemetry.
  - `POST /api/astro/surface-vectors`: Calculate Sun & Earth azimuth, elevation, and DTE line-of-sight for given lunar coordinates at an epoch.
  - `GET /api/astro/subsolar-point`: Ephemeris of current sub-solar and sub-Earth selenographic coordinates.
  - `GET /api/astro/polar-illumination`: Calculate multi-day illumination profile for polar sites (e.g. Malapert Mountain, Shackleton rim).

#### [NEW] [astro_engine.py](file:///d:/coding%20apps/NASA/backend/astro_engine.py)
- Selenocentric and selenographic vector transformation math using IAU 2000 Moon rotation model:
  - Calculation of Moon orientation pole $(\alpha_0, \delta_0)$ and prime meridian location $W$.
  - Earth-Moon-Sun vector geometry for Direct-to-Earth (DTE) comms and solar array incident angles.
  - Horizon coordinate conversion: Azimuth $(0^{\circ} \text{ North}, 90^{\circ} \text{ East})$ and Elevation above the local lunar tangent plane.

#### [NEW] [missions_db.py](file:///d:/coding%20apps/NASA/backend/missions_db.py)
- Structured dataset of all CLPS task orders:
  - **IM-1 (Intuitive Machines / Nova-C "Odysseus")**: Malapert A ($80.13^\circ\text{S}, 1.44^\circ\text{E}$), Landed Feb 2024.
  - **IM-2 (Intuitive Machines / Nova-C "Athena")**: Shackleton Connecting Ridge ($89.44^\circ\text{S}, 222.6^\circ\text{E}$), Target Candidate Region.
  - **IM-3 (Intuitive Machines / Nova-C)**: Reiner Gamma ($7.5^\circ\text{N}, 301.0^\circ\text{E}$), Target Candidate Region.
  - **TO-20A (Firefly Aerospace / Blue Ghost Mission 1)**: Mare Crisium ($18.56^\circ\text{N}, 61.81^\circ\text{E}$), Target Candidate Region.
  - **Blue Ghost Mission 2**: Far Side / Lunar South Pole, Target Candidate Region.
  - **TO-2-AB (Astrobotic / Peregrine Mission 1)**: Sinus Viscositatis target, Launch Jan 2024 (Lunar delivery lost in transit).
  - **TO-20B (Astrobotic / Griffin Mission 1)**: Nobile Crater / South Pole ($85.2^\circ\text{S}, 36.1^\circ\text{E}$), Target Candidate Region.
  - **TO-CP-12 (Draper / SERIES-2 "Apex 1.0")**: Schrödinger Basin ($75.0^\circ\text{S}, 132.5^\circ\text{E}$), Target Candidate Region.

#### [NEW] [schema.sql](file:///d:/coding%20apps/NASA/data/schema.sql)
- Production-grade PostgreSQL + PostGIS DDL for Moon spatial layers (SRID definition for IAU Moon 2000 sphere $R=1737400\text{m}$, spatial index on `GEOMETRY(PointZ, 0)`).

---

### Component C: Frontend 3D Geospatial Dashboard (`frontend/`)
#### [NEW] [LunarGlobe.tsx](file:///d:/coding%20apps/NASA/frontend/src/components/LunarGlobe.tsx)
- 3D interactive lunar globe:
  - Realistic NASA Moon albedo & LOLA displacement/bump textures.
  - Dynamic directional sun-vector lighting synchronized with the ephemeris calculations.
  - Visual lunar equator, prime meridian, and coordinate grid lines.
  - 3D landing site pins with vendor-coded badges and status beacons.
  - Interactive smooth camera fly-to on mission selection.
  - Polar stereographic focus mode for lunar South Pole exploration.

#### [NEW] [MissionDetailPanel.tsx](file:///d:/coding%20apps/NASA/frontend/src/components/MissionDetailPanel.tsx)
- Mission telemetry and science breakdown:
  - Vendor branding, lander specifications, target region coordinates.
  - Payload list with mass (kg), sponsoring institutions, and scientific objectives.
  - Real-time Sun & Earth azimuth/elevation dials and DTE communication status.
  - Solar elevation curve over the lunar synodic month (29.5 Earth days).

#### [NEW] [EnvironmentalGauges.tsx](file:///d:/coding%20apps/NASA/frontend/src/components/EnvironmentalGauges.tsx)
- Solar illumination percentage indicator.
- DTE visibility status (LOS - Line of Sight vs. lunar occultation).
- Local surface elevation and slope warning indicators.

#### [NEW] [MissionFilterBar.tsx](file:///d:/coding%20apps/NASA/frontend/src/components/MissionFilterBar.tsx)
- Filtering by:
  - Vendor (Intuitive Machines, Firefly, Astrobotic, Draper).
  - Status (Landed, Candidate, Planned, Past).
  - Target Region (South Pole, Equatorial, Far Side).

---

## 5. Verification Plan

### Automated Tests
- Python tests for `astro_engine.py`:
  - Verify sub-solar point coordinates match JPL Horizons reference within $\pm 0.1^\circ$.
  - Verify polar elevation calculations: Sun elevation at Malapert A ($80.13^\circ\text{S}$) remains low ($\approx \pm 1.5^\circ$ seasonal variation).
  - Verify API endpoints return valid JSON compliant with Pydantic schemas.
- Frontend build validation:
  - Run `npm run build` in `frontend/` to ensure zero TypeScript or bundling errors.

### Manual Verification
- Launch both FastAPI backend and Vite frontend.
- Verify 3D lunar globe renders smoothly with mouse orbit/pan/zoom controls.
- Click on IM-1 (Odysseus) landing site: verify camera flies smoothly to Malapert A coordinates, data drawer expands with all 6 NASA payloads, and solar/Earth vectors render accurately.
- Toggle between South Pole missions (IM-1, IM-2, Griffin-1) and equatorial/near-side missions (Firefly Blue Ghost 1 at Mare Crisium, IM-3 at Reiner Gamma).
