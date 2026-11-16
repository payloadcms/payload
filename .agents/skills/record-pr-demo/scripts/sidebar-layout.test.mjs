import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, expect } from '@playwright/test'

import { createPresentation } from './presentation-demo.mjs'

async function withSidebar({
  run,
  accessibility = false,
  stepCount = 12,
  shouldDeclareSteps = true,
}) {
  const browser = await chromium.launch({ headless: true })
  let presentation
  try {
    const page = await browser.newPage({ viewport: { width: 1794, height: 1086 } })
    const steps = Array.from({ length: stepCount }, (_, index) => ({
      title: `Step ${index + 1}`,
      body: `Inspect the result of step ${index + 1} before continuing to the next part of the walkthrough.`,
    }))
    presentation = await createPresentation({
      page,
      options: {
        accessibility,
        showAnnouncements: accessibility,
        annotationSteps: shouldDeclareSteps ? steps : undefined,
        change: {
          kind: 'Feature',
          title: 'Resize the application',
          description: 'Keep the walkthrough attached at every size.',
        },
      },
      viewport: { width: 1440, height: 900 },
      baseURL: 'http://sidebar.test',
      pauseScale: 1,
    })
    await presentation.setAnnotation({ ...steps.at(-1), index: stepCount, total: stepCount })
    await presentation.flush()
    await run({ page, presentation })
  } finally {
    await presentation?.stop()
    await browser.close()
  }
}

async function geometry({ page }) {
  return page.evaluate(() => {
    const shadow = document.querySelector('#demo-stage').shadowRoot
    const rect = (selector) => {
      const r = shadow.querySelector(selector).getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    }
    return {
      sidebar: rect('.annotation-sidebar'),
      window: rect('[data-window]'),
      list: rect('.sidebar-steps'),
      current: rect('[aria-current=step]'),
    }
  })
}

test('should shrink the sidebar with the window and keep its active step visible', async () => {
  await withSidebar({
    run: async ({ page, presentation }) => {
      const initial = await geometry({ page })
      await presentation.resizeWindow({ width: 700, height: 400, duration: 100 })
      await presentation.flush()
      const resized = await geometry({ page })
      assert.ok(
        resized.sidebar.height < initial.sidebar.height - 200,
        'Sidebar should follow vertical shrinkage',
      )
      assert.ok(
        Math.abs(resized.sidebar.y - resized.window.y) < 1,
        'Sidebar and window should share their top edge',
      )
      assert.ok(
        Math.abs(resized.sidebar.height - resized.window.height) < 1,
        'Sidebar and window should share their height',
      )
      await expect
        .poll(async () => {
          const { current, list } = await geometry({ page })
          return current.y >= list.y - 1 && current.y + current.height <= list.y + list.height + 1
        })
        .toBe(true)
    },
  })
})

