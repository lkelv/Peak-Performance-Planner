import * as THREE from 'three'

// ╔══════════════════════════════════════════════════════════════════╗
// ║                    TUNING CONSTANTS                              ║
// ║  All visual positioning, sizing and speed lives here.            ║
// ║  Change these first before touching any component file.          ║
// ╚══════════════════════════════════════════════════════════════════╝



// ─────────────────────────────────────────────────────────────────
// CAMERA
// Interesting cam_pos: (5, 2, 10), (20, 2, 10), (20, 2.6, 13)
// Look:                (8, 3, -1), (8, 3, -1),  (-50, 2, -50)
// FOV:                 20        , 20           , 10
// ─────────────────────────────────────────────────────────────────
export const CAM_POS       = new THREE.Vector3(5, 2, 10)
export const CAM_LOOK      = new THREE.Vector3(8, 3, -1)
export const CAM_FOV       = 20

// Zoomed-out starting position — camera pans in to CAM_POS when climbing begins
export const CAM_POS_START = new THREE.Vector3(20, 2.6, 13)   // pulled back & slightly lower
export const CAM_FOV_START = 30                                // wider FOV = more zoomed out
export const CAM_LOOK_START = new THREE.Vector3(12, 2.5, 0)
export const CAM_INTRO_SEC = 2.2                               // seconds to complete the pan

// ─────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────
export const AVATAR_POS:   [number, number, number] = [6.7, 1.724, 3.3]
export const AVATAR_SCALE: number = 0.4

// ─────────────────────────────────────────────────────────────────
// WORLD GROUP
// WORLD_OFFSET_X/Y/Z : translate the world group origin.
// ROTATION_DIR       : 1.0 = clockwise,  -1.0 = counter-clockwise
// ─────────────────────────────────────────────────────────────────
export const WORLD_OFFSET_X: number =  0.0
export const WORLD_OFFSET_Y: number =  0.0
export const WORLD_OFFSET_Z: number =  0.0
export const ROTATION_DIR:   number = -1.0

// ─────────────────────────────────────────────────────────────────
// SCROLL & ROTATION SPEED
// CLIMB_SPEED : world-units/second everything scrolls downward.
// ROT_SPEED   : radians/second the world group rotates around Y.
// ─────────────────────────────────────────────────────────────────
const OVERALL_SPEED: number = 10 //0.75 is good
export const CLIMB_SPEED: number = 0.1*OVERALL_SPEED
export const ROT_SPEED:   number = 0.0944*OVERALL_SPEED

// ─────────────────────────────────────────────────────────────────
// GLB MOUNTAIN SECTION
// ─────────────────────────────────────────────────────────────────
export const GLB_PATH:           string = '/mountain.glb'
export const SECTION_SCALE:      number = 1
export const SECTION_HEIGHT:     number = 3.328
export const RECYCLE_THRESHOLD:  number = -SECTION_HEIGHT * 2.4
export const SECTION_OFFSET_X:   number = 0
export const SECTION_OFFSET_Z:   number = 0.0
export const SECTION_ROTATION_Y: number = -10

// ─────────────────────────────────────────────────────────────────
// CLOUD BANK
// CLOUD_SPAWN_INTERVAL : mountain recycles between each cloud event.
// CLOUD_ABOVE_OFFSET   : world-units above top section on cloud reset.
// ─────────────────────────────────────────────────────────────────
export const CLOUD_SPAWN_INTERVAL: number = 30
export const CLOUD_ABOVE_OFFSET:   number = 30

// ─────────────────────────────────────────────────────────────────
// DAY / NIGHT CYCLE  (Fix #3)
// ─────────────────────────────────────────────────────────────────
// TIME PERIODS  (hour of day, 0–24)
// ──────────────────────────────────────────────────────────────
// DAWN  : 5–7    Sun rises, warm pinks/oranges wash the sky
// DAY   : 7–18   Full daylight, blue sky
// DUSK  : 18–20  Golden hour, deep orange horizon
// NIGHT : 20–5   Dark sky, moon and stars

export const TIME_DAWN_START:  number = 5.0   // hour when dawn begins
export const TIME_DAY_START:   number = 7.0   // hour when full day begins
export const TIME_DUSK_START:  number = 18.0  // hour when dusk begins
export const TIME_NIGHT_START: number = 20.0  // hour when full night begins

// SUN / MOON ORBIT
// The celestial body follows a semicircular arc.
// These control the arc radius and its center height offset.
export const CELESTIAL_ORBIT_RADIUS: number = 180  // world-units, arc radius
export const CELESTIAL_HEIGHT_PEAK:  number = 120  // max Y height at solar noon / midnight
export const CELESTIAL_HEIGHT_MIN:   number = -30  // Y when at horizon (slightly below = hidden)

