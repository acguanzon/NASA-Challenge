-- =====================================================================
-- CLPS Lunar Mission Browser: PostGIS Spatial Schema
-- Reference Ellipsoid: IAU 2000 Moon Mean Radius R = 1,737,400 m
-- Spatial Reference System: Moon 2000 Equirectangular / Geocentric
-- =====================================================================

-- 1. Custom Spatial Reference for Lunar Coordinates (Moon 2000)
-- SRID 930100 represents Moon 2000 Sphere (R=1737400m)
INSERT INTO spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text)
VALUES (
    930100,
    'IAU2000',
    30100,
    'GEOGCS["Moon 2000",DATUM["D_Moon_2000",SPHEROID["Moon_2000_IAU_IAG",1737400.0,0.0]],PRIMEM["Reference_Meridian",0.0],UNIT["Degree",0.0174532925199433]]',
    '+proj=longlat +a=1737400 +b=1737400 +no_defs'
)
ON CONFLICT (srid) DO NOTHING;

-- 2. Vendors Table
CREATE TABLE IF NOT EXISTS clps_vendors (
    vendor_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    lander_class VARCHAR(100) NOT NULL,
    payload_capacity_kg NUMERIC(8, 2),
    website_url TEXT
);

-- 3. CLPS Missions Table
CREATE TABLE IF NOT EXISTS clps_missions (
    mission_id VARCHAR(60) PRIMARY KEY,
    task_order VARCHAR(40) NOT NULL,
    vendor_id VARCHAR(50) REFERENCES clps_vendors(vendor_id),
    lander_name VARCHAR(100) NOT NULL,
    target_region VARCHAR(120) NOT NULL,
    
    -- Planetary Coordinates (IAU Moon 2000)
    latitude_deg NUMERIC(8, 5) NOT NULL CHECK (latitude_deg BETWEEN -90.0 AND 90.0),
    longitude_deg NUMERIC(8, 5) NOT NULL CHECK (longitude_deg BETWEEN -180.0 AND 360.0),
    elevation_km NUMERIC(8, 3) DEFAULT 0.0,
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    designation_status VARCHAR(40) NOT NULL DEFAULT 'Target Candidate Region',
    
    -- PostGIS Geometry Point (SRID 930100)
    geom_moon GEOMETRY(PointZ, 930100),
    
    -- Mission Timeline
    launch_date TIMESTAMPTZ,
    landing_date TIMESTAMPTZ,
    end_of_mission TIMESTAMPTZ,
    mission_status VARCHAR(40) NOT NULL,
    
    -- Telemetry & Overview
    description TEXT,
    landing_accuracy_m NUMERIC(8, 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Spatial Lunar Queries (e.g. within distance of South Pole)
CREATE INDEX IF NOT EXISTS idx_clps_missions_geom ON clps_missions USING GIST (geom_moon);
CREATE INDEX IF NOT EXISTS idx_clps_missions_vendor ON clps_missions (vendor_id);
CREATE INDEX IF NOT EXISTS idx_clps_missions_status ON clps_missions (mission_status);

-- 4. Payloads Table
CREATE TABLE IF NOT EXISTS clps_payloads (
    payload_id VARCHAR(80) PRIMARY KEY,
    mission_id VARCHAR(60) REFERENCES clps_missions(mission_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    acronym VARCHAR(30),
    lead_organization VARCHAR(120) NOT NULL,
    mass_kg NUMERIC(7, 2),
    science_objective TEXT NOT NULL,
    instrument_type VARCHAR(60)
);
