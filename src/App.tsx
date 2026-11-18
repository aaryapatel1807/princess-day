import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { FILM_DURATION_S, FRAME_COUNT, SCENES, frameForFraction } from './data/film'
import { SCENE_CONTENT, SCROLL_HINT } from './data/content'
import { mapScrollToFilm } from './lib/scrollFilm'
import { FrameLoader, CONCURRENCY_TOUCH } from './lib/frameLoader'
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

  // Frame loader (recreated when quality changes). Touch devices decode
  // fewer frames at once so decoding doesn't fight the canvas draws.
  useEffect(() => {
    const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    const loader = new FrameLoader(
      `/film/${quality}`,
      FRAME_COUNT,
      coarse ? CONCURRENCY_TOUCH : undefined,
    )
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
  const lastDrawnProgressRef = useRef(-1)
  const lastDrawnExactRef = useRef(false)

  // Draw the frame for the current film progress. Two things make the
  // motion feel like a movie instead of a flipbook (fix, 18 Nov):
  //  - frame blending: the fractional frame position crossfades the current
  //    frame into the next one, so 15 fps steps become continuous motion;
  //  - a slow Ken Burns zoom (1.00 → 1.07 across the film), so the camera
  //    is always drifting even when the film frame barely changes.
  const drawCurrent = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      // Phones: cap the canvas backing store at 1.5x — at 2x every draw
      // pushes twice the pixels for no visible gain (SD frames are 720p).
      window.innerWidth < 768 ? 1.5 : 2,
    )
    const cw = window.innerWidth
    const ch = window.innerHeight
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
    }
    const loader = loaderRef.current
    // Exact (fractional) frame position, 1-based.
    const floatFrame = filmProgressRef.current * (FRAME_COUNT - 1) + 1
    const baseFrame = Math.min(Math.floor(floatFrame), FRAME_COUNT)
    const frac = floatFrame - baseFrame
    const baseImg = loader?.get(baseFrame) ?? loader?.nearestLoaded(baseFrame) ?? posterRef.current
    if (!baseImg) return
    lastDrawnExactRef.current = loader?.get(baseFrame) !== undefined
    const nextImg = frac > 0 && baseFrame < FRAME_COUNT ? loader?.get(baseFrame + 1) : undefined
    ctx.imageSmoothingEnabled = true
    // 'high' resampling on every tick stutters on phones; 'medium' is
    // visually identical at these scales and far cheaper.
    ctx.imageSmoothingQuality = 'medium'
    const zoom = 1 + 0.07 * filmProgressRef.current
    const drawCover = (img: HTMLImageElement, alpha: number) => {
      const iw = img.naturalWidth || img.width
      const ih = img.naturalHeight || img.height
      if (!iw || !ih) return
      // Cover-fit, then zoom about the centre.
      const scale = Math.max(canvas.width / iw, canvas.height / ih) * zoom
      const dw = iw * scale
      const dh = ih * scale
      ctx.globalAlpha = alpha
      ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawCover(baseImg, 1)
    if (nextImg) drawCover(nextImg, frac)
    ctx.globalAlpha = 1
    lastDrawnProgressRef.current = filmProgressRef.current
  }

  useEffect(() => {
    let lenis: Lenis | null = null
    if (!reducedMotion) {
      lenis = new Lenis({ lerp: 0.12, smoothWheel: true })
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
      // Redraw on a frame change, on any visible progress change (the
      // blend + zoom make sub-frame progress visible), or when the exact
      // wanted frame has just finished loading after a fallback draw.
      // (No redraw while idle — the picture is static then.) The 0.0008
      // threshold is ~0.03 s of film: fine enough that the blend still
      // looks continuous, coarse enough to halve redraws on phones.
      if (
        frame !== lastDrawnFrameRef.current ||
        Math.abs(filmProgressRef.current - lastDrawnProgressRef.current) > 0.0008 ||
        (!lastDrawnExactRef.current && loaderRef.current?.has(frame))
      ) {
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
      {/* Scroll track: 4000vh desktop, 3200vh phones. */}
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
