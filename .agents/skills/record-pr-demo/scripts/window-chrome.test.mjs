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
        change: {
          kind: 'Feature',
          title: 'Responsive collection lists',
          description: 'Manage content on every screen.',
        },
      })
    })
    await run({ page })
  } finally {
    await browser.close()
  }
}

test('should keep title and footer steady while replacing numbered notes and resizing', async () => {
  await withChrome({
    run: async ({ page }) => {
      const root = page.locator('#root')
      const footer = root.locator('[data-footer]')
      const initial = await footer.boundingBox()
      await page.getByLabel('Keep focus').focus()
      await page.evaluate(() => {
        window.chromeDemo.setAnnotation({
          index: 1,
          total: 3,
          title: 'Desktop',
          body: 'All columns are visible.',
        })
        window.chromeDemo.setViewport({ width: 390, height: 720 })
        window.chromeDemo.setAnnotation({
          index: 3,
          total: 3,
          title: 'Mobile',
          body: '<img src=x onerror=alert(1)>',
        })
      })
      assert.deepEqual(await footer.boundingBox(), initial)
      assert.equal(await root.locator('[data-title]').textContent(), 'Responsive collection lists')
      assert.equal(await root.locator('[data-pagination]').textContent(), 'Step 3 of 3')
      assert.equal(await root.locator('[data-note-title]').textContent(), 'Mobile')
      assert.equal(
        await root.locator('[data-note-body]').textContent(),
        '<img src=x onerror=alert(1)>',
      )
      assert.equal(await root.locator('[data-note] img').count(), 0)
      assert.equal(
        await page.getByLabel('Keep focus').evaluate((el) => el === document.activeElement),
        true,
      )
      await page.evaluate(() => window.chromeDemo.setAnnotation(null))
      assert.equal(await root.locator('[data-note]').isVisible(), false)
      assert.equal(await root.locator('[data-title]').isVisible(), true)
      assert.deepEqual(await footer.boundingBox(), initial)
    },
  })
})

test('should fit application viewports without stretching content or moving the footer', async () => {
  await withChrome({
    run: async ({ page }) => {
      const initial = await page.locator('#root [data-footer]').boundingBox()
      for (const viewport of [
        { width: 390, height: 720 },
        { width: 1920, height: 1080 },
      ]) {
        await page.evaluate((value) => window.chromeDemo.setViewport(value), viewport)
        const bounds = await page.locator('#root [data-content]').boundingBox()
        assert.ok(Math.abs(bounds.width / bounds.height - viewport.width / viewport.height) < 0.002)
        assert.deepEqual(await page.locator('#root [data-footer]').boundingBox(), initial)
        assert.ok(initial.y + initial.height < bounds.y)
      }
      await page.evaluate(() => window.chromeDemo.setSizeVisible({ isVisible: false }))
      assert.equal(await page.locator('#root [data-size]').isVisible(), false)
      await page.evaluate(() => window.chromeDemo.destroy())
      assert.equal(await page.locator('#root [data-footer]').count(), 0)
    },
  })
})

test('should reject invalid viewport dimensions and pagination before mutating visible state', async () => {
  await withChrome({
    run: async ({ page }) => {
      const errors = await page.evaluate(() => {
        const results = []
        for (const viewport of [
          { width: 0, height: 720 },
          { width: NaN, height: 720 },
          { width: 390.5, height: 720 },
        ]) {
          try {
            window.chromeDemo.setViewport(viewport)
            results.push(false)
          } catch {
            results.push(true)
          }
        }
        for (const index of [0, 4, 1.5]) {
          try {
            window.chromeDemo.setAnnotation({ index, total: 3, title: 'Invalid', body: 'Invalid' })
            results.push(false)
          } catch {
            results.push(true)
          }
        }
        return results
      })
      assert.deepEqual(errors, [true, true, true, true, true, true])
      assert.equal(await page.locator('#root [data-size]').textContent(), '1280 × 720')
      assert.equal(await page.locator('#root [data-note]').isVisible(), false)
    },
  })
})

