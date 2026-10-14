import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { chromium } from '@playwright/test'

import { createAnnotationInteraction } from './annotation-demo.mjs'
import { createTimerInteraction } from './timer-demo.mjs'

const pageHTML = `<!doctype html><html><head><style>
  :root {
    --font-body: Inter, sans-serif;
    --color-bg-elevated: #fff;
    --color-text: #181818;
    --color-text-secondary: #555;
    --color-border: #ddd;
    --stroke-width-small: 1px;
    --radius-medium: 5px;
    --spacer-1-5: 6px;
    --spacer-2-5: 12px;
    --spacer-3: 16px;
    --spacer-4: 24px;
  }
</style></head><body><input aria-label="Demo input"></body></html>`

test('should run an optional clock timer inside a banner, then freeze and remove it', async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { height: 720, width: 1280 } })

  try {
    await page.route('http://timer.test/**', (route) =>
      route.fulfill({ body: pageHTML, contentType: 'text/html' }),
    )
    const { showAnnotation } = createAnnotationInteraction({ page })
    const { hideTimer, startTimer, stopTimer } = createTimerInteraction({ page })

    await page.goto('http://timer.test/first')
    await page.getByRole('textbox', { name: 'Demo input' }).focus()
    await showAnnotation({
      sections: [{ body: 'The page loaded', title: 'Result' }],
      type: 'banner',
    })
    await startTimer({ label: 'Page ready' })

    const banner = page.locator('[data-pr-demo-annotation="banner"]')
    const timer = banner.locator('.pr-demo-annotation-timer')
    assert.equal(await timer.count(), 1)
    assert.equal(await page.locator('[data-pr-demo-timer]').count(), 0)
    assert.equal(await banner.locator('.pr-demo-annotation-section').count(), 2)
    assert.equal(await banner.getAttribute('aria-hidden'), 'true')
    assert.equal(await timer.locator('.pr-demo-annotation-title').textContent(), 'Page ready')
    assert.equal(
      await banner.evaluate((element) => getComputedStyle(element).pointerEvents),
      'none',
    )
    assert.equal(
      await timer
        .locator('.pr-demo-annotation-title')
        .evaluate((element) => getComputedStyle(element).fontSize),
      '12px',
    )
    assert.equal(
      await timer
        .locator('.pr-demo-annotation-timer-value')
        .evaluate((element) => getComputedStyle(element).fontSize),
      '12px',
    )
    assert.deepEqual(
      await timer.locator('svg').evaluate((element) => ({
        height: getComputedStyle(element).height,
        width: getComputedStyle(element).width,
      })),
      { height: '12px', width: '12px' },
    )
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
      'Demo input',
    )

    const clockSource = await readFile(
      new URL('../../../../packages/ui/src/icons/Clock/index.tsx', import.meta.url),
      'utf8',
    )
    assert.equal(
      await timer.locator('svg path').getAttribute('d'),
      clockSource.match(/d="([^"]+)"/)?.[1],
    )

    await page.waitForTimeout(120)
    await page.goto('http://timer.test/second')
    await showAnnotation({ sections: [{ title: 'Result', body: 'Ready' }], type: 'banner' })
    const elapsedMilliseconds = await stopTimer()
    assert.ok(elapsedMilliseconds >= 100)
    const stoppedValue = await timer.locator('.pr-demo-annotation-timer-value').textContent()
    assert.match(stoppedValue, /^\d+\.\d{2} s$/)
    await page.waitForTimeout(120)
    assert.equal(await timer.locator('.pr-demo-annotation-timer-value').textContent(), stoppedValue)

    await hideTimer()
    assert.equal(await timer.count(), 0)
    assert.equal(await banner.count(), 1)
  } finally {
    await browser.close()
  }
})

test('should require a label and a visible banner before starting', async () => {
  const page = {
    evaluate: () => assert.fail('An invalid label must not touch the page'),
  }
  const { startTimer } = createTimerInteraction({ page })

  await assert.rejects(startTimer({ label: '' }), /non-empty text/)

  const browser = await chromium.launch({ headless: true })
  const browserPage = await browser.newPage()
  try {
    await browserPage.route('http://timer.test/**', (route) =>
      route.fulfill({ body: pageHTML, contentType: 'text/html' }),
    )
    await browserPage.goto('http://timer.test/no-banner')
    const timer = createTimerInteraction({ page: browserPage })
    await assert.rejects(timer.startTimer({ label: 'Page ready' }), /Show a banner annotation/)
  } finally {
    await browser.close()
  }
})
