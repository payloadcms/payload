import assert from 'node:assert/strict'
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import * as recorder from './record-demo.mjs'

const { parseArgs, parseViewport, sanitizeLabel } = recorder

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
      `export default async function scenario({ page }) {
        await page.goto('data:text/html,<main>Recorded demo</main>')
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

test('recordDemo exposes a smoothly paced click helper', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-click-test-'))
  const scenario = path.join(directory, 'scenario.mjs')
  const output = path.join(directory, 'demo.webm')

  try {
    await writeFile(
      scenario,
      `export default async function scenario({ click, page }) {
        await page.goto('data:text/html,<button type="button">Click me</button>')
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
      `export default async function scenario({ page }) {
        await page.goto('data:text/html,<main>Cursor demo</main>')
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

test('validateDemo executes a scenario without retaining video and forwards fixture data', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-validation-test-'))
  const scenario = path.join(directory, 'scenario.mjs')

  try {
    await writeFile(
      scenario,
      `export default async function scenario({ fixture, page, pause }) {
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
