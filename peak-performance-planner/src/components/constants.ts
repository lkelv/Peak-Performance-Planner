import * as THREE from 'three'

// ╔══════════════════════════════════════════════════════════════════╗
// ║                    TUNING CONSTANTS                              ║
// ║  All visual positioning, sizing and speed lives here.            ║
// ║  Change these first before touching any component file.          ║
// ╚══════════════════════════════════════════════════════════════════╝

// ─────────────────────────────────────────────────────────────────
// CAMERA
// CAM_POS   : where the camera sits in world space
//             x = left(-) / right(+)
//             y = down(-)  / up(+)      ← raise this to look more top-down
//             z = forward(-) / back(+)  ← increase to zoom out
// CAM_LOOK  : the point the camera stares at
//             push z negative to aim further up the path
// CAM_FOV   : field of view in degrees (40=telephoto, 80=wide)
// ─────────────────────────────────────────────────────────────────
export const CAM_POS  = new THREE.Vector3(-5,  20,  -5)
export const CAM_LOOK = new THREE.Vector3(0,0,0)
export const CAM_FOV  = 50

// ─────────────────────────────────────────────────────────────────
// AVATAR
// AVATAR_POS : fixed world-space position of the humanoid
//              x = left/right offset from screen centre
//              y = vertical height above the floor
//              z = forward/back along camera axis (negative = further from cam)
// AVATAR_SCALE : uniform scale (1.0 = default size)
// ─────────────────────────────────────────────────────────────────
export const AVATAR_POS:   [number, number, number] = [9.5, 0, -4]
export const AVATAR_SCALE: number = 1

// ─────────────────────────────────────────────────────────────────
// WORLD / PATH ALIGNMENT
// WORLD_OFFSET_X : shift entire world left(-) / right(+) to move path
//                  under the avatar's feet
// WORLD_OFFSET_Z : shift world forward(-) / back(+)
//                  ← most useful: positive pushes path origin behind avatar
// WORLD_OFFSET_Y : extra vertical nudge (usually keep at 0)
// PATH_START_T   : fraction [0–1] along the helix where the avatar
//                  starts. Adjust so the path segment under the avatar
//                  is flat (not on a steep section).
//                  0.0 = very start of helix, 0.5 = halfway up
// ─────────────────────────────────────────────────────────────────
export const WORLD_OFFSET_X: number =  0.0
export const WORLD_OFFSET_Z: number =  0.0
export const WORLD_OFFSET_Y: number =  0.0
export const PATH_START_T:   number =  0.0   // adjusts initial scroll offset
export const ROTATION_DIR: number = 1.0   // 1.0 = clockwise, -1.0 = counterclockwise

// ─────────────────────────────────────────────────────────────────
// HELIX / PATH SHAPE
// HELIX_RADIUS_BASE  : radius at the bottom of the spiral (wide)
// HELIX_RADIUS_TAPER : how much radius shrinks per floor (0=cylinder, 1=sharp cone)
// HELIX_TURNS        : how many times the path winds around per floor
// FLOOR_HEIGHT       : vertical height of one floor in world units
// PATH_WIDTH         : width of the rendered path tube
// PATH_GLOW_WIDTH    : width of the glow tube around the path
// ─────────────────────────────────────────────────────────────────
export const HELIX_RADIUS_BASE:  number = 9.5
export const HELIX_RADIUS_TAPER: number = 0   // multiply: radius * (1 - t * TAPER)
export const TURNS:              number = 2
export const FLOOR_HEIGHT:       number = 28
export const PATH_WIDTH:         number = 0.14
export const PATH_GLOW_WIDTH:    number = 0.22

// ─────────────────────────────────────────────────────────────────
// TERRAIN RIBBON
// RIBBON_WIDTH_BASE  : how wide the ribbon is at the bottom
// RIBBON_WIDTH_TAPER : how much it narrows toward the top (0 = constant)
// RIBBON_SLOPE_DROP  : outer edge drops this many units below inner edge
//                      (increase for steeper-looking hillside)
// SEGS               : longitudinal resolution (more = smoother, slower)
// BAND               : cross-section resolution (more = smoother edge)
// ─────────────────────────────────────────────────────────────────
export const RIBBON_WIDTH_BASE:  number = 5.5
export const RIBBON_WIDTH_TAPER: number = 0
export const RIBBON_SLOPE_DROP:  number = 0
export const SEGS:               number = 260
export const BAND:               number = 10

