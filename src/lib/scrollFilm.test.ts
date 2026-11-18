import { describe, expect, it } from 'vitest'
import { FILM_DURATION_S, FRAME_COUNT, SCENES, frameForFraction, frameForTime } from '../data/film'
import { SCENE_CONTENT } from '../data/content'
import {
  DWELL_FACTOR,
  STRIDES,
  buildSegments,
  dwellZones,
  mapFilmToScroll,
  mapScrollToFilm,
  strideLoadOrder,
} from './scrollFilm'

describe('scroll-to-frame mapping', () => {
  it('maps scroll 0 → film 0 and scroll 1 → film 1', () => {
    expect(mapScrollToFilm(0)).toBe(0)
    expect(mapScrollToFilm(1)).toBe(1)
  })

  it('clamps out-of-range scroll progress', () => {
    expect(mapScrollToFilm(-0.5)).toBe(0)
    expect(mapScrollToFilm(1.5)).toBe(1)
    expect(mapScrollToFilm(-100)).toBe(0)
    expect(mapScrollToFilm(100)).toBe(1)
  })

  it('is monotonically increasing', () => {
    let prev = -1
    for (let i = 0; i <= 100; i++) {
      const f = mapScrollToFilm(i / 100)
      expect(f).toBeGreaterThanOrEqual(prev)
      prev = f
    }
  })

  it('round-trips film → scroll → film', () => {
    for (let i = 0; i <= 20; i++) {
      const f = i / 20
      expect(mapScrollToFilm(mapFilmToScroll(f))).toBeCloseTo(f, 6)
    }
  })

  it('advances slower inside dwell zones than between chapters (dwell remap)', () => {
    const zones = dwellZones()
    expect(zones.length).toBe(SCENES.length)
    // Ch3-body dwell zone: film 0.510–0.538 (length 0.028). Compare with a
    // pure-normal stretch of the same film length, 0.378–0.406 (between
    // chapters, outside every dwell zone).
    const zone = zones[5]
    expect(zone.start).toBeCloseTo(0.51, 3)
    expect(zone.end).toBeCloseTo(0.538, 3)
    const zoneScroll = mapFilmToScroll(zone.end) - mapFilmToScroll(zone.start)
    const normalScroll = mapFilmToScroll(0.406) - mapFilmToScroll(0.378)
    expect(zoneScroll).toBeCloseTo(normalScroll * DWELL_FACTOR, 6)
    expect(DWELL_FACTOR).toBe(1.8)
  })

  it('dwell segments cover the whole film with no gaps', () => {
    const segs = buildSegments()
    expect(segs[0].start).toBe(0)
    expect(segs[segs.length - 1].end).toBe(1)
    for (let i = 1; i < segs.length; i++) {
      expect(segs[i].start).toBeCloseTo(segs[i - 1].end, 9)
      expect(segs[i].scrollStart).toBeCloseTo(segs[i - 1].scrollEnd, 9)
    }
    expect(segs[segs.length - 1].scrollEnd).toBeCloseTo(1, 9)
  })

  it('frameForFraction clamps at 0 and 1', () => {
    expect(frameForFraction(0)).toBe(1)
    expect(frameForFraction(1)).toBe(FRAME_COUNT)
    expect(frameForFraction(-1)).toBe(1)
    expect(frameForFraction(2)).toBe(FRAME_COUNT)
  })

  it('frameForTime matches 15 fps', () => {
    expect(frameForTime(0)).toBe(1)
    expect(frameForTime(1)).toBe(16)
    expect(frameForTime(FILM_DURATION_S)).toBe(FRAME_COUNT)
  })
})

describe('stride loading order', () => {
  it('loads coarse to fine: strides 64 down to 1', () => {
    expect(STRIDES).toEqual([64, 32, 16, 8, 4, 2, 1])
    const order = strideLoadOrder(FRAME_COUNT, 1)
    // Every frame exactly once.
    expect(order).toHaveLength(FRAME_COUNT)
    expect(new Set(order).size).toBe(FRAME_COUNT)
    // The first pass is the 64-stride pass (9 stride frames + the last-frame
    // anchor = 10 entries), so the first 32-stride-only frame appears at
    // index 10 or later.
    const first32Only = order.findIndex((f) => (f - 1) % 32 === 0 && (f - 1) % 64 !== 0)
    expect(first32Only).toBeGreaterThanOrEqual(10)
    // All stride-64 frames come before the first stride-2-only frame.
    const first2Only = order.findIndex((f) => (f - 1) % 2 === 0 && (f - 1) % 4 !== 0)
    const last64Idx = Math.max(...order.map((f, i) => ((f - 1) % 64 === 0 ? i : -1)))
    expect(first2Only).toBeGreaterThan(last64Idx)
  })

  it('prioritises frames near the viewer within each stride pass', () => {
    const current = 300
    const order = strideLoadOrder(FRAME_COUNT, current)
    // First frame of the 64-stride pass should be the nearest 64-stride
    // frame to 300 (321 is 21 away; 257 is 43 away).
    expect(order[0]).toBe(321)
    // Within the 64 pass, distances from the viewer are non-decreasing.
    const pass64 = order.slice(0, Math.ceil(FRAME_COUNT / 64) + 1)
    const dists = pass64.map((f) => Math.abs(f - current))
    for (let i = 1; i < dists.length; i++) {
      expect(dists[i]).toBeGreaterThanOrEqual(dists[i - 1])
    }
  })
})

describe('film.ts timings', () => {
  it('all scene timings are between 0 and 1', () => {
    for (const s of SCENES) {
      expect(s.start).toBeGreaterThanOrEqual(0)
      expect(s.end).toBeLessThanOrEqual(1)
      expect(s.end).toBeGreaterThan(s.start)
    }
  })

  it('no scenes overlap', () => {
    const sorted = [...SCENES].sort((a, b) => a.start - b.start)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].start).toBeGreaterThanOrEqual(sorted[i - 1].end)
    }
  })

  it('every scene has matching content, and every content block has a scene', () => {
    expect(SCENES.map((s) => s.id).sort()).toEqual(SCENE_CONTENT.map((c) => c.id).sort())
  })

  it('the finale runs to the end of the film', () => {
    const finale = SCENES.find((s) => s.id === 'finale')
    expect(finale?.end).toBe(1)
    expect(finale?.start).toBe(0.888)
  })

  it('film duration and frame count agree at 15 fps', () => {
    // 558 frames extracted at 15 fps from the 37.208 s joined film
    // (frames at t = 0, 1/15, …, 557/15 = 37.133 s).
    expect(FRAME_COUNT).toBe(Math.floor(FILM_DURATION_S * 15))
    expect(FRAME_COUNT).toBe(558)
  })
})
