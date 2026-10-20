import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, expect } from '@playwright/test'
import { createPresentation } from './presentation-demo.mjs'

const html = `<!doctype html><html><body style="margin:40px;font:20px system-ui">
<style>button:focus-visible { outline:2px solid rgb(120,50,180); outline-offset:3px }</style>
<button id="first">First control</button><button id="second">Second control</button>
<input aria-label="Private" type="password"><input aria-label="Title">
<div role="status" id="status"></div><div aria-live="off" id="off"></div>
<div role="alert" aria-busy="true" id="busy"></div>
<div role="status" hidden id="hidden"></div>
<dialog><button>Dialog action</button></dialog>
<script>document.querySelector('#second').addEventListener('keydown',e=>{if(e.key==='ArrowDown')document.querySelector('#status').textContent='Moved to position 2'})</script>
</body></html>`

async function withPresentation({ accessibility = true, showAnnouncements = true, run }) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  await context.route('http://localhost:3000/fixture*', (route) =>
    route.fulfill({ contentType: 'text/html', body: html }),
  )
  const stage = await context.newPage()
  let presentation
  try {
    presentation = await createPresentation({
      page: stage,
      options: {
        canvas: { width: 1600, height: 1000 },
        accessibility,
        showAnnouncements,
        change: {
          kind: 'Fix',
          title: 'Keyboard reordering',
          description: 'Keep movement and focus visible.',
        },
      },
      viewport: { width: 1800, height: 1100 },
      pauseScale: 1,
    })
    await presentation.setAnnotation({
      title: 'Move a row',
      body: 'Use the keyboard to reorder content.',
      index: 1,
      total: 2,
    })
    await presentation.appPage.goto('http://localhost:3000/fixture')
    await run({ stage, app: presentation.appPage, presentation })
  } finally {
    await presentation?.stop()
    await browser.close()
  }
}

test('should leave accessibility overlays absent unless enabled', async () => {
  await withPresentation({
    accessibility: false,
    run: async ({ stage }) => {
      await expect(stage.locator('[data-accessibility]')).toHaveCount(0)
      await expect(stage.locator('[data-focus-highlight]')).toHaveCount(0)
    },
  })
})

test('should show trusted navigation keys without exposing ordinary or password typing', async () => {
  await withPresentation({
    run: async ({ stage, app }) => {
      await app.locator('#first').focus()
      await stage.keyboard.press('Tab')
      await expect(app.locator('#second')).toBeFocused()
      await expect(stage.locator('[data-keystroke]')).toHaveText('Tab')
      await stage.keyboard.press('ArrowDown')
      await expect(stage.locator('[data-keystroke]')).toHaveText('↓')
      await expect(stage.locator('[data-announcement]')).toHaveText('Moved to position 2')
      await app.getByRole('textbox', { name: 'Title' }).focus()
      await stage.keyboard.type('Private ordinary typing')
      await expect(stage.locator('[data-keystroke]')).toHaveText('↓')
      await app.locator('input[type=password]').focus()
      await stage.keyboard.press('ControlOrMeta+A')
      await stage.keyboard.type('secret')
      await expect(stage.locator('[data-keystroke]')).toHaveText('↓')
      await expect(stage.locator('[data-accessibility]')).toHaveAttribute('aria-hidden', 'true')
    },
  })
})

