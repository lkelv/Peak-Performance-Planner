import * as THREE from 'three'

// ╔══════════════════════════════════════════════════════════════════╗
// ║                    TUNING CONSTANTS                              ║
// ║  All visual positioning, sizing and speed lives here.            ║
// ║  Change these first before touching any component file.          ║
// ╚══════════════════════════════════════════════════════════════════╝


// ─────────────────────────────────────────────────────────────────
// CAMERA
// ─────────────────────────────────────────────────────────────────
export const CAM_POS       = new THREE.Vector3(5, 2, 10)
export const CAM_LOOK      = new THREE.Vector3(8, 3, -1)
export const CAM_FOV       = 20

// Zoomed-out starting position — camera pans in to CAM_POS when climbing begins
export const CAM_POS_START = new THREE.Vector3(4, 1.2, 15)   // pulled back & slightly lower
export const CAM_FOV_START = 30                                // wider FOV = more zoomed out
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
const OVERALL_SPEED: number = 0.75 //0.75 is good
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