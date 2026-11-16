import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { chromium } from '@playwright/test'

async function withChrome({ run }) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
    await page.setContent('<input aria-label="Keep focus"><div id="root"></div>')
    const source = await readFile(
      new URL('./WindowChrome/index.mjs', import.meta.url),
      'utf8',
    ).catch(() => '')
    await page.addScriptTag({
      type: 'module',
      content: `${source}\nwindow.mountDemoChrome = typeof mountDemoChrome === 'function' ? mountDemoChrome : null`,
    })
    assert.equal(
      await page.evaluate(() => typeof window.mountDemoChrome),
      'function',
      'Shared chrome mount is missing',
    )
    await page.evaluate(() => {
      window.chromeDemo = window.mountDemoChrome({
        root: document.querySelector('#root'),
      })
    })
    await run({ page })
  } finally {
    await browser.close()
  }
}

test('should animate the live iframe viewport continuously with the surrounding window', async () => {
  await withChrome({
    run: async ({ page }) => {
      const result = await page.evaluate(async () => {
        const host = document.querySelector('#root')
        const frame = document.createElement('iframe')
        frame.slot = 'content'
        frame.title = 'Responsive application'
        frame.srcdoc =
          '<style>body{margin:0;background:green}@media(max-width:600px){body{background:blue}}</style><main>Live application</main>'
        const loaded = new Promise((resolve) =>
          frame.addEventListener('load', resolve, { once: true }),
        )
        host.append(frame)
        await loaded
        const root = host.shadowRoot
        const samples = []
        const timer = setInterval(
          () =>
            samples.push({
              width: root.querySelector('[data-content]').clientWidth,
              appWidth: frame.contentWindow.innerWidth,
            }),
          16,
        )
        await window.chromeDemo.animateViewport({ width: 390, height: 720, duration: 400 })
        clearInterval(timer)
        return {
          samples,
          finalWidth: frame.contentWindow.innerWidth,
          background: frame.contentWindow.getComputedStyle(frame.contentDocument.body)
            .backgroundColor,
        }
      })
      assert.ok(new Set(result.samples.map((sample) => sample.width)).size >= 12)
      for (const sample of result.samples) assert.equal(sample.width, sample.appWidth)
      assert.equal(result.finalWidth, 390)
      assert.equal(result.background, 'rgb(0, 0, 255)')
    },
  })
})

test('should spin the persistent refresh control without moving content, including reduced motion', async () => {
  await withChrome({
    run: async ({ page }) => {
      const root = page.locator('#root')
      const content = await root.locator('[data-content]').boundingBox()
      const refresh = root.getByRole('button', { name: 'Refresh frame', exact: true })
      assert.equal(await refresh.isVisible(), true)
      await page.getByLabel('Keep focus').focus()
      await page.evaluate(() => window.chromeDemo.setRefreshState({ state: 'refreshing' }))
      const status = root.getByRole('status')
      assert.equal(await status.textContent(), 'Refreshing…')
      assert.equal(
        await root.locator('[data-refresh]').evaluate((e) => getComputedStyle(e).position),
        'absolute',
      )
      assert.equal(await root.locator('[data-refresh]').evaluate((e) => e.clientWidth), 1)
      assert.equal(await root.locator('[data-size]').textContent(), '1280 × 720')
      assert.deepEqual(await root.locator('[data-content]').boundingBox(), content)
      for (const width of [768, 390]) {
        await page.evaluate((width) => window.chromeDemo.setViewport({ width, height: 720 }), width)
        const boxes = await root
          .locator('[data-size]')
          .evaluate((e) => ({ width: e.clientWidth, scroll: e.scrollWidth }))
        assert.ok(boxes.scroll <= boxes.width)
        assert.equal(await status.isVisible(), true)
      }
      const completion = await page.evaluate(async () => {
        const root = document.querySelector('#root').shadowRoot
        const icon = root.querySelector('[data-refresh-icon]')
        const animation = icon.getAnimations()[0]
        animation.currentTime = 200
        window.chromeDemo.setRefreshState({ state: 'refreshed' })
        const continued = icon.getAnimations()[0] === animation
        await new Promise((resolve) =>
          icon.addEventListener('animationiteration', resolve, { once: true }),
        )
        return {
          continued,
          spinning: root.querySelector('[data-refresh-button]').hasAttribute('data-spinning'),
        }
      })
      assert.equal(completion.continued, true)
      assert.equal(completion.spinning, false)
      await page.evaluate(() => window.chromeDemo.setRefreshState({ state: 'refreshing' }))
      await page.emulateMedia({ reducedMotion: 'reduce' })
      assert.equal(
        await root
          .locator('[data-refresh-icon]')
          .evaluate((e) => getComputedStyle(e).animationName),
        'none',
      )
      assert.equal(
        await page.getByLabel('Keep focus').evaluate((e) => e === document.activeElement),
        true,
      )
      await page.evaluate(() => window.chromeDemo.setRefreshState({ state: 'refreshed' }))
      assert.equal(await status.textContent(), 'Refreshed')
      assert.equal(await refresh.isVisible(), true)
      assert.equal(await refresh.evaluate((e) => getComputedStyle(e).opacity), '0.35')
      await page.waitForTimeout(1100)
      assert.equal(await status.isVisible(), false)
      await page.evaluate(() => window.chromeDemo.setRefreshState({ state: 'failed' }))
      assert.equal(await status.textContent(), 'Refresh failed')
      await page.evaluate(() => window.chromeDemo.setRefreshState({ state: 'idle' }))
      assert.equal(await status.isVisible(), false)
    },
  })
})

test('should reject invalid viewport sizes without moving the window', async () => {
  await withChrome({
    run: async ({ page }) => {
      const content = page.locator('#root [data-content]')
      const bounds = await content.boundingBox()
      for (const size of [
        { width: 0, height: 720 },
        { width: 390.5, height: 720 },
        { width: 390, height: -1 },
      ]) {
        await assert.rejects(
          page.evaluate((size) => window.chromeDemo.setViewport(size), size),
          /positive integers/,
        )
        assert.deepEqual(await content.boundingBox(), bounds)
      }
    },
  })
})