// ─────────────────────────────────────────────────────────────────
// SCROLL SPEED
// FLOOR_SECONDS : how many seconds it takes to climb one full floor
//                 lower = faster climbing
// ─────────────────────────────────────────────────────────────────
export const FLOOR_SECONDS: number = 12
export const SCROLL_SPEED = FLOOR_HEIGHT / (60 * FLOOR_SECONDS)

// ─────────────────────────────────────────────────────────────────
// FLOOR SWAP DELAY
// FLOOR_SWAP_DELAY_MS : milliseconds to wait after crossing a floor
//                       boundary before unmounting the previous floor.
//                       Gives the cloud bank time to fully cover the
//                       scene before the old geometry disappears.
//                       Set to 0 to swap instantly.
// ─────────────────────────────────────────────────────────────────
export const FLOOR_SWAP_DELAY_MS: number = 0

// ─────────────────────────────────────────────────────────────────
// CLOUD BANK
// CLOUD_T     : fraction [0–1] along a floor where the cloud layer sits
//               0.82 = 82% of the way up each floor
// CLOUD_FADE  : units below cloud layer where fade-in starts
// CLOUD_THICK : units above cloud layer before fully transparent again
// ─────────────────────────────────────────────────────────────────
export const CLOUD_T:     number = 0.82
export const CLOUD_FADE:  number = 6
export const CLOUD_THICK: number = 4

// ─────────────────────────────────────────────────────────────────
// GLB MOUNTAIN HALVES  (MountainHalf / MountainWorld)
// HALF_HEIGHT      : world-space vertical height of one GLB section.
//                    Must match the actual bounding-box height of your
//                    Mountain_Left.glb / Mountain_Right.glb models.
//                    Check this first after importing your GLBs —
//                    if sections don't connect, this is the knob to turn.
// CLIMB_SPEED      : world-units per second the avatar travels upward
//                    while isClimbing=true.  Lower = slower ascent.
// SWAP_FRAC        : fraction [0–1] through the current section at which
//                    the next half is swapped in and the bottom removed.
//                    0.5 = exactly halfway (safe default).
//                    Lower values swap earlier (more overlap buffer).
// CLOUD_FRAC       : fraction [0–1] up each section where the cloud
//                    band sits.  Matches visually with CLOUD_T above.
// GLB_PATH_LEFT    : public-folder path to the left-half GLB asset.
// GLB_PATH_RIGHT   : public-folder path to the right-half GLB asset.
// ─────────────────────────────────────────────────────────────────
export const HALF_HEIGHT:   number = 0
export const CLIMB_SPEED:   number = 0
export const SWAP_FRAC:     number = 0.5
export const CLOUD_FRAC:    number = 0.80
export const GLB_PATH_LEFT:  string = '/Mountain_Left.glb'
export const GLB_PATH_RIGHT: string = '/Mountain_Right.glb'

// ═════════════════════════════════════════════════════════════════
// DERIVED — do not edit below this line
// ═════════════════════════════════════════════════════════════════

export const HELIX_TOTAL_ANGLE = TURNS * Math.PI * 2

/** Point on the helix at t∈[0,1] */
export function helixPt(t: number): THREE.Vector3 {
  const angle  = t * Math.PI * 2 * TURNS
  const radius = HELIX_RADIUS_BASE * (1 - t * HELIX_RADIUS_TAPER)
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    t * FLOOR_HEIGHT,
    Math.sin(angle) * radius,
  )
}

/** CatmullRom curve for one floor */
export function makeCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    Array.from({ length: 301 }, (_, i) => helixPt(i / 300))
  )
}

export interface FloorState {
  index: number
}