// SUN appearance
export const SUN_RADIUS:       number = 7     // geometry radius of sun disk
export const SUN_HALO_RADIUS:  number = 13    // geometry radius of outer glow ring
export const SUN_HALO_OPACITY: number = 0.22  // transparency of the halo ring
export const SUN_COLOR_DAY:    string = '#fffde0'  // sun disc color during full day
export const SUN_COLOR_DUSK:   string = '#ff9040'  // sun disc color at dusk/dawn
export const SUN_HALO_COLOR:   string = '#fff5aa'  // halo tint (day)
export const SUN_HALO_COLOR_DUSK: string = '#ff6010' // halo tint at dusk/dawn

// MOON appearance
export const MOON_RADIUS:      number = 5     // geometry radius of moon disk
export const MOON_HALO_RADIUS: number = 9     // geometry radius of moon glow ring
export const MOON_HALO_OPACITY: number = 0.15 // transparency of moon halo
export const MOON_COLOR:       string = '#d8e8ff'  // moon disc colour
export const MOON_HALO_COLOR:  string = '#8899cc'  // moon halo tint

// AMBIENT LIGHT intensities per period
export const AMBIENT_INTENSITY_DAY:   number = 1.8
export const AMBIENT_INTENSITY_DUSK:  number = 1.1
export const AMBIENT_INTENSITY_NIGHT: number = 0.3

// AMBIENT LIGHT colours per period
export const AMBIENT_COLOR_DAY:   string = '#c8ddf0'  // cool daylight blue
export const AMBIENT_COLOR_DUSK:  string = '#d09060'  // warm dusk orange
export const AMBIENT_COLOR_NIGHT: string = '#1a2040'  // cold deep-blue night

// DIRECTIONAL (sun) LIGHT intensities per period
export const DIRLIGHT_INTENSITY_DAY:   number = 3.5
export const DIRLIGHT_INTENSITY_DUSK:  number = 2.0
export const DIRLIGHT_INTENSITY_NIGHT: number = 0.0  // no sun at night

// DIRECTIONAL (moon/fill) LIGHT intensities per period
export const MOONLIGHT_INTENSITY_NIGHT: number = 0.35
export const MOONLIGHT_COLOR:           string = '#aabbdd'

// HEMISPHERE LIGHT  (sky colour, ground colour, intensity) per period
export const HEMI_SKY_DAY:    string = '#aad4f5'
export const HEMI_GND_DAY:    string = '#4a7a30'
export const HEMI_INT_DAY:    number = 0.9

export const HEMI_SKY_DUSK:   string = '#e08050'
export const HEMI_GND_DUSK:   string = '#5a3a10'
export const HEMI_INT_DUSK:   number = 0.6

export const HEMI_SKY_NIGHT:  string = '#0a1428'
export const HEMI_GND_NIGHT:  string = '#0a0e18'
export const HEMI_INT_NIGHT:  number = 0.25

// SKY SHADER COLOURS per period  (horizon, mid, zenith, ground)
// Each tuple: [horizon, mid, zenith, ground]
export const SKY_COLORS_DAY = {
  horizon: [0.88, 0.92, 0.98],
  mid:     [0.42, 0.66, 0.92],
  zenith:  [0.12, 0.32, 0.72],
  ground:  [0.30, 0.38, 0.22],
}
export const SKY_COLORS_DUSK = {
  horizon: [0.95, 0.55, 0.20],
  mid:     [0.70, 0.35, 0.25],
  zenith:  [0.18, 0.14, 0.35],
  ground:  [0.22, 0.16, 0.10],
}
export const SKY_COLORS_NIGHT = {
  horizon: [0.04, 0.06, 0.14],
  mid:     [0.03, 0.04, 0.12],
  zenith:  [0.01, 0.02, 0.08],
  ground:  [0.02, 0.03, 0.06],
}

// ─────────────────────────────────────────────────────────────────
// FLOOR (Fix #1)
// Y position at which the floor plane spawns on startup.
// ─────────────────────────────────────────────────────────────────
export const FLOOR_SPAWN_Y: number = 0   // world-units; 0 = ground level

// ─────────────────────────────────────────────────────────────────
// Helix path constants (used by Floor / buildTerrainGeo)
// ─────────────────────────────────────────────────────────────────
export const SEGS              = 320
export const BAND              = 24
export const TURNS             = 3
export const HELIX_RADIUS      = 5.6
export const HELIX_HEIGHT      = 28
export const RIBBON_WIDTH_BASE = 3.2
export const RIBBON_WIDTH_TAPER = 0.55
export const RIBBON_SLOPE_DROP = 0.55

export function helixPt(t: number): THREE.Vector3 {
  const angle = t * TURNS * Math.PI * 2
  return new THREE.Vector3(
    Math.cos(angle) * HELIX_RADIUS,
    t * HELIX_HEIGHT,
    Math.sin(angle) * HELIX_RADIUS,
  )
}

// Legacy constants kept for World.tsx / Floor.tsx compatibility
export const FLOOR_HEIGHT   = HELIX_HEIGHT
export const SCROLL_SPEED   = 0.04
export const CLOUD_T        = 0.5
export const HELIX_TOTAL_ANGLE = TURNS * Math.PI * 2
export const PATH_START_T   = 0.0

export type FloorState = {
  key:    number
  localY: number
}