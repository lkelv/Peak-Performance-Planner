import * as THREE from 'three'


// ╔══════════════════════════════════════════════════════════════════╗
// ║                    TUNING CONSTANTS                              ║
// ║  All visual positioning, sizing and speed lives here.            ║
// ║  Change these first before touching any component file.          ║
// ╚══════════════════════════════════════════════════════════════════╝

// ─────────────────────────────────────────────────────────────────
// CAMERA
// ─────────────────────────────────────────────────────────────────
export const CAM_POS  = new THREE.Vector3(17, 8, 15)
export const CAM_LOOK = new THREE.Vector3(8, 3, 0)
export const CAM_FOV  = 30

// ─────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────
export const AVATAR_POS:   [number, number, number] = [7, 2, 4]
export const AVATAR_SCALE: number = 1

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
//               Background, mountains, and clouds all use this.
// ROT_SPEED   : radians/second the world group rotates around Y.
//               Tune independently of CLIMB_SPEED.
// ─────────────────────────────────────────────────────────────────
export const CLIMB_SPEED: number = 0.3183 *1
export const ROT_SPEED:   number = 0.3 *1

// ─────────────────────────────────────────────────────────────────
// GLB MOUNTAIN SECTION
//
// GLB_PATH         : path in /public to the half-cylinder GLB.
//
// SECTION_SCALE    : uniform scale applied to each GLB clone.
//                    Makes the model bigger/smaller in the scene.
//
// SECTION_HEIGHT   : world-units tall that one SCALED GLB occupies.
//                    Rule: SECTION_HEIGHT ≈ GLB_bbox_height × SECTION_SCALE
//                    Gap between sections → increase SECTION_HEIGHT.
//                    Sections overlap     → decrease SECTION_HEIGHT.
//
// SPAWN_INTERVAL   : world-units of travel between each new section
//                    spawning at the top.  Controls how frequently
//                    sections appear — INDEPENDENT of SECTION_HEIGHT.
//                    Lower = more frequent spawns (denser path).
//                    Must be ≤ SECTION_HEIGHT or sections will gap.
//                    Good starting range: 5–30.
//
// SECTION_OFFSET_X : slide every section left(-)/right(+) from origin.
// SECTION_OFFSET_Z : slide every section forward(-)/back(+).
//
// SECTION_ROTATION_Y : base Y-axis rotation (radians) for even sections.
//                      Odd sections get this + Math.PI (flipped 180°).
//                      Try: 0 | Math.PI/2 | Math.PI | -Math.PI/2
// ─────────────────────────────────────────────────────────────────
export const GLB_PATH:            string = '/mountain.glb'

export const SECTION_SCALE:       number =  1
export const SECTION_HEIGHT:      number =  10/3
// RECYCLE_THRESHOLD: how far below y=0 a section must drop before it
// gets teleported to the top. Setting this to -0.5 * SECTION_HEIGHT means
// recycling fires when the bottom section is only halfway off-screen,
// so there is always a full section waiting well above the player.
export const RECYCLE_THRESHOLD:   number = -SECTION_HEIGHT * 2.4

// SPAWN_INTERVAL kept for cloud counting only — not used for section recycling
export const SPAWN_INTERVAL:      number = SECTION_HEIGHT

export const SECTION_OFFSET_X:    number =  0
export const SECTION_OFFSET_Z:    number =   0.0
export const SECTION_ROTATION_Y:  number =   -10

// ─────────────────────────────────────────────────────────────────
// CLOUD BANK
// CLOUD_SPAWN_INTERVAL : number of mountain spawns between each cloud.
//                        e.g. 5 = a cloud appears every 5 new sections.
// CLOUD_ABOVE_OFFSET   : how many world-units above the highest section
//                        the cloud is placed when it resets.
//                        Should be large enough that it fades in smoothly
//                        before reaching the avatar (avatar is at y≈0).
// ─────────────────────────────────────────────────────────────────
export const CLOUD_SPAWN_INTERVAL: number = 30    // every N mountain spawns
export const CLOUD_ABOVE_OFFSET:   number = 30   // units above top section on reset

// ── Legacy aliases kept for CloudBank internal fade constants ──────
export const CLOUD_INTERVAL: number = 40
export const CLOUD_FADE:     number =  6
export const CLOUD_THICK:    number =  4
export const CLOUD_T:        number = 0.82
export const SECTION_HEIGHT_FOR_CLOUD: number = CLOUD_INTERVAL
export const FLOOR_HEIGHT:             number = CLOUD_INTERVAL