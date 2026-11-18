/**
 * Film timing data — the single source of truth for the scroll-film.
 *
 * Joined film (see public/film/README.md): 5 clips xfade-joined at 0.6s.
 * Measured duration 37.25 s (ffprobe), 559 frames at 15 fps (f0001–f0559).
 * All scene timings below are FRACTIONS of the film, copied exactly from
 * PRINCESS-DAY-PLAN.md Stage 2. Do not edit the fractions without also
 * updating the plan.
 */

export const FILM_DURATION_S = 37.25
export const FILM_FPS = 15
export const FRAME_COUNT = 559

/** Frame number (1-based) for a time in seconds, clamped to the film. */
export function frameForTime(tSeconds: number): number {
  const t = Math.min(Math.max(tSeconds, 0), FILM_DURATION_S)
  return Math.min(Math.max(Math.round(t * FILM_FPS) + 1, 1), FRAME_COUNT)
}

/** Frame number (1-based) for a film fraction in [0, 1]. */
export function frameForFraction(fraction: number): number {
  const f = Math.min(Math.max(fraction, 0), 1)
  return frameForTime(f * FILM_DURATION_S)
}

/** Zero-padded frame file name, e.g. f0001.webp */
export function frameFileName(frame: number): string {
  return `f${String(frame).padStart(4, '0')}.webp`
}

export type Placement = 'center' | 'lower-centre' | 'top-left' | 'right'

export interface Scene {
  id: string
  /** Start/end as fractions of the film. Must not overlap another scene. */
  start: number
  end: number
  placement: Placement
}

/**
 * Top-level scene blocks. The three lantern lines in scene 3b are sub-lines
 * inside that block (see content.ts): they stagger in during the same
 * 0.489–0.559 window, one per lantern glow, so the top-level timings stay
 * exactly as written in the plan.
 */
export const SCENES: Scene[] = [
  { id: 'ch1-heading', start: 0.011, end: 0.09, placement: 'center' },
  { id: 'ch1-body', start: 0.106, end: 0.186, placement: 'center' },
  { id: 'ch2-heading', start: 0.213, end: 0.282, placement: 'lower-centre' },
  { id: 'ch2-body', start: 0.293, end: 0.378, placement: 'lower-centre' },
  { id: 'ch3-heading', start: 0.41, end: 0.479, placement: 'top-left' },
  { id: 'ch3-body', start: 0.489, end: 0.559, placement: 'top-left' },
  { id: 'ch4-heading', start: 0.606, end: 0.676, placement: 'right' },
  { id: 'ch4-body', start: 0.691, end: 0.777, placement: 'right' },
  { id: 'ch5-heading', start: 0.803, end: 0.878, placement: 'center' },
  // Final message: 0.888 to the end, stays on screen.
  { id: 'finale', start: 0.888, end: 1.0, placement: 'center' },
]