test('should preserve application focus styling in dialogs and scaled views without adding an outline', async () => {
  await withPresentation({
    run: async ({ stage, app, presentation }) => {
      await app.locator('#first').focus()
      await stage.keyboard.press('Tab')
      await expect(app.locator('#second')).toBeFocused()
      await expect(app.locator('#second')).toHaveCSS('outline-color', 'rgb(120, 50, 180)')
      await expect(app.locator('#second')).toHaveCSS('outline-width', '2px')
      await expect(app.locator('#second')).toHaveCSS('outline-offset', '3px')
      await expect(stage.locator('[data-focus-highlight]')).toHaveCount(0)
      const panel = await stage.locator('[data-accessibility]').boundingBox()
      const application = await stage.locator('[data-pr-demo-app]').boundingBox()
      assert.ok(panel.y + panel.height <= application.y)
      await app.locator('dialog').evaluate((el) => el.showModal())
      const action = app.getByRole('button', { name: 'Dialog action' })
      await expect(action).toBeFocused()
      await expect(action).toHaveCSS('outline-color', 'rgb(120, 50, 180)')
      await expect(stage.locator('[data-focus-highlight]')).toHaveCount(0)
      await app.locator('dialog').evaluate((el) => el.close())
      await presentation.resizeWindow({ width: 600, height: 700, duration: 0 })
      await expect(app.locator('#second')).toBeFocused()
      await expect(app.locator('#second')).toHaveCSS('outline-width', '2px')
      await expect(app.locator('#second')).toHaveCSS('outline-color', 'rgb(120, 50, 180)')
      await expect(stage.locator('[data-focus-highlight]')).toHaveCount(0)
    },
  })
})

test('should caption region changes while ignoring off hidden and busy regions', async () => {
  await withPresentation({
    run: async ({ stage, app }) => {
      const caption = stage.locator('[data-announcement]')
      await app.locator('#status').evaluate((el) => (el.textContent = 'Saved'))
      await expect(caption).toHaveText('Saved')
      await app.evaluate(() => {
        document.querySelector('#off').textContent = 'Ignore off'
        document.querySelector('#hidden').textContent = 'Ignore hidden'
        document.querySelector('#busy').textContent = 'Still busy'
      })
      await stage.waitForTimeout(100)
      await expect(caption).toHaveText('Saved')
      await app.locator('#busy').evaluate((el) => el.setAttribute('aria-busy', 'false'))
      await expect(caption).toHaveText('Still busy')
      await app.evaluate(() => {
        const region = document.createElement('div')
        region.setAttribute('role', 'alert')
        region.textContent = 'New alert'
        document.body.append(region)
      })
      await expect(caption).toHaveText('New alert')
      await app.goto('http://localhost:3000/fixture?next')
      await app.locator('#status').evaluate((el) => (el.textContent = 'After navigation'))
      await expect(caption).toHaveText('After navigation')
      await app.reload()
      await app.locator('#status').evaluate((el) => (el.textContent = 'After reload'))
      await expect(caption).toHaveText('After reload')
    },
  })
})

test('should reset key history on navigation and stop observing when the presentation stops', async () => {
  await withPresentation({
    run: async ({ stage, app, presentation }) => {
      await app.locator('#first').focus()
      await stage.keyboard.press('ArrowRight')
      await expect(stage.locator('[data-keystroke]')).toHaveText('→')
      await expect(stage.locator('[data-keystroke-overlay]')).toBeVisible()
      await stage.keyboard.press('ArrowLeft')
      await expect(stage.locator('[data-key-history-entry]')).toHaveText('→')
      await app.goto('http://localhost:3000/fixture?reset')
      await expect(stage.locator('[data-keystroke-overlay]')).toBeHidden()
      await expect(stage.locator('[data-key-history-entry]')).toHaveCount(0)
      await app.locator('#status').evaluate((el) => (el.textContent = 'Before stop'))
      await expect(stage.locator('[data-announcement]')).toHaveText('Before stop')
      await presentation.stop()
      await app.locator('#status').evaluate((el) => (el.textContent = 'After stop'))
      await stage.waitForTimeout(100)
      await expect(stage.locator('[data-announcement]')).toHaveText('Before stop')
    },
  })
})

test('should caption pending updates when a busy ancestor becomes available', async () => {
  await withPresentation({
    run: async ({ stage, app }) => {
      await app.evaluate(() => {
        const wrapper = document.createElement('div')
        wrapper.id = 'busy-wrapper'
        wrapper.setAttribute('aria-busy', 'true')
        wrapper.innerHTML = '<div role="status">Ready after loading</div>'
        document.body.append(wrapper)
      })
      await stage.waitForTimeout(100)
      assert.equal(
        await stage.locator('[data-announcement]').textContent(),
        'Waiting for an update…',
      )
      await app.locator('#busy-wrapper').evaluate((el) => el.setAttribute('aria-busy', 'false'))
      await expect(stage.locator('[data-announcement]')).toHaveText('Ready after loading')
    },
  })
})