test('should keep the window beside the sidebar after an animated shrink and expansion', async () => {
  await withSidebar({
    run: async ({ page, presentation }) => {
      await page.evaluate(() => {
        window.sidebarResizeSamples = []
        window.shouldSampleSidebar = true
        const sample = () => {
          const shadow = document.querySelector('#demo-stage').shadowRoot
          const sidebar = shadow.querySelector('.annotation-sidebar').getBoundingClientRect()
          const windowRect = shadow.querySelector('[data-window]').getBoundingClientRect()
          window.sidebarResizeSamples.push(
            Math.max(
              Math.abs(sidebar.right - windowRect.left),
              Math.abs(sidebar.top - windowRect.top),
              Math.abs(sidebar.height - windowRect.height),
            ),
          )
          if (window.shouldSampleSidebar) requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      })
      for (const viewport of [
        { width: 390, height: 400 },
        { width: 1440, height: 900 },
        { width: 1920, height: 1080 },
      ]) {
        await presentation.resizeWindow({ ...viewport, duration: 180 })
        await presentation.flush()
        const result = await geometry({ page })
        assert.ok(
          Math.abs(result.sidebar.x + result.sidebar.width - result.window.x) < 1,
          'Window should remain attached to the sidebar',
        )
        assert.ok(
          Math.abs(result.sidebar.y - result.window.y) < 1,
          'Window should not drop below the sidebar',
        )
        assert.ok(
          Math.abs(result.sidebar.height - result.window.height) < 1,
          'Sidebar height should track the scaled window',
        )
      }
      const samples = await page.evaluate(() => {
        window.shouldSampleSidebar = false
        return window.sidebarResizeSamples
      })
      assert.ok(samples.length > 5, 'Animated resize should be sampled between endpoints')
      assert.ok(
        Math.max(...samples) < 1,
        'Sidebar and window should stay attached during animation',
      )
    },
  })
})

test('should keep the overview while hiding steps without mounting a top panel', async () => {
  await withSidebar({
    run: async ({ page, presentation }) => {
      const window = await page.locator('[data-window]').boundingBox()
      await expect(page.locator('.footer, .note, .step-progress')).toHaveCount(0)
      await expect(page.locator('.sidebar-intro')).toHaveText(
        'Keep the walkthrough attached at every size.',
      )
      await presentation.clearAnnotation()
      await expect(page.locator('.sidebar-steps')).toBeHidden()
      await expect(page.locator('.sidebar-intro')).toBeVisible()
      assert.deepEqual(await page.locator('[data-window]').boundingBox(), window)
    },
  })
})

test('should keep the active step visible when a wrapped caption changes sidebar space', async () => {
  await withSidebar({
    accessibility: true,
    run: async ({ page }) => {
      await page.evaluate(() =>
        window.demoChrome.setAccessibilityState({
          announcement:
            'The document was saved and the selected item moved to its new position. '.repeat(4),
        }),
      )
      await expect(page.locator('[data-announcement]')).toHaveCSS('white-space', 'normal')
      const feedback = await page.locator('[data-accessibility]').boundingBox()
      const cards = await page.locator('.sidebar-steps').boundingBox()
      assert.ok(feedback.y - (cards.y + cards.height) >= 9, 'Feedback needs space above its card')
      await expect
        .poll(async () => {
          const active = await page.locator('[aria-current=step]').boundingBox()
          const list = await page.locator('.sidebar-steps').boundingBox()
          return active.y >= list.y && active.y + active.height <= list.y + list.height + 1
        })
        .toBe(true)
    },
  })
})

for (const accessibility of [false, true]) {
  test(`should keep consistent long-list spacing with feedback ${accessibility}`, async () => {
    await withSidebar({
      accessibility,
      run: async ({ page }) => {
        if (accessibility) {
          await page.evaluate(() =>
            window.demoChrome.setAccessibilityState({
              key: 'Tab',
              announcement: 'All changes saved.',
            }),
          )
        }
        const list = page.locator('.sidebar-steps')
        await expect
          .poll(() => list.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
          .toBeLessThan(2)
        const edges = page.locator('.sidebar-steps-viewport')
        await expect(edges).toHaveAttribute('data-overflow-above', '')
        await expect(edges).not.toHaveAttribute('data-overflow-below', '')
        const intro = await page.locator('.sidebar-intro').boundingBox()
        const walkthrough = await page.locator('.sidebar-intro + .sidebar-heading').boundingBox()
        const standardGap = walkthrough.y - intro.y - intro.height
        const shell = await page.locator('.sidebar-shell').boundingBox()
        const last = await page.locator('.sidebar-step').last().boundingBox()
        let header
        if (accessibility) {
          header = await page.locator('.sidebar-feedback > .sidebar-heading').boundingBox()
          assert.ok(
            Math.abs(header.y - last.y - last.height - standardGap) < 1,
            'Section gaps should match',
          )
        } else {
          await expect(page.locator('.sidebar-feedback')).toHaveCount(0)
          assert.ok(
            Math.abs(shell.y + shell.height - last.y - last.height - 10) < 1,
            'List needs the normal bottom inset',
          )
        }
        const bounds = await list.boundingBox()
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
        await page.mouse.wheel(0, -150)
        await expect
          .poll(() => list.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
          .toBeGreaterThan(50)
        if (accessibility) {
          assert.deepEqual(
            await page.locator('.sidebar-feedback > .sidebar-heading').boundingBox(),
            header,
          )
          const currentList = await list.boundingBox()
          assert.ok(Math.abs(header.y - currentList.y - currentList.height - standardGap) < 1)
        }
        await page.mouse.wheel(0, -10000)
        await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeLessThan(2)
        await expect(edges).not.toHaveAttribute('data-overflow-above', '')
        await expect(edges).toHaveAttribute('data-overflow-below', '')
        assert.deepEqual(await page.locator('.sidebar-shell').boundingBox(), shell)
      },
    })
  })
}

test('should hide scroll shadows when cards fit and respect reduced motion', async () => {
  await withSidebar({
    stepCount: 2,
    run: async ({ page, presentation }) => {
      const edges = page.locator('.sidebar-steps-viewport')
      await expect(edges).not.toHaveAttribute('data-overflow-above', '')
      await expect(edges).not.toHaveAttribute('data-overflow-below', '')
      const styles = await edges.evaluate((element) => ({
        top: getComputedStyle(element, '::before').opacity,
        bottom: getComputedStyle(element, '::after').opacity,
        pointerEvents: getComputedStyle(element, '::before').pointerEvents,
      }))
      assert.deepEqual(styles, { top: '0', bottom: '0', pointerEvents: 'none' })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      assert.equal(
        await edges.evaluate((element) => getComputedStyle(element, '::before').transitionDuration),
        '0s',
      )
      await presentation.clearAnnotation()
      await expect(edges).toBeHidden()
    },
  })
})

test('should extend edge shadows across the sidebar without inset seams at scaled sizes', async () => {
  await withSidebar({
    run: async ({ page }) => {
      for (const width of [1120, 1600, 1794]) {
        await page.setViewportSize({ width, height: 1086 })
        const edges = await page.locator('.sidebar-steps-viewport').evaluate((element) => {
          const top = getComputedStyle(element, '::before')
          const bottom = getComputedStyle(element, '::after')
          return {
            top: top.top,
            bottom: bottom.bottom,
            left: top.left,
            right: top.right,
            width: parseFloat(top.width),
            viewport: element.clientWidth,
          }
        })
        assert.ok(parseFloat(edges.top) <= 0)
        assert.ok(parseFloat(edges.bottom) <= 0)
        assert.ok(parseFloat(edges.left) <= 0)
        assert.ok(parseFloat(edges.right) <= 0)
        assert.ok(edges.width >= edges.viewport)
      }
    },
  })
})

test('should reveal replacement current notes without resetting an unchanged note', async () => {
  await withSidebar({
    shouldDeclareSteps: false,
    stepCount: 1,
    run: async ({ page, presentation }) => {
      const list = page.locator('.sidebar-steps')
      await presentation.setAnnotation({
        title: 'Original note',
        body: 'Review the original long note. '.repeat(250),
        index: 1,
        total: 1,
      })
      const bounds = await list.boundingBox()
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      await page.mouse.wheel(0, 500)
      await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(100)
      const replacement = {
        title: 'Replacement note',
        body: 'Read the replacement long note. '.repeat(250),
        index: 1,
        total: 1,
      }
      await presentation.setAnnotation(replacement)
      await expect
        .poll(() => list.evaluate((el) => el.scrollTop), { timeout: 1500 })
        .toBeLessThan(2)
      await page.mouse.wheel(0, 500)
      await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(100)
      await presentation.setAnnotation(replacement)
      await page.waitForTimeout(400)
      assert.ok((await list.evaluate((el) => el.scrollTop)) > 100)
    },
  })
})
