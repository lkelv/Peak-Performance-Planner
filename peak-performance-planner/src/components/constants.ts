import * as THREE from 'three'

// ╔══════════════════════════════════════════════════════════════════╗
// ║                    TUNING CONSTANTS                              ║
// ║  All visual positioning, sizing and speed lives here.            ║
// ║  Change these first before touching any component file.          ║
// ╚══════════════════════════════════════════════════════════════════╝

// ─────────────────────────────────────────────────────────────────
// CAMERA
// CAM_POS  : camera world-space position  x/y/z
// CAM_LOOK : world-space point the camera aims at
// CAM_FOV  : degrees — 25 = tight telephoto, 70 = wide
// ─────────────────────────────────────────────────────────────────
export const CAM_POS  = new THREE.Vector3(15, 2, 15)
export const CAM_LOOK = new THREE.Vector3(0, 1, 0)
export const CAM_FOV  = 50

// ─────────────────────────────────────────────────────────────────
// AVATAR
// AVATAR_POS   : fixed screen-space position of the figure
// AVATAR_SCALE : uniform size multiplier
// ─────────────────────────────────────────────────────────────────
export const AVATAR_POS:   [number, number, number] = [7, 0, 4]
export const AVATAR_SCALE: number = 1

// ─────────────────────────────────────────────────────────────────
// WORLD GROUP
// WORLD_OFFSET_X/Y/Z : translate the world group origin.
//                      Use X/Z to slide the mountain under the avatar.
// ROTATION_DIR       : 1.0 = clockwise,  -1.0 = counter-clockwise
// ─────────────────────────────────────────────────────────────────
export const WORLD_OFFSET_X: number =  0.0
export const WORLD_OFFSET_Y: number =  0.0
export const WORLD_OFFSET_Z: number =  0.0
export const ROTATION_DIR:   number =  -1.0

// ─────────────────────────────────────────────────────────────────
// CLOUD BANK
// CLOUD_FADE  : world-units below cloud where fade-in starts
// CLOUD_THICK : world-units above cloud before fully transparent
// CLOUD_T     : fraction [0-1] of SECTION_HEIGHT where cloud sits
// ─────────────────────────────────────────────────────────────────
export const CLOUD_FADE:  number = 6
export const CLOUD_THICK: number = 4
export const CLOUD_T:     number = 0.82

// ─────────────────────────────────────────────────────────────────
// GLB MOUNTAIN SECTION
//
// GLB_PATH         : path in /public to the half-cylinder GLB.
//                    Every slot clones this same file.
//
// SECTION_SCALE    : uniform scale of each GLB instance.
//                    ← THIS makes the model taller/shorter in the scene.
//                    After changing scale, also update SECTION_HEIGHT
//                    to match the new scaled bounding-box height.
//
// SECTION_HEIGHT   : world-units tall that one SCALED section occupies.
//                    Controls the Y gap between stacked sections and
//                    all scroll / swap math.
//                    Rule:  SECTION_HEIGHT ≈ GLB_height × SECTION_SCALE
//                    Too big  → gap between sections.
//                    Too small → sections overlap.
//
// SECTION_OFFSET_X : slide every section left(-)/right(+) from origin.
// SECTION_OFFSET_Z : slide every section forward(-)/back(+).
//                    (OFFSET_Y is baked into section stacking — no knob needed)
//
// SECTION_ROTATION_Y : base Y-axis rotation for section[0] (radians).
//                      Each subsequent section adds +Math.PI so they
//                      face opposite directions, forming a spiral path.
//                      Try: 0 | Math.PI/2 | Math.PI | -Math.PI/2
//
// CLIMB_SPEED      : world-units/second the sections scroll downward.
//                    Lower = slower ascent.  Start with 1–3.
//
// ROT_SPEED        : radians/second the world group rotates around Y.
//                    Independent of CLIMB_SPEED — tune separately.
//                    Lower = slower spin.  Try 0.1–0.5.
//                    Set 0 to disable rotation entirely.
//
// CLOUD_FRAC       : fraction [0-1] of SECTION_HEIGHT where the cloud
//                    band sits.  Keep close to CLOUD_T.
// ─────────────────────────────────────────────────────────────────
export const GLB_PATH:             string = '/mountain.glb'

export const SECTION_SCALE:        number =  1.0
export const SECTION_HEIGHT:       number =  50
export const SECTION_OFFSET_X:     number = -10
export const SECTION_OFFSET_Z:     number =  0.0
export const SECTION_ROTATION_Y:   number =  1.0

export const CLIMB_SPEED:          number =  2.0
export const ROT_SPEED:            number =  0.2
export const CLOUD_FRAC:           number =  0.82

// ─────────────────────────────────────────────────────────────────
// Legacy alias — CloudBank.tsx imports FLOOR_HEIGHT directly.
// Keep this equal to SECTION_HEIGHT. Do not edit this line.
// ─────────────────────────────────────────────────────────────────
export const FLOOR_HEIGHT: number = SECTION_HEIGHT
