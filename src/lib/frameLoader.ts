/**
 * Frame loader: coarse-to-fine, 6 at a time, prioritising frames near the
 * viewer. Logs first-frame time and full-load time; records failed frames
 * so the app can warn instead of silently showing a blank canvas.
 */

import { frameFileName, FRAME_COUNT } from '../data/film'
import { strideLoadOrder } from './scrollFilm'

export const CONCURRENCY = 6

export interface LoaderStats {
  loaded: number
  failed: number[]
  firstFrameMs: number | null
  fullLoadMs: number | null
}

export class FrameLoader {
  readonly baseUrl: string
  readonly frameCount: number
  private images = new Map<number, HTMLImageElement>()
  private loading = new Set<number>()
  private failedSet = new Set<number>()
  private queue: number[] = []
  private active = 0
  private startedAt = 0
  private firstFrameMs: number | null = null
  private fullLoadMs: number | null = null
  private currentFrame = 1
  private destroyed = false
  onFirstFrame: ((ms: number) => void) | null = null
  onComplete: ((stats: LoaderStats) => void) | null = null
  onProgress: ((loaded: number, total: number) => void) | null = null

  /** Stop reporting: in-flight image loads finish silently. */
  destroy(): void {
    this.destroyed = true
    this.queue = []
  }

  constructor(baseUrl: string, frameCount: number = FRAME_COUNT) {
    this.baseUrl = baseUrl
    this.frameCount = frameCount
  }

  get stats(): LoaderStats {
    return {
      loaded: this.images.size,
      failed: [...this.failedSet].sort((a, b) => a - b),
      firstFrameMs: this.firstFrameMs,
      fullLoadMs: this.fullLoadMs,
    }
  }

  get loadedCount(): number {
    return this.images.size
  }

  get failedFrames(): number[] {
    return [...this.failedSet].sort((a, b) => a - b)
  }

  /** Start loading, prioritised around `currentFrame`. */
  start(currentFrame = 1): void {
    this.startedAt = performance.now()
    this.currentFrame = currentFrame
    this.rebuildQueue()
    this.pump()
  }

  /** Re-prioritise the remaining queue around a new viewer frame. */
  request(currentFrame: number): void {
    this.currentFrame = currentFrame
    // Only rebuild the queue while there is still work left; in-flight
    // loads are left alone.
    if (this.queue.length > 0) {
      const remaining = this.queue.filter(
        (f) => !this.images.has(f) && !this.loading.has(f) && !this.failedSet.has(f),
      )
      this.queue = strideLoadOrder(this.frameCount, currentFrame).filter(
        (f) =>
          !this.images.has(f) &&
          !this.loading.has(f) &&
          !this.failedSet.has(f) &&
          remaining.includes(f),
      )
    }
    this.pump()
  }

  has(frame: number): boolean {
    return this.images.has(frame)
  }

  get(frame: number): HTMLImageElement | undefined {
    return this.images.get(frame)
  }

  /** Nearest loaded frame to `target` (searches outward), or undefined. */
  nearestLoaded(target: number): HTMLImageElement | undefined {
    if (this.images.has(target)) return this.images.get(target)
    for (let d = 1; d <= this.frameCount; d++) {
      const below = target - d
      const above = target + d
      if (below >= 1 && this.images.has(below)) return this.images.get(below)
      if (above <= this.frameCount && this.images.has(above)) return this.images.get(above)
    }
    return undefined
  }

  private rebuildQueue(): void {
    this.queue = strideLoadOrder(this.frameCount, this.currentFrame)
  }

  private pump(): void {
    while (this.active < CONCURRENCY && this.queue.length > 0) {
      const frame = this.queue.shift()
      if (frame === undefined) break
      if (this.images.has(frame) || this.loading.has(frame) || this.failedSet.has(frame)) {
        continue
      }
      this.active++
      this.loading.add(frame)
      this.loadOne(frame).finally(() => {
        this.active--
        this.loading.delete(frame)
        this.pump()
      })
    }
    if (this.active === 0 && this.queue.length === 0 && this.images.size + this.failedSet.size >= this.frameCount) {
      if (this.fullLoadMs === null && !this.destroyed) {
        this.fullLoadMs = performance.now() - this.startedAt
        this.onComplete?.(this.stats)
      }
    }
  }

  private async loadOne(frame: number): Promise<void> {
    const img = new Image()
    img.src = `${this.baseUrl}/${frameFileName(frame)}`
    try {
      await img.decode()
      this.images.set(frame, img)
      if (this.destroyed) return
      if (this.firstFrameMs === null) {
        this.firstFrameMs = performance.now() - this.startedAt
        this.onFirstFrame?.(this.firstFrameMs)
      }
      this.onProgress?.(this.images.size, this.frameCount)
      if (this.images.size + this.failedSet.size >= this.frameCount && this.active <= 1) {
        // Last in-flight load finishing; pump() will close it out.
      }
    } catch {
      this.failedSet.add(frame)
      console.warn(`[film] frame ${frame} failed to load (${this.baseUrl})`)
    }
  }
}
