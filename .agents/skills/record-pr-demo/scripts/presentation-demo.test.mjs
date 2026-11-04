import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { convertDemo } from './convert-demo.mjs'
import { previewDemo, recordDemo, validateDemo } from './record-demo.mjs'

async function withScenario({ run }) {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-presentation-'))
  const scenario = path.join(directory, 'scenario.mjs')
  try {
    await writeFile(
      scenario,
      `
      export const presentation = {
        change: { kind: 'Feature', title: 'Responsive lists', description: 'Manage posts at any size.' },
      }
      export default async function ({ page, expect, ready, resizeWindow, setAnnotation, clearAnnotation }) {
        if (typeof resizeWindow !== 'function') throw new Error('Missing resizeWindow helper')
        await page.goto('data:text/html,<style>body{margin:0;background:rgb(0,200,0)}@media(max-width:600px){body{background:rgb(0,0,200)}}</style><button>Real app button</button>')
        await setAnnotation({ index: 1, total: 2, title: 'Desktop', body: 'Full layout.' })
        await ready()
        await resizeWindow({ width: 390, height: 720, duration: 240 })
        await expect(page.getByRole('button', { name: 'Real app button' })).toBeVisible()
        if (await page.evaluate(() => innerWidth) !== 390) throw new Error('Application was not really resized')
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 200)')
        await clearAnnotation()
        await setAnnotation({ index: 2, total: 2, title: 'Mobile', body: 'Compact layout.' })
      }
    `,
    )
    await run({ directory, scenario })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
}

test('should preview the shared presentation while resizing the live application iframe', async () => {
  await withScenario({
    run: async ({ directory, scenario }) => {
      const output = path.join(directory, 'preview.png')
      await previewDemo({
        baseURL: 'http://localhost:3000',
        label: 'preview',
        output,
        scenario,
        viewport: { width: 1280, height: 720 },
      })
      const probe = spawnSync('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'stream=width,height',
        '-of',
        'json',
        output,
      ])
      assert.equal(probe.status, 0, probe.stderr.toString())
      assert.deepEqual(JSON.parse(probe.stdout).streams[0], { width: 1600, height: 1000 })
      const pixel = spawnSync('ffmpeg', [
        '-v',
        'error',
        '-i',
        output,
        '-vf',
        'crop=2:2:800:400',
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        '-',
      ])
      assert.equal(pixel.status, 0, pixel.stderr.toString())
      assert.ok(
        pixel.stdout[2] > 150 && pixel.stdout[0] < 80,
        'Preview must contain the blue mobile application frame',
      )
    },
  })
})

test('should record a fixed-size canvas across genuine viewport changes and retain ready timing', async () => {
  await withScenario({
    run: async ({ directory, scenario }) => {
      const output = path.join(directory, 'recording.webm')
      let readyTime
      await recordDemo({
        baseURL: 'http://localhost:3000',
        label: 'record',
        output,
        scenario,
        viewport: { width: 1280, height: 720 },
        onOpeningReady: (value) => {
          readyTime = value
        },
      })
      assert.ok(readyTime > 0)
      const converted = path.join(directory, 'recording.mp4')
      await convertDemo({ input: output, output: converted, trimStart: readyTime })
      const opening = spawnSync('ffmpeg', [
        '-v',
        'error',
        '-i',
        converted,
        '-vf',
        'crop=2:2:800:400',
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        '-',
      ])
      assert.equal(opening.status, 0, opening.stderr.toString())
      assert.ok(
        opening.stdout[1] > 150 && opening.stdout[0] < 80 && opening.stdout[2] < 80,
        'Composed MP4 must open on the ready green application frame',
      )
      const probe = spawnSync('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'stream=width,height',
        '-of',
        'json',
        output,
      ])
      assert.equal(probe.status, 0, probe.stderr.toString())
      assert.deepEqual(JSON.parse(probe.stdout).streams[0], { width: 1600, height: 1000 })
      const pixel = spawnSync('ffmpeg', [
        '-v',
        'error',
        '-sseof',
        '-0.2',
        '-i',
        output,
        '-vf',
        'crop=2:2:800:400',
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        '-',
      ])
      assert.equal(pixel.status, 0, pixel.stderr.toString())
      assert.ok(
        pixel.stdout[2] > 150 && pixel.stdout[0] < 80,
        'Recording must contain the blue mobile application frame',
      )
      const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', output, '-f', 'null', '-'])
      assert.equal(decode.status, 0, decode.stderr.toString())
    },
  })
})

