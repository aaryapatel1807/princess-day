import { expect, test, type Page } from '@playwright/test'
import { SCENES } from '../src/data/film'
import { mapFilmToScroll } from '../src/lib/scrollFilm'

const SHOTS = 'tests/screenshots'

async function scrollToFilm(page: Page, filmFraction: number) {
  const scroll = mapFilmToScroll(filmFraction)
  await page.evaluate((s) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: s * max, behavior: 'instant' as ScrollBehavior })
  }, scroll)
  // Let Lenis settle and the scene fade/letters finish.
  await page.waitForTimeout(1100)
}

async function waitForFrames(page: Page, minLoaded = 60) {
  await page.waitForFunction(
    (min) => {
      const el = document.querySelector('[data-testid="film-stats"]')
      return el && Number(el.getAttribute('data-loaded')) >= min
    },
    minLoaded,
    { timeout: 60_000 },
  )
}

test.describe('Princess Day — every scene', () => {
  test('desktop 1440x810 — all scenes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 810 })
    await page.goto('/')
    await page.waitForSelector('[data-testid="film-stats"]', { state: 'attached' })
    await waitForFrames(page, 60)
    await page.screenshot({ path: `${SHOTS}/desktop/00-start.png` })
    for (const scene of SCENES) {
      const mid = (scene.start + scene.end) / 2
      await scrollToFilm(page, mid)
      const el = page.getByTestId(`scene-${scene.id}`)
      await expect(el).toHaveAttribute('data-visible', 'true', { timeout: 5000 })
      await page.screenshot({ path: `${SHOTS}/desktop/${scene.id}.png` })
    }
  })

  test('mobile 390x844 — all scenes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForSelector('[data-testid="film-stats"]', { state: 'attached' })
    await waitForFrames(page, 60)
    await page.screenshot({ path: `${SHOTS}/mobile/00-start.png` })
    for (const scene of SCENES) {
      const mid = (scene.start + scene.end) / 2
      await scrollToFilm(page, mid)
      const el = page.getByTestId(`scene-${scene.id}`)
      await expect(el).toHaveAttribute('data-visible', 'true', { timeout: 5000 })
      await page.screenshot({ path: `${SHOTS}/mobile/${scene.id}.png` })
    }
  })

  test('film loads: first frame fast, no failed frames', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 810 })
    await page.goto('/')
    await page.waitForSelector('[data-testid="film-stats"]', { state: 'attached' })
    // Wait for the full load (all 558 frames in the chosen quality).
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="film-stats"]')
        return el && Number(el.getAttribute('data-loaded')) >= 558
      },
      { timeout: 180_000 },
    )
    const stats = await page.getByTestId('film-stats').evaluate((el) => ({
      loaded: el.getAttribute('data-loaded'),
      firstFrameMs: el.getAttribute('data-first-frame-ms'),
      fullLoadMs: el.getAttribute('data-full-load-ms'),
      failed: el.getAttribute('data-failed'),
      quality: el.getAttribute('data-quality'),
    }))
    console.log('[playwright] film stats:', JSON.stringify(stats))
    expect(stats.loaded).toBe('558')
    expect(stats.failed).toBe('')
    expect(Number(stats.firstFrameMs)).toBeLessThan(5000)
  })
})