test('should reject overflowing annotations without changing the persistent panel or previous note', async () => {
  await withChrome({
    run: async ({ page }) => {
      await page.evaluate(() =>
        window.chromeDemo.setAnnotation({
          index: 1,
          total: 2,
          title: 'First note',
          body: 'Readable detail.',
        }),
      )
      const initial = await page.locator('#root [data-footer]').boundingBox()
      const error = await page.evaluate(() => {
        try {
          window.chromeDemo.setAnnotation({
            index: 2,
            total: 2,
            title: 'Second note',
            body: 'Too much text. '.repeat(100),
          })
          return null
        } catch (error) {
          return error.message
        }
      })
      assert.match(error ?? '', /shorten/i)
      assert.equal(await page.locator('#root [data-note-title]').textContent(), 'First note')
      assert.deepEqual(await page.locator('#root [data-footer]').boundingBox(), initial)
    },
  })
})

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

test('should animate ring increases and immediately apply backward or reduced-motion changes', async () => {
  await withChrome({
    run: async ({ page }) => {
      const setStep = (index) =>
        page.evaluate(
          (index) =>
            window.chromeDemo.setAnnotation({ index, total: 3, title: 'Step', body: 'Detail' }),
          index,
        )
      const offset = () =>
        page
          .locator('[data-progress-fill]')
          .evaluate((el) => Number.parseFloat(getComputedStyle(el).strokeDashoffset))
      await setStep(1)
      await page.waitForTimeout(40)
      await setStep(3)
      await page.waitForTimeout(80)
      const intermediate = await offset()
      assert.ok(
        intermediate > 0 && intermediate < 66,
        `Expected an intermediate ring fill, got ${intermediate}`,
      )
      await page.waitForTimeout(700)
      assert.equal(await offset(), 0)
      await setStep(1)
      assert.ok(Math.abs((await offset()) - 66.6667) < 0.01)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setStep(3)
      assert.equal(await offset(), 0)
    },
  })
})

test('should crossfade changed annotation text without restarting unchanged notes or moving the panel', async () => {
  await withChrome({
    run: async ({ page }) => {
      const result = await page.evaluate(async () => {
        const root = document.querySelector('#root').shadowRoot
        const note = { index: 1, total: 2, title: 'First step', body: 'First explanation.' }
        const panel = root.querySelector('[data-footer]')
        const before = panel.getBoundingClientRect().toJSON()
        window.chromeDemo.setAnnotation(note)
        const entering = root.querySelector('[data-note-title]').getAnimations().length
        await new Promise((resolve) => setTimeout(resolve, 250))
        const next = { ...note, index: 2, title: 'Second step', body: 'Second explanation.' }
        window.chromeDemo.setAnnotation(next)
        const ghosts = [...root.querySelectorAll('[data-annotation-ghost]')].map((el) => ({
          text: el.textContent,
          hidden: el.getAttribute('aria-hidden'),
        }))
        const animation = root.querySelector('[data-note-title]').getAnimations()[0]
        window.chromeDemo.setAnnotation(next)
        const isSameAnimation =
          root.querySelector('[data-note-title]').getAnimations()[0] === animation
        await new Promise((resolve) => setTimeout(resolve, 250))
        const settledGhosts = root.querySelectorAll('[data-annotation-ghost]').length
        window.chromeDemo.setAnnotation(null)
        const fadingOut = root.querySelectorAll('[data-annotation-ghost]').length
        const isNoteHidden = root.querySelector('[data-note]').hidden
        const after = panel.getBoundingClientRect().toJSON()
        await new Promise((resolve) => setTimeout(resolve, 250))
        return {
          entering,
          ghosts,
          isSameAnimation,
          settledGhosts,
          fadingOut,
          isNoteHidden,
          before,
          after,
          remainingGhosts: root.querySelectorAll('[data-annotation-ghost]').length,
        }
      })
      assert.equal(result.entering, 0)
      assert.deepEqual(result.ghosts, [
        { text: 'First step', hidden: 'true' },
        { text: 'First explanation.', hidden: 'true' },
      ])
      assert.equal(result.isSameAnimation, true)
      assert.equal(result.settledGhosts, 0)
      assert.equal(result.fadingOut, 2)
      assert.equal(result.isNoteHidden, true)
      assert.deepEqual(result.before, result.after)
      assert.equal(result.remainingGhosts, 0)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const animations = await page.evaluate(() => {
        window.chromeDemo.setAnnotation({
          index: 1,
          total: 1,
          title: 'Reduced motion',
          body: 'Immediate text.',
        })
        const root = document.querySelector('#root').shadowRoot
        return root.querySelector('[data-note-title]').getAnimations().length
      })
      assert.equal(animations, 0)
    },
  })
})

