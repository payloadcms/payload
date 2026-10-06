#!/usr/bin/env node

import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DEFAULT_BASE_URL = 'http://localhost:3000'
const DEFAULT_INTERACTION_PAUSE_MS = 300
const DEFAULT_LABEL = 'feature-demo'
const DEFAULT_MOUSE_MOVE_MS = 400
const DEFAULT_VIEWPORT = { height: 900, width: 1440 }

export function parseArgs(argv) {
  const values = new Map()
  const supportedOptions = new Set([
    '--base-url',
    '--interaction-pause-ms',
    '--label',
    '--mouse-move-ms',
    '--output',
    '--scenario',
    '--viewport',
  ])

  for (let index = 0; index < argv.length; index += 2) {
    const option = argv[index]
    const value = argv[index + 1]

    if (!supportedOptions.has(option)) {
      throw new Error(`Unknown option: ${option}`)
    }
    if (!value || value.startsWith('--')) {
      throw new Error(`${option} requires a value`)
    }

    values.set(option, value)
  }

  const scenario = values.get('--scenario')
  if (!scenario) {
    throw new Error('--scenario is required')
  }

  const label = sanitizeLabel(values.get('--label') ?? DEFAULT_LABEL)

  return {
    baseURL: values.get('--base-url') ?? DEFAULT_BASE_URL,
    interactionPauseMs: parseTiming({
      name: '--interaction-pause-ms',
      value: values.get('--interaction-pause-ms') ?? DEFAULT_INTERACTION_PAUSE_MS,
    }),
    label,
    mouseMoveMs: parseTiming({
      name: '--mouse-move-ms',
      value: values.get('--mouse-move-ms') ?? DEFAULT_MOUSE_MOVE_MS,
    }),
    output: values.get('--output') ?? `/tmp/payload-pr-demo-${label}.webm`,
    scenario,
    viewport: parseViewport(values.get('--viewport') ?? '1440x900'),
  }
}

function parseTiming({ name, value }) {
  const milliseconds = Number(value)

  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new Error(`${name} must be a non-negative number`)
  }

  return milliseconds
}

export function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/.exec(value)
  if (!match) {
    throw new Error('Viewport must use WIDTHxHEIGHT, for example 1440x900')
  }

  const width = Number(match[1])
  const height = Number(match[2])

  if (width < 640 || height < 480) {
    throw new Error('Viewport must be at least 640x480')
  }

  return { height, width }
}

export function sanitizeLabel(value) {
  const label = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!label) {
    throw new Error('Label must contain at least one letter or number')
  }

  return label
}

export async function recordDemo({
  baseURL,
  fixture,
  interactionPauseMs = DEFAULT_INTERACTION_PAUSE_MS,
  label,
  mouseMoveMs = DEFAULT_MOUSE_MOVE_MS,
  output,
  scenario,
  viewport,
}) {
  return executeDemo({
    baseURL,
    fixture,
    interactionPauseMs,
    label,
    mouseMoveMs,
    output,
    pauseScale: 1,
    scenario,
    trailingPauseMs: 900,
    viewport,
  })
}

export async function validateDemo({ baseURL, fixture, label, scenario, viewport }) {
  await executeDemo({
    baseURL,
    fixture,
    interactionPauseMs: 0,
    label,
    mouseMoveMs: 0,
    pauseScale: 0,
    scenario,
    trailingPauseMs: 0,
    viewport,
  })
}

export async function previewDemo({ baseURL, fixture, label, output, scenario, viewport }) {
  return executeDemo({
    baseURL,
    fixture,
    interactionPauseMs: 0,
    label,
    mouseMoveMs: 0,
    pauseScale: 0,
    scenario,
    screenshotOutput: output,
    trailingPauseMs: 0,
    viewport,
  })
}

