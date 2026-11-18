import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { FILM_DURATION_S, FRAME_COUNT, SCENES, frameForFraction } from './data/film'
import { FINALE_NOTE, SCENE_CONTENT, SCROLL_HINT } from './data/content'
import { mapScrollToFilm } from './lib/scrollFilm'
import { FrameLoader } from './lib/frameLoader'
import SceneText from './components/SceneText'

/** Visibility of a scene window at a given film progress. 0..1, holds, fades out. */
export function sceneVisibility(start: number, end: number, film: number, stays: boolean): number {
  if (film < start) return 0
  if (stays) {
    const fadeIn = Math.min(Math.max((film - start) / ((end - start) * 0.12), 0), 1)
    return fadeIn
  }
  if (film >= end) return 0
  const len = end - start
  const local = (film - start) / len
  const fadeIn = Math.min(local / 0.18, 1)
  const fadeOut = Math.min((1 - local) / 0.18, 1)
  return Math.min(fadeIn, fadeOut)
}

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768,
  )
  useEffect(() => {
    const onResize = () => setDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return desktop
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loaderRef = useRef<FrameLoader | null>(null)
  const posterRef = useRef<HTMLImageElement | null>(null)
  const [filmProgress, setFilmProgress] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [failedFrames, setFailedFrames] = useState<number[]>([])
  const [firstFrameMs, setFirstFrameMs] = useState<number | null>(null)
  const [fullLoadMs, setFullLoadMs] = useState<number | null>(null)
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const isDesktop = useIsDesktop()
  // Pick the quality once, up front, so the loader starts exactly once.
  const [quality, setQuality] = useState<'hd' | 'sd'>(() =>
    typeof window !== 'undefined' && window.innerWidth * window.devicePixelRatio > 1400
      ? 'hd'
      : 'sd',
  )

  // Re-pick on resize (only when the pick actually changes).
  useEffect(() => {
    const pick = () =>
      setQuality(window.innerWidth * window.devicePixelRatio > 1400 ? 'hd' : 'sd')
    window.addEventListener('resize', pick)
    return () => window.removeEventListener('resize', pick)
  }, [])

  // Load the poster immediately so the first paint is never black.
  useEffect(() => {
    const img = new Image()
    img.src = '/film/poster.webp'
    img.onload = () => {
      posterRef.current = img
      drawCurrent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Frame loader (recreated when quality changes).
  useEffect(() => {
    const loader = new FrameLoader(`/film/${quality}`, FRAME_COUNT)
    loaderRef.current = loader
    loader.onFirstFrame = (ms) => {
      setFirstFrameMs(ms)
      console.log(`[film] first frame in ${ms.toFixed(0)} ms (${quality})`)
    }
    loader.onComplete = (stats) => {
      setFullLoadMs(stats.fullLoadMs)
      console.log(
        `[film] full load in ${stats.fullLoadMs?.toFixed(0)} ms — ${stats.loaded}/${FRAME_COUNT} frames, failed: ${stats.failed.join(', ') || 'none'}`,
      )
      if (stats.failed.length > 0) {
        console.warn(`[film] ${stats.failed.length} frame(s) failed to load: ${stats.failed.join(', ')}`)
        setFailedFrames(stats.failed)
      }
    }
    loader.onProgress = (loaded) => setLoadedCount(loaded)
    loader.start(1)
    return () => {
      loader.destroy()
      loaderRef.current = null
    }
  }, [quality])

  const filmProgressRef = useRef(0)
  const lastDrawnFrameRef = useRef(-1)

  // Draw the nearest loaded frame for the current film progress.
  const drawCurrent = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cw = window.innerWidth
    const ch = window.innerHeight
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
    }
    const loader = loaderRef.current
    const frame = frameForFraction(filmProgressRef.current)
    const img = loader?.nearestLoaded(frame) ?? posterRef.current
    if (!img) return
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    if (!iw || !ih) return
    // Cover-fit.
    const scale = Math.max(canvas.width / iw, canvas.height / ih)
    const dw = iw * scale
    const dh = ih * scale
    ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
  }

  useEffect(() => {
    let lenis: Lenis | null = null
    if (!reducedMotion) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    }
    let raf = 0
    const tick = (time: number) => {
      lenis?.raf(time)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const raw = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0
      const film = mapScrollToFilm(raw)
      if (Math.abs(film - filmProgressRef.current) > 0.0004 || film === 0 || film === 1) {
        filmProgressRef.current = film
        setFilmProgress(film)
        const frame = frameForFraction(film)
        loaderRef.current?.request(frame)
      }
      const frame = frameForFraction(filmProgressRef.current)
      if (frame !== lastDrawnFrameRef.current || loaderRef.current?.has(frame)) {
        drawCurrent()
        lastDrawnFrameRef.current = frame
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const onResize = () => drawCurrent()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      lenis?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  const anyVisible = SCENES.some((s) => {
    const c = SCENE_CONTENT.find((x) => x.id === s.id)
    return sceneVisibility(s.start, s.end, filmProgress, !!c?.stays) > 0.05
  })

  return (
    <div className={reducedMotion ? 'app reduced-motion' : 'app'}>
      {/* Scroll track: 5200vh desktop, 4200vh phones. */}
      <div className="scroll-track" aria-hidden="true" />
      <canvas ref={canvasRef} className="film-canvas" aria-label="Princess Day film — scroll to play" />
      <div className="film-dim" style={{ opacity: anyVisible ? 0.38 : 0.1 }} />
      <div className="scene-layer">
        {SCENES.map((scene) => {
          const content = SCENE_CONTENT.find((c) => c.id === scene.id)
          if (!content) return null
          const v = sceneVisibility(scene.start, scene.end, filmProgress, !!content.stays)
          const local =
            scene.end > scene.start
              ? Math.min(Math.max((filmProgress - scene.start) / (scene.end - scene.start), 0), 1)
              : 0
          return (
            <SceneText key={scene.id} content={content} visibility={v} localProgress={local} />
          )
        })}
        {/* Finale small-type note, shown with the finale. */}
        <div
          className="finale-note"
          data-testid="finale-note"
          style={{
            opacity:
              sceneVisibility(0.888, 1, filmProgress, true) > 0.6 ? 1 : 0,
          }}
        >
          {FINALE_NOTE}
        </div>
      </div>
      <div className="progress-line" style={{ width: `${filmProgress * 100}%` }} />
      <div className="scroll-hint" style={{ opacity: filmProgress < 0.012 ? 1 : 0 }}>
        <span className="scroll-hint-arrow">↓</span> {SCROLL_HINT}
      </div>
      {/* Diagnostics, hidden visually but present for testing. */}
      <div
        data-testid="film-stats"
        data-loaded={loadedCount}
        data-total={FRAME_COUNT}
        data-first-frame-ms={firstFrameMs ?? ''}
        data-full-load-ms={fullLoadMs ?? ''}
        data-failed={failedFrames.join(',')}
        data-quality={quality}
        data-duration={FILM_DURATION_S}
        data-desktop={isDesktop ? 'true' : 'false'}
        aria-hidden="true"
        style={{ display: 'none' }}
      />
    </div>
  )
}
