/**
 * Scroll → film mapping, including the DWELL remap.
 *
 * While any content is fully visible the film advances 1.8x slower; between
 * chapters it plays at normal speed. "Fully visible" is the middle 40% of a
 * scene's film-fraction window. The map is built as a piecewise-linear
 * function: every film segment is given a scroll-space weight (1.8 inside a
 * dwell zone, 1 outside), the weights are normalised so raw scroll progress
 * still spans [0, 1], and the map is inverted to go scroll → film.
 * Both directions are clamped to [0, 1].
 *
 * Pacing fix (18 Nov, after watching the live site): the original 3.2x
 * dwell over the middle 60% of every scene meant 74% of all scrolling
 * happened inside dwell zones, so the opening chapters felt frozen — the
 * film barely moved per scroll notch. 1.8x over the middle 40% keeps text
 * readable while the film keeps moving.
 */

import { SCENES } from '../data/film'

export const DWELL_FACTOR = 1.8

export interface Segment {
  /** Film-fraction interval. */
  start: number
  end: number
  /** 1.8 inside a dwell zone, 1 outside. */
  weight: number
  /** Scroll-progress interval this segment occupies. */
  scrollStart: number
  scrollEnd: number
}

export interface DwellZone {
  start: number
  end: number
}

/** Middle 40% of each scene window — the part where content is fully visible. */
export function dwellZones(): DwellZone[] {
  return SCENES.map((s) => {
    const len = s.end - s.start
    return { start: s.start + 0.3 * len, end: s.end - 0.3 * len }
  })
}

function isDwelling(filmFraction: number, zones: DwellZone[]): boolean {
  return zones.some((z) => filmFraction >= z.start && filmFraction < z.end)
}

/** Piecewise segments of the film timeline with their scroll intervals. */
export function buildSegments(): Segment[] {
  const zones = dwellZones()
  const cuts = new Set<number>([0, 1])
  for (const z of zones) {
    cuts.add(z.start)
    cuts.add(z.end)
  }
  const points = [...cuts].sort((a, b) => a - b)
  const raw: Array<{ start: number; end: number; weight: number }> = []
  let totalScroll = 0
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    if (end <= start) continue
    const mid = (start + end) / 2
    const weight = isDwelling(mid, zones) ? DWELL_FACTOR : 1
    raw.push({ start, end, weight })
    totalScroll += (end - start) * weight
  }
  let scroll = 0
  return raw.map((s) => {
    const scrollLen = ((s.end - s.start) * s.weight) / totalScroll
    const seg: Segment = { ...s, scrollStart: scroll, scrollEnd: scroll + scrollLen }
    scroll += scrollLen
    return seg
  })
}

const SEGMENTS = buildSegments()

/** Raw scroll progress [0,1] → film progress [0,1], with the dwell remap. */
export function mapScrollToFilm(scrollProgress: number): number {
  const p = Math.min(Math.max(scrollProgress, 0), 1)
  if (p <= 0) return 0
  if (p >= 1) return 1
  for (const seg of SEGMENTS) {
    if (p >= seg.scrollStart && p <= seg.scrollEnd) {
      const local = (p - seg.scrollStart) / (seg.scrollEnd - seg.scrollStart)
      return seg.start + local * (seg.end - seg.start)
    }
  }
  return 1
}

/** Film progress [0,1] → raw scroll progress [0,1] (inverse of the above). */
export function mapFilmToScroll(filmProgress: number): number {
  const f = Math.min(Math.max(filmProgress, 0), 1)
  if (f <= 0) return 0
  if (f >= 1) return 1
  for (const seg of SEGMENTS) {
    if (f >= seg.start && f <= seg.end) {
      const local = (f - seg.start) / (seg.end - seg.start)
      return seg.scrollStart + local * (seg.scrollEnd - seg.scrollStart)
    }
  }
  return 1
}

/** Coarse-to-fine stride order. Strides 64 down to 1. */
export const STRIDES = [64, 32, 16, 8, 4, 2, 1]

/**
 * Frame load order (1-based frame numbers): coarse to fine, and within each
 * stride pass, frames nearest the viewer's current frame first.
 */
export function strideLoadOrder(frameCount: number, currentFrame: number): number[] {
  const seen = new Set<number>()
  const order: number[] = []
  for (const stride of STRIDES) {
    const frames: number[] = []
    for (let f = 1; f <= frameCount; f += stride) frames.push(f)
    // The last frame is always useful as an anchor.
    if (!frames.includes(frameCount)) frames.push(frameCount)
    frames.sort((a, b) => Math.abs(a - currentFrame) - Math.abs(b - currentFrame))
    for (const f of frames) {
      if (!seen.has(f)) {
        seen.add(f)
        order.push(f)
      }
    }
  }
  return order
}
