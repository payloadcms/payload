import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import * as recorder from './record-demo.mjs'
import { packageCandidate } from './prepare-demo.mjs'

const { parseArgs, parseViewport, sanitizeLabel } = recorder
const presentationExport = `export const presentation = {
  change: { kind: 'Fix', title: 'Recorder test', description: 'Verify the recording behavior.' },
};\n`

test('parseArgs applies recording defaults and derives a safe output path', () => {
  const options = parseArgs(['--scenario', '/tmp/demo-scenario.mjs'])

  assert.deepEqual(options, {
    baseURL: 'http://localhost:3000',
    interactionPauseMs: 300,
    label: 'feature-demo',
    mouseMoveMs: 400,
    output: '/tmp/payload-pr-demo-feature-demo.webm',
    scenario: '/tmp/demo-scenario.mjs',
    viewport: { height: 900, width: 1440 },
  })
})

test('parseArgs accepts explicit recording options', () => {
  const options = parseArgs([
    '--scenario',
    './scenario.mjs',
    '--base-url',
    'http://localhost:4000',
    '--label',
    'Relationship Drawer',
    '--output',
    '/tmp/relationship-demo.webm',
    '--viewport',
    '1280x720',
    '--mouse-move-ms',
    '900',
    '--interaction-pause-ms',
    '450',
  ])

  assert.deepEqual(options, {
    baseURL: 'http://localhost:4000',
    interactionPauseMs: 450,
    label: 'relationship-drawer',
    mouseMoveMs: 900,
    output: '/tmp/relationship-demo.webm',
    scenario: './scenario.mjs',
    viewport: { height: 720, width: 1280 },
  })
})

test('parseArgs rejects a missing scenario', () => {
  assert.throws(() => parseArgs([]), /--scenario is required/)
})

test('parseArgs rejects unknown options', () => {
  assert.throws(
    () => parseArgs(['--scenario', './scenario.mjs', '--surprise']),
    /Unknown option: --surprise/,
  )
})

test('parseArgs rejects invalid interaction timing values', () => {
  assert.throws(
    () => parseArgs(['--scenario', './scenario.mjs', '--mouse-move-ms', '-1']),
    /--mouse-move-ms must be a non-negative number/,
  )
  assert.throws(
    () => parseArgs(['--scenario', './scenario.mjs', '--interaction-pause-ms', 'quick']),
    /--interaction-pause-ms must be a non-negative number/,
  )
})

test('parseViewport rejects malformed or impractical dimensions', () => {
  assert.throws(() => parseViewport('wide'), /WIDTHxHEIGHT/)
  assert.throws(() => parseViewport('300x200'), /at least 640x480/)
})

test('sanitizeLabel prevents labels from becoming unsafe file paths', () => {
  assert.equal(sanitizeLabel('../../Feature Demo!'), 'feature-demo')
  assert.throws(() => sanitizeLabel('...'), /at least one letter or number/)
})

