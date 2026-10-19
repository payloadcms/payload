import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, expect } from '@playwright/test'
import { createPresentation } from './presentation-demo.mjs'

const html = `<!doctype html><html><body style="margin:40px;font:20px system-ui">
<button id="first">First control</button><button id="second">Second control</button>
<input aria-label="Private" type="password"><input aria-label="Title">
<div role="status" id="status"></div><div aria-live="off" id="off"></div>
<div role="alert" aria-busy="true" id="busy"></div>
<div role="status" hidden id="hidden"></div>
<dialog><button>Dialog action</button></dialog>
<script>document.querySelector('#second').addEventListener('keydown',e=>{if(e.key==='ArrowDown')document.querySelector('#status').textContent='Moved to position 2'})</script>
</body></html>`

async function withPresentation({ accessibility = true, run }) {
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
        accessibility,
        change: {
          kind: 'Fix',
          title: 'Keyboard reordering',
          description: 'Keep movement and focus visible.',
        },
      },
      viewport: { width: 1800, height: 1100 },
      pauseScale: 1,
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

test('should track focus in scaled application and dialogs without covering controls', async () => {
  await withPresentation({
    run: async ({ stage, app, presentation }) => {
      await app.locator('#second').focus()
      const highlight = stage.locator('[data-focus-highlight]')
      await expect(highlight).toBeVisible()
      const target = await app.locator('#second').boundingBox()
      const box = await highlight.boundingBox()
      for (const key of ['x', 'y', 'width', 'height'])
        assert.ok(Math.abs(target[key] - box[key]) < 2, key)
      await expect(highlight).toHaveCSS('pointer-events', 'none')
      const panel = await stage.locator('[data-accessibility]').boundingBox()
      const application = await stage.locator('[data-pr-demo-app]').boundingBox()
      assert.ok(application.y + application.height <= panel.y)
      await app.locator('dialog').evaluate((el) => el.showModal())
      await expect(app.getByRole('button', { name: 'Dialog action' })).toBeFocused()
      await expect
        .poll(async () => {
          const focused = await app.getByRole('button', { name: 'Dialog action' }).boundingBox()
          const overlay = await highlight.boundingBox()
          return Math.abs(focused.x - overlay.x) < 2 && Math.abs(focused.y - overlay.y) < 2
        })
        .toBe(true)
      await app.locator('dialog').evaluate((el) => el.close())
      await presentation.resizeWindow({ width: 600, height: 700, duration: 0 })
      await expect
        .poll(async () => {
          const focused = await app.locator('#second').boundingBox()
          const overlay = await highlight.boundingBox()
          return Math.abs(focused.x - overlay.x) < 2 && Math.abs(focused.y - overlay.y) < 2
        })
        .toBe(true)
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

test('should clear transient key captions and stop observing when the presentation stops', async () => {
  await withPresentation({
    run: async ({ stage, app, presentation }) => {
      await app.locator('#first').focus()
      await stage.keyboard.press('ArrowRight')
      await expect(stage.locator('[data-keystroke]')).toHaveText('→')
      await expect(stage.locator('[data-keystroke]')).toHaveText('—', { timeout: 3000 })
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
      assert.equal(await stage.locator('[data-keystroke]').textContent(), '—')
    },
  })
})