test('should exercise the same presentation helpers during fast validation', async () => {
  await withScenario({
    run: async ({ scenario }) => {
      await validateDemo({
        baseURL: 'http://localhost:3000',
        label: 'validation',
        scenario,
        viewport: { width: 1280, height: 720 },
      })
    },
  })
})

test('should resize the live application iframe in the recorded page without image capture', async () => {
  const { chromium } = await import('@playwright/test')
  const { createPresentation } = await import('./presentation-demo.mjs')
  const browser = await chromium.launch({ headless: true })
  let presentation
  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
    await context.route('http://app.test/editor', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `<style>body{margin:0;background:green}@media(max-width:600px){body{background:blue}}</style><button onclick="this.textContent='Clicked'">Real button</button><script>window.widths=[];addEventListener('resize',()=>window.widths.push(innerWidth))</script>`,
      }),
    )
    const stage = await context.newPage()
    presentation = await createPresentation({
      browser,
      page: stage,
      baseURL: 'http://app.test',
      viewport: { width: 1280, height: 720 },
      pauseScale: 1,
      options: {
        change: {
          kind: 'Fix',
          title: 'Native iframe resize',
          description: 'One browser renders the app and its chrome.',
        },
      },
    })
    assert.ok(presentation.appPage, 'Application must live in the recorded iframe')
    await presentation.appPage.goto('http://app.test/editor')
    assert.equal(await presentation.appPage.evaluate(() => window.self !== window.top), true)
    assert.equal(await stage.locator('iframe').count(), 1)
    assert.equal(await stage.locator('[data-frame]').count(), 0)
    await presentation.appPage.getByRole('button', { name: 'Real button' }).click()
    assert.equal(await presentation.appPage.getByRole('button').textContent(), 'Clicked')
    await presentation.appPage.reload()
    assert.equal(await stage.locator('iframe').count(), 1)
    assert.equal(await presentation.appPage.getByRole('button').textContent(), 'Real button')
    for (const method of ['goBack', 'goForward']) {
      await assert.rejects(() => presentation.appPage[method](), /not supported.*presentation/)
    }
    await presentation.resizeWindow({ width: 390, height: 720, duration: 500 })
    const widths = await presentation.appPage.evaluate(() => window.widths)
    assert.ok(new Set(widths).size >= 8, 'The real iframe must reflow throughout the animation')
    assert.equal(await presentation.appPage.evaluate(() => innerWidth), 390)
    assert.deepEqual(stage.viewportSize(), { width: 1600, height: 1000 })
    assert.equal(
      browser.contexts().length,
      1,
      'Record one page/context, with no second app browser surface',
    )
    assert.equal(context.pages().length, 1)
    assert.equal(
      await presentation.appPage
        .locator('body')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      'rgb(0, 0, 255)',
    )
  } finally {
    await presentation?.stop()
    await browser.close()
  }
})