test('should suppress keys from inputs inside private shadow hosts', async () => {
  await withPresentation({
    run: async ({ stage, app }) => {
      await app.evaluate(() => {
        const host = document.createElement('div')
        host.id = 'private-host'
        host.dataset.private = ''
        host.attachShadow({ mode: 'open' }).innerHTML = '<input aria-label="Private shadow input">'
        document.body.append(host)
      })
      await app.getByRole('textbox', { name: 'Private shadow input' }).focus()
      await stage.keyboard.press('ControlOrMeta+A')
      await stage.waitForTimeout(100)
      assert.equal(await stage.locator('[data-keystroke-overlay]').isVisible(), false)
    },
  })
})

test('should keep key history inside the annotation panel without moving the application', async () => {
  let plainWindow
  await withPresentation({
    accessibility: false,
    showAnnouncements: false,
    run: async ({ stage }) => {
      plainWindow = await stage.locator('[data-window]').boundingBox()
    },
  })
  await withPresentation({
    showAnnouncements: false,
    run: async ({ stage, app }) => {
      await expect(stage.locator('[data-a11y-badge]')).toHaveText('a11y')
      await expect(stage.locator('[data-announcement]')).toHaveCount(0)
      const initialPanel = await stage.locator('[data-footer]').boundingBox()
      const initialWindow = await stage.locator('[data-window]').boundingBox()
      assert.ok(initialWindow.height < plainWindow.height)
      const overlay = stage.locator('[data-keystroke-overlay]')
      await expect(overlay).toBeHidden()
      await app.locator('#first').focus()
      await stage.keyboard.press('Tab')
      await expect(app.locator('#second')).toBeFocused()
      await expect(overlay).toBeVisible()
      await expect(stage.locator('[data-keystroke]')).toHaveText('Tab')
      await expect(overlay).toHaveCSS('pointer-events', 'none')
      await expect(overlay).toHaveAttribute('aria-hidden', 'true')
      const box = await overlay.boundingBox()
      const windowBox = await stage.locator('[data-window]').boundingBox()
      assert.ok(initialPanel.y + initialPanel.height <= windowBox.y)
      assert.ok(box.x >= initialPanel.x && box.y >= initialPanel.y)
      assert.ok(box.x + box.width <= initialPanel.x + initialPanel.width)
      assert.ok(box.y + box.height <= initialPanel.y + initialPanel.height)
      assert.deepEqual(windowBox, initialWindow)
      await stage.waitForTimeout(2100)
      await expect(overlay).toBeVisible()
      assert.deepEqual(await stage.locator('[data-window]').boundingBox(), initialWindow)
      assert.deepEqual(await stage.locator('[data-footer]').boundingBox(), initialPanel)
    },
  })
})

