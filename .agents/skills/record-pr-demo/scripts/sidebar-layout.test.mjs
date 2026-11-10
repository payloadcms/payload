import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, expect } from '@playwright/test'

import { createPresentation } from './presentation-demo.mjs'

async function withSidebar({ run }) {
  const browser = await chromium.launch({ headless: true })
  let presentation
  try {
    const page = await browser.newPage({ viewport: { width: 1794, height: 1086 } })
    const steps = Array.from({ length: 12 }, (_, index) => ({
      title: `Step ${index + 1}`,
      body: `Inspect the result of step ${index + 1} before continuing to the next part of the walkthrough.`,
    }))
    presentation = await createPresentation({
      page,
      options: {
        annotationLayout: 'left',
        annotationSteps: steps,
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
    await presentation.setAnnotation({ ...steps[11], index: 12, total: 12 })
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