async function executeDemo({
  baseURL,
  fixture,
  interactionPauseMs,
  label,
  mouseMoveMs,
  output,
  pauseScale,
  scenario,
  screenshotOutput,
  trailingPauseMs,
  viewport,
}) {
  const parsedBaseURL = new URL(baseURL)
  const scenarioURL = pathToFileURL(path.resolve(scenario)).href
  const scenarioModule = await import(scenarioURL)

  if (typeof scenarioModule.default !== 'function') {
    throw new Error(`Scenario must default-export a function: ${scenario}`)
  }

  const { chromium, expect } = await import('@playwright/test')
  const rawVideoDirectory = await mkdtemp(path.join(tmpdir(), 'payload-pr-demo-'))
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext(
    output
      ? {
          recordVideo: { dir: rawVideoDirectory, size: viewport },
          viewport,
        }
      : { viewport },
  )

  await context.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const cursor = document.createElement('div')
      cursor.setAttribute('data-pr-demo-cursor', 'mac-arrow')
      cursor.innerHTML = `<svg aria-hidden="true" height="23" viewBox="0 0 28 36" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2.2V27l6.7-6.4 5.1 12.7 5-2-5.2-12.2H23L2 2.2Z" fill="#111827" stroke="#fff" stroke-linejoin="round" stroke-width="2.2" />
      </svg>`
      Object.assign(cursor.style, {
        filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 65%))',
        height: '23px',
        insetBlockStart: '0',
        insetInlineStart: '0',
        opacity: '0',
        pointerEvents: 'none',
        position: 'fixed',
        transform: 'translate(0, 0)',
        transition: 'opacity 120ms ease',
        width: '18px',
        zIndex: '2147483647',
      })
      const cursorGraphic = cursor.querySelector('svg')
      Object.assign(cursorGraphic.style, {
        transformOrigin: '2px 2px',
        transition: 'transform 100ms ease',
      })
      document.documentElement.append(cursor)

      document.addEventListener(
        'mousemove',
        (event) => {
          cursor.style.opacity = '1'
          cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
        },
        { passive: true },
      )
      document.addEventListener('mousedown', () => {
        cursorGraphic.style.transform = 'scale(0.82)'
      })
      document.addEventListener('mouseup', () => {
        cursorGraphic.style.transform = 'scale(1)'
      })
    })
  })

  const page = await context.newPage()
  const video = output ? page.video() : undefined
  const resolvedOutput = output ? path.resolve(output) : undefined
  const resolvedScreenshotOutput = screenshotOutput ? path.resolve(screenshotOutput) : undefined
  const pointerInteractions = createPointerInteractions({
    interactionPauseMs,
    mouseMoveMs,
    page,
  })
  let scenarioError

  try {
    await scenarioModule.default({
      baseURL: parsedBaseURL.toString().replace(/\/$/, ''),
      click: pointerInteractions.click,
      expect,
      fixture,
      label,
      moveCursor: pointerInteractions.moveCursor,
      page,
      pause: (milliseconds = 700) => page.waitForTimeout(milliseconds * pauseScale),
    })
    if (trailingPauseMs > 0) {
      await page.waitForTimeout(trailingPauseMs)
    }
    if (resolvedScreenshotOutput) {
      await mkdir(path.dirname(resolvedScreenshotOutput), { recursive: true })
      await page.screenshot({ path: resolvedScreenshotOutput })
    }
  } catch (error) {
    scenarioError = error
  } finally {
    try {
      if (video && resolvedOutput) {
        await mkdir(path.dirname(resolvedOutput), { recursive: true })
        const saveVideo = video.saveAs(resolvedOutput)

        await context.close()
        await saveVideo
      } else {
        await context.close()
      }
    } finally {
      await browser.close()
      await rm(rawVideoDirectory, { force: true, recursive: true })
    }
  }

  if (scenarioError) {
    throw scenarioError
  }

  return resolvedOutput ?? resolvedScreenshotOutput
}

function createPointerInteractions({ interactionPauseMs, mouseMoveMs, page }) {
  let pointerPosition = { x: 0, y: 0 }

  const moveCursor = async (
    locator,
    { duration = mouseMoveMs, pauseAfter = interactionPauseMs, position } = {},
  ) => {
    await locator.scrollIntoViewIfNeeded()

    const box = await locator.boundingBox()
    if (!box) {
      throw new Error('Cannot move the demo cursor to an element without a bounding box')
    }

    const relativePosition = position ?? { x: box.width / 2, y: box.height / 2 }
    const targetPosition = {
      x: box.x + relativePosition.x,
      y: box.y + relativePosition.y,
    }
    const steps = duration === 0 ? 1 : Math.max(2, Math.round(duration / 16))
    const stepDelay = steps === 1 ? 0 : duration / steps

    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps
      const easedProgress =
        progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2

      await page.mouse.move(
        pointerPosition.x + (targetPosition.x - pointerPosition.x) * easedProgress,
        pointerPosition.y + (targetPosition.y - pointerPosition.y) * easedProgress,
      )

      if (step < steps && stepDelay > 0) {
        await page.waitForTimeout(stepDelay)
      }
    }

    pointerPosition = targetPosition

    if (pauseAfter > 0) {
      await page.waitForTimeout(pauseAfter)
    }
  }

  const click = async (
    locator,
    {
      after = interactionPauseMs,
      before = interactionPauseMs,
      duration = mouseMoveMs,
      position,
    } = {},
  ) => {
    await moveCursor(locator, { duration, pauseAfter: before, position })
    await locator.click(position ? { position } : undefined)

    if (after > 0) {
      await page.waitForTimeout(after)
    }
  }

  return { click, moveCursor }
}

function printHelp() {
  console.log(`Usage: record-demo.mjs --scenario PATH [options]

Options:
  --base-url URL       Running Payload URL (default: ${DEFAULT_BASE_URL})
  --interaction-pause-ms MS
                       Dwell before and after clicks (default: ${DEFAULT_INTERACTION_PAUSE_MS})
  --label TEXT         Safe output label (default: ${DEFAULT_LABEL})
  --mouse-move-ms MS   Smooth cursor travel time (default: ${DEFAULT_MOUSE_MOVE_MS})
  --output PATH        WebM output (default: /tmp/payload-pr-demo-<label>.webm)
  --viewport WxH       Recording viewport (default: 1440x900)
  --scenario PATH      Scenario module with a default-exported async function
  --help               Show this help`)
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isMain) {
  if (process.argv.includes('--help')) {
    printHelp()
  } else {
    try {
      const output = await recordDemo(parseArgs(process.argv.slice(2)))
      console.log(output)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  }
}