test('recordDemo saves a completed browser recording before closing the browser', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-browser-test-'))
  const scenario = path.join(directory, 'scenario.mjs')
  const output = path.join(directory, 'demo.webm')

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ page, ready }) {
        await page.goto('data:text/html,<main>Recorded demo</main>')
        await ready()
        await page.waitForTimeout(100)
      }`,
    )

    assert.equal(typeof recorder.recordDemo, 'function')

    await recorder.recordDemo({
      baseURL: 'http://localhost:3000',
      label: 'browser-test',
      output,
      scenario,
      viewport: { height: 480, width: 640 },
    })

    assert.ok((await stat(output)).size > 0)
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('should expose annotation helpers to recording scenarios', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-annotation-scenario-test-'))
  const scenario = path.join(directory, 'scenario.mjs')

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ expect, hideAnnotation, page, showAnnotation }) {
        await page.goto('data:text/html,<main>Annotation demo</main>')
        const stage = page.context().pages()[0]
        await showAnnotation({title:'What changed',body:'The feature works.'})
        await expect(stage.locator('[data-note-body]')).toHaveText('The feature works.')
        await showAnnotation({title:'Result',body:'The second note replaces the first.'})
        await expect(stage.locator('[data-note]')).toHaveCount(1)
        await expect(stage.locator('[data-note-body]')).toHaveText('The second note replaces the first.')
        await expect(page.locator('[data-pr-demo-annotation]')).toHaveCount(0)
        await hideAnnotation()
        await expect(stage.locator('[data-note]')).toBeHidden()
      }`,
    )

    await recorder.validateDemo({
      baseURL: 'http://localhost:3000',
      label: 'annotation-scenario-test',
      scenario,
      viewport: { height: 480, width: 640 },
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('should reject a recording without an opening ready marker', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-missing-ready-test-'))
  const scenario = path.join(directory, 'scenario.mjs')

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ page }) {
        await page.goto('data:text/html,<main>Missing ready marker</main>')
      }`,
    )

    await assert.rejects(
      recorder.recordDemo({
        baseURL: 'http://localhost:3000',
        label: 'missing-ready-test',
        output: path.join(directory, 'demo.webm'),
        scenario,
        viewport: { height: 480, width: 640 },
      }),
      /must call ready\(\)/,
    )
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('recordDemo exposes a smoothly paced click helper', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-click-test-'))
  const scenario = path.join(directory, 'scenario.mjs')
  const output = path.join(directory, 'demo.webm')

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ click, moveCursor, page, ready }) {
        await page.goto('data:text/html,<button type="button">Click me</button>')
        await moveCursor(page.locator('body'), { duration: 0, pauseAfter: 0 })
        await ready()
        await page.evaluate(() => {
          window.demoPointerState = { clicks: 0, moves: 0 }
          document.addEventListener('mousemove', () => { window.demoPointerState.moves += 1 })
          document.querySelector('button').addEventListener('click', () => {
            window.demoPointerState.clicks += 1
          })
        })

        const startedAt = Date.now()
        await click(page.getByRole('button', { name: 'Click me' }))
        const elapsedMs = Date.now() - startedAt
        const state = await page.evaluate(() => window.demoPointerState)

        if (elapsedMs < 120) throw new Error('paced click completed too quickly')
        if (state.moves < 4) throw new Error('cursor did not move smoothly')
        if (state.clicks !== 1) throw new Error('button was not clicked exactly once')
      }`,
    )

    await recorder.recordDemo({
      baseURL: 'http://localhost:3000',
      interactionPauseMs: 30,
      label: 'click-test',
      mouseMoveMs: 80,
      output,
      scenario,
      viewport: { height: 480, width: 640 },
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('recordDemo renders a Mac-style arrow cursor', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-cursor-test-'))
  const scenario = path.join(directory, 'scenario.mjs')
  const output = path.join(directory, 'demo.webm')

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ page, ready }) {
        await page.goto('data:text/html,<main>Cursor demo</main>')
        await ready()
        const cursor = page.locator('[data-pr-demo-cursor="mac-arrow"]')
        await cursor.waitFor()
        const graphic = cursor.locator('svg')
        if ((await graphic.count()) !== 1) {
          throw new Error('Mac-style cursor SVG is missing')
        }
        if ((await graphic.getAttribute('width')) !== '18') {
          throw new Error('Mac-style cursor width is not 18px')
        }
        if ((await graphic.getAttribute('height')) !== '23') {
          throw new Error('Mac-style cursor height is not 23px')
        }
        const styles = await cursor.evaluate((element) => {
          const style = getComputedStyle(element)
          return {
            backgroundColor: style.backgroundColor,
            borderWidth: style.borderTopWidth,
            padding: style.paddingTop,
          }
        })
        if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || styles.borderWidth !== '0px' || styles.padding !== '0px') {
          throw new Error('cursor popover has a visible background, border, or padding')
        }
      }`,
    )

    await recorder.recordDemo({
      baseURL: 'http://localhost:3000',
      label: 'cursor-test',
      output,
      scenario,
      viewport: { height: 480, width: 640 },
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('should trim startup frames to the ready opening state', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-opening-test-'))
  const scenario = path.join(directory, 'scenario.mjs')
  const rawVideo = path.join(directory, 'demo.webm')
  const convertedVideo = path.join(directory, 'demo.mp4')
  let trimStart

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ page, ready }) {
        await page.goto('data:text/html,<body style="margin:0;background:white"><script>setTimeout(() => { document.body.style.background = "rgb(0, 200, 0)"; document.body.id = "ready" }, 1400)</script></body>')
        await page.locator('#ready').waitFor()
        await ready()
      }`,
    )

    await recorder.recordDemo({
      baseURL: 'http://localhost:3000',
      label: 'opening-test',
      onOpeningReady: (seconds) => {
        trimStart = seconds
      },
      output: rawVideo,
      scenario,
      viewport: { height: 480, width: 640 },
    })

    assert.ok(trimStart > 1.4, `Expected delayed opening marker, got ${trimStart}`)
    await packageCandidate({
      contactSheet: path.join(directory, 'contact-sheet.png'),
      label: 'opening-test',
      manifest: path.join(directory, 'manifest.json'),
      output: convertedVideo,
      rawOutput: rawVideo,
      scenario,
      trimStart,
    })

    const firstFrame = spawnSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      convertedVideo,
      '-vf',
      'crop=2:2:800:500',
      '-frames:v',
      '1',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      '-',
    ])
    assert.equal(firstFrame.status, 0, firstFrame.stderr.toString())
    assert.ok(
      firstFrame.stdout[0] < 80 && firstFrame.stdout[1] > 150 && firstFrame.stdout[2] < 80,
      'Opening frame does not show the ready green page',
    )
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('should keep the recorded cursor visible above a popup and modal dialog', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-top-layer-test-'))
  const scenario = path.join(directory, 'scenario.mjs')

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ moveCursor, page }) {
        await page.goto('data:text/html,<button style="position:fixed;left:125px;top:125px">Behind popup</button>')
        await moveCursor(page.getByRole('button', { name: 'Behind popup' }), { pauseAfter: 150 })
        await page.evaluate(() => {
          const popup = document.createElement('div')
          popup.id = 'popup'
          popup.setAttribute('popover', 'auto')
          popup.innerHTML = '<button>Popup item</button>'
          Object.assign(popup.style, { background: 'red', border: '0', height: '100px', left: '100px', margin: '0', padding: '20px', position: 'fixed', top: '100px', width: '200px' })
          document.body.append(popup)
          popup.showPopover()
        })
        await page.waitForTimeout(150)
        await assertCursorVisible(page)
        await moveCursor(page.getByRole('button', { name: 'Popup item' }), { pauseAfter: 150 })
        await assertCursorVisible(page)

        await page.evaluate(() => {
          document.querySelector('#popup').hidePopover()
          const dialog = document.createElement('dialog')
          dialog.innerHTML = '<button>Dialog item</button>'
          Object.assign(dialog.style, { background: 'blue', border: '0', height: '100px', left: '100px', margin: '0', padding: '20px', position: 'fixed', top: '100px', width: '200px' })
          document.body.append(dialog)
          dialog.showModal()
        })
        await page.waitForTimeout(150)
        await assertCursorVisible(page)
        await moveCursor(page.getByRole('button', { name: 'Dialog item' }), { pauseAfter: 150 })
        await assertCursorVisible(page)
      }

      async function assertCursorVisible(page) {
        const cursor = page.locator('[data-pr-demo-cursor]')
        const box = await cursor.boundingBox()
        const clip = { x: box.x, y: box.y, width: 18, height: 23 }
        const withCursor = await page.screenshot({ clip })
        await cursor.evaluate((element) => { element.style.opacity = '0' })
        await page.waitForTimeout(150)
        const withoutCursor = await page.screenshot({ clip })
        await cursor.evaluate((element) => { element.style.opacity = '1' })
        if (withCursor.equals(withoutCursor)) throw new Error('cursor is hidden behind the top layer')
      }`,
    )

    await recorder.validateDemo({
      baseURL: 'http://localhost:3000',
      label: 'top-layer-test',
      scenario,
      viewport: { height: 480, width: 640 },
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('validateDemo executes a scenario without retaining video and forwards fixture data', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-validation-test-'))
  const scenario = path.join(directory, 'scenario.mjs')

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ fixture, page, pause }) {
        await page.goto('data:text/html,<main>Validation</main>')
        if (fixture.documentTitle !== 'Prepared document') {
          throw new Error('fixture data was not forwarded')
        }
        const startedAt = Date.now()
        await pause(500)
        if (Date.now() - startedAt > 100) {
          throw new Error('presentation pause was not removed during validation')
        }
      }`,
    )

    assert.equal(typeof recorder.validateDemo, 'function')

    const result = await recorder.validateDemo({
      baseURL: 'http://localhost:3000',
      fixture: { documentTitle: 'Prepared document' },
      label: 'validation-test',
      scenario,
      viewport: { height: 480, width: 640 },
    })

    assert.equal(result, undefined)
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('should expose scrolling through the real recorder cursor helper during validation', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-scroll-test-'))
  const scenario = path.join(directory, 'scenario.mjs')

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ expect, page, scroll }) {
        await page.goto('data:text/html,<div id="scroller" style="width:200px;height:24px;overflow:auto"><div style="width:264px;height:24px">Tabs</div></div>')
        const result = await scroll(page.locator('#scroller'), { axis: 'x', duration: 100, settle: 0 })
        expect(result).toEqual({ position: 64, target: 64 })
        await expect(page.locator('[data-pr-demo-scroll-anchor]')).toHaveCount(0)
        await expect(page.locator('[data-pr-demo-cursor]')).toHaveCSS('opacity', '1')
      }`,
    )

    await recorder.validateDemo({
      baseURL: 'http://localhost:3000',
      label: 'scroll-test',
      scenario,
      viewport: { height: 480, width: 640 },
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('should smoothly scroll an open popup menu list', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-popup-scroll-test-'))
  const scenario = path.join(directory, 'scenario.mjs')

  try {
    await writeFile(
      scenario,
      `${presentationExport}export default async function scenario({ expect, page, scroll }) {
        await page.goto('data:text/html,<main>Popup scroll</main>')
        await page.evaluate(() => {
          const popup = document.createElement('div')
          popup.setAttribute('popover', 'manual')
          popup.innerHTML = '<div id="menu-list" style="height:100px;width:160px;overflow:auto"><div style="height:300px">Menu items</div></div>'
          Object.assign(popup.style, { left: '100px', margin: '0', padding: '20px', position: 'fixed', top: '80px' })
          document.body.append(popup)
          popup.showPopover()
        })
        const result = await scroll(page.locator('#menu-list'), { duration: 100, settle: 0 })
        expect(result).toEqual({ position: 200, target: 200 })
        await expect(page.locator('[popover]:popover-open')).toHaveCount(2)
        await expect(page.locator('[data-pr-demo-scroll-anchor]')).toHaveCount(0)
      }`,
    )

    await recorder.validateDemo({
      baseURL: 'http://localhost:3000',
      label: 'popup-scroll-test',
      scenario,
      viewport: { height: 480, width: 640 },
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('should reject missing or invalid presentation before running a scenario in every mode', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'required-demo-chrome-'))
  try {
    for (const [name, header] of [
      ['missing', ''],
      ['disabled', 'export const presentation = false;'],
      ['empty-change', 'export const presentation = { change: {} };'],
      [
        'invalid-kind',
        "export const presentation = { change: { kind: 'Other', title: 'Demo', description: 'Details' } };",
      ],
      [
        'blank-title',
        "export const presentation = { change: { kind: 'Fix', title: ' ', description: 'Details' } };",
      ],
      [
        'missing-description',
        "export const presentation = { change: { kind: 'Fix', title: 'Demo' } };",
      ],
      [
        'non-string-description',
        "export const presentation = { change: { kind: 'Fix', title: 'Demo', description: 42 } };",
      ],
    ]) {
      const scenario = path.join(directory, `${name}.mjs`)
      await writeFile(
        scenario,
        `${header}\nexport default async function () { throw new Error('Scenario ran without chrome') }`,
      )
      for (const method of ['recordDemo', 'previewDemo', 'validateDemo']) {
        await assert.rejects(
          () =>
            recorder[method]({
              baseURL: 'http://localhost:3000',
              label: 'required-chrome',
              scenario,
              viewport: { width: 640, height: 480 },
              output:
                method === 'validateDemo'
                  ? undefined
                  : path.join(
                      directory,
                      method === 'previewDemo' ? 'preview.png' : 'recording.webm',
                    ),
            }),
          /must export presentation.*change/,
        )
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