test('should show refresh status beside dimensions without moving content, including reduced motion', async () => {
  await withChrome({
    run: async ({ page }) => {
      const root = page.locator('#root')
      const content = await root.locator('[data-content]').boundingBox()
      await page.getByLabel('Keep focus').focus()
      await page.evaluate(() => window.chromeDemo.setRefreshState({ state: 'refreshing' }))
      const status = root.getByRole('status')
      assert.equal(await status.textContent(), 'Refreshing…')
      assert.equal(
        await root.locator('[data-refresh-text]').evaluate((e) => getComputedStyle(e).position),
        'absolute',
      )
      assert.equal(await root.locator('[data-refresh-text]').evaluate((e) => e.clientWidth), 1)
      assert.equal(await root.locator('[data-size]').textContent(), '1280 × 720')
      assert.deepEqual(await root.locator('[data-content]').boundingBox(), content)
      for (const width of [768, 390]) {
        await page.evaluate((width) => window.chromeDemo.setViewport({ width, height: 720 }), width)
        const boxes = await root
          .locator('[data-header-info]')
          .evaluate((e) => ({ width: e.clientWidth, scroll: e.scrollWidth }))
        assert.ok(boxes.scroll <= boxes.width)
        assert.equal(await status.isVisible(), true)
      }
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
      await page.waitForTimeout(1100)
      assert.equal(await status.isVisible(), false)
      await page.evaluate(() => window.chromeDemo.setRefreshState({ state: 'failed' }))
      assert.equal(await status.textContent(), 'Refresh failed')
      await page.evaluate(() => window.chromeDemo.setRefreshState({ state: 'idle' }))
      assert.equal(await status.isVisible(), false)
    },
  })
})

test('should show the first step immediately when opening or restarting annotations', async () => {
  await withChrome({
    run: async ({ page }) => {
      const states = await page.evaluate(() => {
        const root = document.querySelector('#root').shadowRoot
        const first = { index: 1, total: 2, title: 'Opening step', body: 'Visible immediately.' }
        const states = []
        const capture = () =>
          states.push({
            titleOpacity: getComputedStyle(root.querySelector('[data-note-title]')).opacity,
            bodyOpacity: getComputedStyle(root.querySelector('[data-note-body]')).opacity,
            animations:
              root.querySelector('[data-note-title]').getAnimations().length +
              root.querySelector('[data-note-body]').getAnimations().length,
            ghosts: root.querySelectorAll('[data-annotation-ghost]').length,
          })
        window.chromeDemo.setAnnotation(first)
        capture()
        window.chromeDemo.setAnnotation({ ...first, index: 2, title: 'Later step' })
        window.chromeDemo.setAnnotation(first)
        capture()
        window.chromeDemo.setAnnotation(null)
        window.chromeDemo.setAnnotation(first)
        capture()
        return states
      })
      for (const state of states) {
        assert.deepEqual(state, { titleOpacity: '1', bodyOpacity: '1', animations: 0, ghosts: 0 })
      }
    },
  })
})

test('should divide the header only when annotation or accessibility content is visible', async () => {
  await withChrome({
    run: async ({ page }) => {
      const dividerWidth = () =>
        page
          .locator('#root')
          .locator('.change')
          .evaluate((el) => getComputedStyle(el).borderBottomWidth)
      assert.equal(await dividerWidth(), '0px')
      await page.evaluate(() =>
        window.chromeDemo.setAnnotation({
          index: 1,
          total: 1,
          title: 'Visible step',
          body: 'Supporting content.',
        }),
      )
      assert.equal(await dividerWidth(), '1px')
      await page.evaluate(() => window.chromeDemo.setAnnotation(null))
      assert.equal(await dividerWidth(), '0px')
      await page.evaluate(() => {
        const root = document.createElement('div')
        root.id = 'a11y-root'
        document.body.append(root)
        window.mountDemoChrome({
          root,
          accessibility: true,
          change: { kind: 'Fix', title: 'Keyboard feedback', description: 'Visible commands.' },
        })
      })
      assert.equal(
        await page
          .locator('#a11y-root')
          .locator('.change')
          .evaluate((el) => getComputedStyle(el).borderBottomWidth),
        '1px',
      )
    },
  })
})