test('should place badge captions and key history in one full-width row below the annotation content', async () => {
  await withPresentation({
    run: async ({ stage, app, presentation }) => {
      await app.locator('#first').focus()
      for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'Enter']) {
        await stage.keyboard.press(key)
      }
      await expect(stage.locator('[data-keystroke]')).toHaveText('Enter')
      await expect(stage.locator('[data-key-history-entry]')).toHaveText(['↓', '→', '←'])
      const previousColor = await stage
        .locator('[data-key-history-entry] kbd')
        .first()
        .evaluate((el) => getComputedStyle(el).color)
      const currentColor = await stage
        .locator('[data-keystroke] kbd')
        .first()
        .evaluate((el) => getComputedStyle(el).color)
      assert.notEqual(previousColor, currentColor)
      await expect(stage.locator('[data-speaking-icon]')).toHaveCount(1)
      await expect(stage.locator('[data-announcement]')).toHaveCSS('white-space', 'nowrap')
      for (const viewport of [
        { width: 1800, height: 1100 },
        { width: 600, height: 700 },
      ]) {
        await presentation.resizeWindow({ ...viewport, duration: 0 })
        const panel = await stage.locator('[data-footer]').boundingBox()
        const appBox = await stage.locator('[data-window]').boundingBox()
        const step = await stage.locator('[data-note-body]').boundingBox()
        const caption = await stage.locator('[data-announcement]').boundingBox()
        const history = await stage.locator('[data-keystroke-overlay]').boundingBox()
        assert.ok(panel.y + panel.height <= appBox.y)
        for (const box of [caption, history]) {
          assert.ok(box.x >= panel.x && box.y >= panel.y)
          assert.ok(box.x + box.width <= panel.x + panel.width)
          assert.ok(box.y + box.height <= panel.y + panel.height)
        }
        assert.ok(step.y + step.height <= caption.y)
        assert.ok(Math.abs(caption.y + caption.height / 2 - history.y - history.height / 2) < 2)
        assert.ok(caption.x + caption.width <= history.x)
        assert.ok(
          history.x - caption.x - caption.width < 40,
          'Keys should stay beside the announcement',
        )
        const row = await stage.locator('[data-accessibility]').boundingBox()
        const badge = await stage.locator('[data-a11y-badge]').boundingBox()
        const change = await stage.locator('.change').boundingBox()
        assert.ok(row.width > panel.width * 0.9)
        assert.ok(change.y + change.height <= row.y)
        assert.ok(badge.x + badge.width < caption.x)
      }
    },
  })
})

test('should show each shortcut key in a separate keycap with plain plus separators', async () => {
  await withPresentation({
    showAnnouncements: false,
    run: async ({ stage, app }) => {
      await app.locator('#second').focus()
      await stage.keyboard.press('Shift+Tab')
      const chord = stage.locator('[data-keystroke]')
      await expect(chord.locator('kbd')).toHaveText(['Shift', 'Tab'])
      await expect(chord.locator('[data-key-separator]')).toHaveText('+')
      await stage.keyboard.press('ControlOrMeta+Shift+ArrowDown')
      await expect(chord.locator('kbd')).toHaveText([
        process.platform === 'darwin' ? '⌘' : 'Ctrl',
        'Shift',
        '↓',
      ])
      await expect(chord.locator('[data-key-separator]')).toHaveCount(2)
      await stage.keyboard.press('ArrowRight')
      await expect(chord.locator('kbd')).toHaveText(['→'])
      await expect(chord.locator('[data-key-separator]')).toHaveCount(0)
    },
  })
})

test('should slide the previous command right at a scaled size and respect reduced motion', async () => {
  await withPresentation({
    run: async ({ stage, app }) => {
      await stage.setViewportSize({ width: 1000, height: 800 })
      await app.locator('#first').focus()
      await stage.keyboard.press('ArrowUp')
      await stage.waitForTimeout(250)
      const previousLeft = await stage.locator('[data-keystroke]').evaluate((el) => {
        window.previousCommand = el
        return el.getBoundingClientRect().left
      })
      await stage.keyboard.press('ArrowDown')
      const positions = await stage.locator('[data-key-history-entry]').evaluate((el) => {
        const animation = el.getAnimations()[0]
        if (!animation) throw new Error('Expected the prior command to animate')
        animation.pause()
        return [0, 110, 220].map((time) => {
          animation.currentTime = time
          return { x: el.getBoundingClientRect().left, isSameNode: el === window.previousCommand }
        })
      })
      assert.ok(positions.every((position) => position.isSameNode))
      assert.ok(Math.abs(positions[0].x - previousLeft) < 2)
      assert.ok(positions[0].x < positions[1].x && positions[1].x < positions[2].x)
      await stage.emulateMedia({ reducedMotion: 'reduce' })
      await stage.keyboard.press('ArrowLeft')
      await expect(stage.locator('[data-keystroke]')).toHaveText('←')
      assert.equal(
        await stage
          .locator('[data-keystroke-overlay]')
          .evaluate((el) => el.getAnimations({ subtree: true }).length),
        0,
      )
      await expect(stage.locator('[data-key-history-entry]')).toHaveText(['↓', '↑'])
    },
  })
})