test('should preserve app-relative pointer positions when the iframe is scaled to fit', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-scaled-pointer-'))
  const scenario = path.join(directory, 'scenario.mjs')
  try {
    await writeFile(
      scenario,
      `
      export const presentation = {
        change: { kind: 'Fix', title: 'Scaled pointer', description: 'Keep input coordinates accurate.' },
      }
      export default async function ({ page, moveCursor, click }) {
        await page.goto('data:text/html,' + encodeURIComponent(\`<style>body{margin:0}button{display:block;width:240px;height:240px;border:0;padding:0}</style><button onmousemove="window.moved=[event.clientX,event.clientY]" onclick="window.clicked=[event.clientX,event.clientY]">Target</button>\`))
        const target = page.getByRole('button', { name: 'Target' })
        await moveCursor(target, { position: { x: 100, y: 100 }, duration: 0, pauseAfter: 0 })
        const moved = await page.evaluate(() => window.moved)
        if (moved.some(value => Math.abs(value - 100) > 1)) throw new Error('Wrong move coordinates: ' + moved)
        await click(target, { position: { x: 100, y: 100 }, duration: 0, before: 0, after: 0 })
        const clicked = await page.evaluate(() => window.clicked)
        if (clicked.some(value => Math.abs(value - 100) > 1)) throw new Error('Wrong click coordinates: ' + clicked)
      }
    `,
    )
    await validateDemo({
      baseURL: 'http://localhost:3000',
      label: 'scaled-pointer',
      scenario,
      viewport: { width: 1920, height: 1080 },
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('should route the existing annotation API into chrome without floating overlays', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-panel-api-'))
  const scenario = path.join(directory, 'scenario.mjs')
  try {
    await writeFile(
      scenario,
      `
      export const presentation = {change:{kind:'Feature',title:'Unified annotations',description:'One API for the recording.'}}
      export default async function ({page, expect, showAnnotation, hideAnnotation, setAnnotation, clearAnnotation}) {
        await page.goto('data:text/html,<input aria-label="Editor">')
        await page.getByRole('textbox').focus()
        const stage=page.context().pages()[0]
        await showAnnotation({title:'First step',body:'Panel detail.',index:1,total:2})
        await expect(stage.locator('[data-note-title]')).toHaveText('First step')
        await expect(stage.locator('[data-step-count]')).toHaveText('Step 1 of 2')
        await expect(page.locator('[data-pr-demo-annotation]')).toHaveCount(0)
        await expect(page.getByRole('textbox')).toBeFocused()
        await showAnnotation({title:'Next step',body:'Fast validation settles immediately.',index:2,total:2})
        await expect(stage.locator('[data-progress-fill]')).toHaveCSS('transition-duration','0s')
        try {
          await showAnnotation({type:'floating',body:'Legacy note.',position:{top:20,right:20}})
          throw new Error('Floating annotation was accepted')
        } catch(error) {
          if(!error.message.includes('remove type, position, and width')) throw error
        }
        await expect(stage.locator('[data-note-title]')).toHaveText('Next step')
        await showAnnotation({title:'Single note',body:'No progress ring.'})
        await expect(stage.locator('[data-step-progress]')).toBeHidden()
        await expect(page.locator('[data-pr-demo-annotation]')).toHaveCount(0)
        await hideAnnotation()
        await expect(stage.locator('[data-note]')).toBeHidden()
        await expect(stage.locator('[data-title]')).toHaveText('Unified annotations')
        await setAnnotation({title:'Alias step',body:'Same panel.',index:2,total:2})
        await expect(stage.locator('[data-note-title]')).toHaveText('Alias step')
        try { await showAnnotation({title:'Invalid',body:'Detail',index:3,total:2}); throw new Error('Invalid step accepted') }
        catch(error) { if(!error.message.includes('pagination')) throw error }
        await expect(stage.locator('[data-note-title]')).toHaveText('Alias step')
        await clearAnnotation()
        await expect(stage.locator('[data-note]')).toBeHidden()
      }
    `,
    )
    await validateDemo({
      baseURL: 'http://localhost:3000',
      label: 'panel-api',
      scenario,
      viewport: { width: 1280, height: 720 },
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('should indicate real reloads through completion and failure while viewport dimensions remain visible', async () => {
  const { chromium, expect } = await import('@playwright/test')
  const { createPresentation } = await import('./presentation-demo.mjs')
  const browser = await chromium.launch({ headless: true })
  let presentation
  let release
  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
    let requests = 0
    await context.route('http://app.test/reload', async (route) => {
      requests++
      if (requests === 2)
        await new Promise((resolve) => {
          release = resolve
        })
      if (requests === 3) return route.abort('failed')
      await route.fulfill({ contentType: 'text/html', body: `<button>Loaded ${requests}</button>` })
    })
    const stage = await context.newPage()
    presentation = await createPresentation({
      page: stage,
      baseURL: 'http://app.test',
      viewport: { width: 1280, height: 720 },
      pauseScale: 1,
      options: {
        change: { kind: 'Fix', title: 'Refresh status', description: 'See the real frame reload.' },
      },
    })
    await presentation.appPage.goto('http://app.test/reload')
    const initialPanel = await stage.locator('[data-footer]').boundingBox()
    const pending = presentation.appPage.reload()
    await expect(stage.getByRole('status')).toHaveText('Refreshing…')
    await expect.poll(() => Boolean(release)).toBe(true)
    await assert.rejects(() => presentation.appPage.reload(), /Await the previous/)
    await presentation.resizeWindow({ width: 390, height: 720, duration: 100 })
    await expect(stage.locator('[data-size]')).toHaveText('390 × 720')
    await expect(stage.getByRole('status')).toHaveText('Refreshing…')
    assert.deepEqual(await stage.locator('[data-footer]').boundingBox(), initialPanel)
    release()
    const response = await pending
    assert.equal(response.status(), 200)
    assert.equal(requests, 2)
    await expect(presentation.appPage.getByRole('button')).toHaveText('Loaded 2')
    await expect(stage.getByRole('status')).toHaveText('Refreshed')
    await assert.rejects(() => presentation.appPage.reload({ timeout: 3000 }))
    await expect(stage.getByRole('status')).toHaveText('Refresh failed')
    await stage.waitForTimeout(1100)
    await expect(stage.getByRole('status')).toHaveText('Refresh failed')
  } finally {
    release?.()
    await presentation?.stop()
    await browser.close()
  }
})

for (const accessibility of [false, true]) {
  test(`should preserve one CSS pixel per captured pixel with accessibility ${accessibility}`, async () => {
    await withScenario({
      run: async ({ directory, scenario }) => {
        await writeFile(
          scenario,
          `
          export const presentation = {
            accessibility: ${accessibility},
            change: {kind:'Feature', title:'Native detail', description:'Preserve thin borders.'},
          }
          export default async function ({page, expect, ready, showAnnotation, resizeWindow}) {
            await page.goto('data:text/html,<button>Native app</button>')
            await showAnnotation({index:1,total:1,title:'Inspect controls',body:'Keep their original dimensions.'})
            await ready()
            const stage = page.context().pages()[0]
            const geometry = await stage.evaluate(() => {
              const bounds = document.querySelector('iframe').getBoundingClientRect()
              return {width:bounds.width,height:bounds.height,canvasHeight:innerHeight}
            })
            expect(geometry).toEqual({width:1440,height:900,canvasHeight:${accessibility ? 1188 : 1148}})
            await resizeWindow({width:390,height:720,duration:0})
            expect(await stage.evaluate(() => innerHeight)).toBe(${accessibility ? 1188 : 1148})
          }
        `,
        )
        const output = path.join(directory, 'native.png')
        await previewDemo({
          baseURL: 'http://localhost:3000',
          label: 'native-detail',
          output,
          scenario,
          viewport: { width: 1440, height: 900 },
        })
        const probe = spawnSync('ffprobe', [
          '-v',
          'error',
          '-show_entries',
          'stream=width,height',
          '-of',
          'json',
          output,
        ])
        assert.equal(probe.status, 0, probe.stderr.toString())
        assert.deepEqual(JSON.parse(probe.stdout).streams[0], {
          width: 1600,
          height: accessibility ? 1188 : 1148,
        })
      },
    })
  })
}
