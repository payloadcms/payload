#!/usr/bin/env node

import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getDefaultCanvas } from './WindowChrome/index.mjs'

import { createAnnotationInteraction } from './annotation-demo.mjs'
import { createPresentation } from './presentation-demo.mjs'
import { createScrollInteraction } from './scroll-demo.mjs'

const DEFAULT_BASE_URL = 'http://localhost:3000'
const DEFAULT_INTERACTION_PAUSE_MS = 300
const DEFAULT_LABEL = 'feature-demo'
const DEFAULT_MOUSE_MOVE_MS = 300
const DEFAULT_VIEWPORT = { height: 900, width: 1440 }

export function parseArgs(argv) {
  const values = new Map()
  const supportedOptions = new Set([
    '--a11y',
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

  const a11y = values.get('--a11y')
  if (a11y !== undefined && !['on', 'off'].includes(a11y)) {
    throw new Error('--a11y must be on or off')
  }

  const label = sanitizeLabel(values.get('--label') ?? DEFAULT_LABEL)

  return {
    ...(a11y === undefined ? {} : { a11y }),
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
  a11y,
  baseURL,
  fixture,
  interactionPauseMs = DEFAULT_INTERACTION_PAUSE_MS,
  label,
  mouseMoveMs = DEFAULT_MOUSE_MOVE_MS,
  onOpeningReady,
  output,
  scenario,
  viewport,
}) {
  return executeDemo({
    a11y,
    baseURL,
    fixture,
    interactionPauseMs,
    label,
    mouseMoveMs,
    onOpeningReady,
    output,
    pauseScale: 1,
    scenario,
    trailingPauseMs: 900,
    viewport,
  })
}

export async function validateDemo({ a11y, baseURL, fixture, label, scenario, viewport }) {
  await executeDemo({
    a11y,
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

export async function previewDemo({ a11y, baseURL, fixture, label, output, scenario, viewport }) {
  return executeDemo({
    a11y,
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
  a11y,
  baseURL,
  fixture,
  interactionPauseMs,
  label,
  mouseMoveMs,
  onOpeningReady,
  output,
  pauseScale,
  scenario,
  screenshotOutput,
  trailingPauseMs,
  viewport,
}) {
  if (a11y !== undefined && !['on', 'off'].includes(a11y)) {
    throw new Error('--a11y must be on or off')
  }
  const parsedBaseURL = new URL(baseURL)
  const scenarioURL = pathToFileURL(path.resolve(scenario)).href
  const scenarioModule = await import(scenarioURL)

  if (typeof scenarioModule.default !== 'function') {
    throw new Error(`Scenario must default-export a function: ${scenario}`)
  }

  const change = scenarioModule.presentation?.change

  if (
    !['Feature', 'Fix'].includes(change?.kind) ||
    typeof change.title !== 'string' ||
    !change.title.trim() ||
    typeof change.description !== 'string' ||
    !change.description.trim()
  ) {
    throw new Error(
      'Every scenario must export presentation with a change kind, title, and description; recording chrome cannot be disabled',
    )
  }

  const { chromium, expect } = await import('@playwright/test')
  const rawVideoDirectory = await mkdtemp(path.join(tmpdir(), 'payload-pr-demo-'))
  const browser = await chromium.launch({ headless: true })
  const presentationOptions = {
    ...scenarioModule.presentation,
    ...(a11y === undefined
      ? {}
      : { accessibility: a11y === 'on', showAnnouncements: a11y === 'on' }),
  }
  const recordedViewport =
    presentationOptions.canvas ??
    getDefaultCanvas({
      viewport,
      accessibility: presentationOptions.accessibility,
    })
  const context = await browser.newContext({
    viewport: recordedViewport,
    colorScheme: scenarioModule.presentation.theme ?? 'light',
    ...(output ? { recordVideo: { dir: rawVideoDirectory, size: recordedViewport } } : {}),
  })

  await context.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      if (document.documentElement.hasAttribute('data-pr-demo-stage')) return
      const cursor = document.createElement('div')
      cursor.setAttribute('data-pr-demo-cursor', 'mac-arrow')
      cursor.setAttribute('aria-hidden', 'true')
      cursor.setAttribute('popover', 'manual')
      cursor.innerHTML = `<svg aria-hidden="true" height="23" viewBox="0 0 28 36" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2.2V27l6.7-6.4 5.1 12.7 5-2-5.2-12.2H23L2 2.2Z" fill="#111827" stroke="#fff" stroke-linejoin="round" stroke-width="2.2" />
      </svg>`
      Object.assign(cursor.style, {
        background: 'transparent',
        border: '0',
        height: '23px',
        insetBlockStart: '0',
        insetInlineStart: '0',
        margin: '0',
        opacity: '0',
        overflow: 'visible',
        padding: '0',
        pointerEvents: 'none',
        position: 'fixed',
        transform: 'translate(0, 0)',
        transition: 'opacity 120ms ease',
        width: '18px',
        zIndex: '2147483647',
      })
      const cursorGraphic = cursor.querySelector('svg')
      Object.assign(cursorGraphic.style, {
        filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 65%))',
        transformOrigin: '2px 2px',
        transition: 'transform 100ms ease',
      })
      document.documentElement.append(cursor)
      cursor.showPopover()

      const promoteCursor = () => {
        if (cursor.matches(':popover-open')) cursor.hidePopover()
        cursor.showPopover()
      }

      document.addEventListener(
        'toggle',
        (event) => {
          if (event.target !== cursor && event.newState === 'open') promoteCursor()
        },
        true,
      )
      new MutationObserver((records) => {
        if (records.some(({ target }) => target instanceof HTMLDialogElement && target.open)) {
          promoteCursor()
        }
      }).observe(document.documentElement, {
        attributeFilter: ['open'],
        attributes: true,
        subtree: true,
      })

      let pointer = { x: 0, y: 0 }
      let clickPulse
      let clickPoint
      let clickAnimation
      const positionClickPulse = () => {
        if (!clickPulse) return
        clickPulse.style.left = `${clickPoint.x - pointer.x}px`
        clickPulse.style.top = `${clickPoint.y - pointer.y}px`
      }
      const positionCursor = ({ clientX, clientY }) => {
        pointer = { x: clientX, y: clientY }
        promoteCursor()
        cursor.style.opacity = '1'
        cursor.style.transform = `translate(${clientX}px, ${clientY}px)`
        positionClickPulse()
      }
      document.addEventListener('mousemove', positionCursor, { passive: true })
      document.addEventListener(
        'mousedown',
        (event) => {
          positionCursor(event)
          cursorGraphic.style.transform = 'scale(0.82)'
          clickAnimation?.cancel()
          clickPulse?.remove()
          const pulse = document.createElement('span')
          pulse.setAttribute('data-pr-demo-click', '')
          pulse.setAttribute('aria-hidden', 'true')
          Object.assign(pulse.style, {
            position: 'absolute',
            width: '28px',
            height: '28px',
            boxSizing: 'border-box',
            border: '2px solid var(--color-bg-brand, #0d99ff)',
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-bg-brand, #0d99ff) 12%, transparent)',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: '-1',
          })
          clickPulse = pulse
          clickPoint = { ...pointer }
          cursor.prepend(pulse)
          positionClickPulse()
          const isReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
          const animation = pulse.animate(
            isReducedMotion
              ? [{ opacity: 0.9 }, { opacity: 0.9, offset: 0.7 }, { opacity: 0 }]
              : [
                  {
                    opacity: 0.9,
                    transform: 'translate(-50%, -50%) scale(0.55)',
                  },
                  { opacity: 0.55, offset: 0.5 },
                  { opacity: 0, transform: 'translate(-50%, -50%) scale(1.4)' },
                ],
            { duration: 420, easing: 'ease-out' },
          )
          clickAnimation = animation
          animation.onfinish = () => {
            pulse.remove()
            if (clickPulse === pulse) {
              clickPulse = undefined
              clickAnimation = undefined
            }
          }
        },
        true,
      )
      document.addEventListener(
        'mouseup',
        () => {
          cursorGraphic.style.transform = 'scale(1)'
        },
        true,
      )
    })
  })

  // Video capture can start before newPage() resolves. Include page creation in the trim clock.
  const recordingStartedAt = performance.now()
  const recordedPage = await context.newPage()
  const video = output ? recordedPage.video() : undefined
  let presentation
  const resolvedOutput = output ? path.resolve(output) : undefined
  const resolvedScreenshotOutput = screenshotOutput ? path.resolve(screenshotOutput) : undefined
  let isOpeningReady = false
  let scenarioError

  try {
    presentation = await createPresentation({
      page: recordedPage,
      options: presentationOptions,
      viewport,
      baseURL,
      pauseScale,
      startedAt: recordingStartedAt,
    })
    const page = presentation.appPage
    const pointerInteractions = createPointerInteractions({
      interactionPauseMs,
      mouseMoveMs,
      page,
    })
    const annotationInteractions = createAnnotationInteraction({
      presentation,
    })
    await scenarioModule.default({
      clearAnnotation: annotationInteractions.hideAnnotation,
      resizeWindow: presentation.resizeWindow,
      setAnnotation: (annotation) =>
        annotation === null
          ? annotationInteractions.hideAnnotation()
          : annotationInteractions.showAnnotation(annotation),
      baseURL: parsedBaseURL.toString().replace(/\/$/, ''),
      click: pointerInteractions.click,
      typeText: async ({ locator, text, clear = false, delay = 80 }) => {
        await pointerInteractions.click(locator)
        if (clear) await page.keyboard.press('ControlOrMeta+A')
        await page.keyboard.type(text, { delay })
      },
      expect,
      fixture,
      hideAnnotation: annotationInteractions.hideAnnotation,
      label,
      moveCursor: pointerInteractions.moveCursor,
      page,
      pause: (milliseconds = 700) => page.waitForTimeout(milliseconds * pauseScale),
      ready: async () => {
        if (isOpeningReady) throw new Error('Scenario may call ready() only once')
        annotationInteractions.markReady()
        isOpeningReady = true
        await presentation.flush()
        onOpeningReady?.((performance.now() - presentation.startedAt) / 1000)
        await page.waitForTimeout(1200 * pauseScale)
      },
      scroll: createScrollInteraction({
        moveCursor: pointerInteractions.moveCursor,
        page: recordedPage,
      }),
      showAnnotation: annotationInteractions.showAnnotation,
    })
    if (output && !isOpeningReady) {
      throw new Error('Recording scenario must call ready() after its opening state is visible')
    }
    if (trailingPauseMs > 0) {
      await page.waitForTimeout(trailingPauseMs)
    }
    await presentation.flush()
    if (resolvedScreenshotOutput) {
      await mkdir(path.dirname(resolvedScreenshotOutput), { recursive: true })
      await recordedPage.screenshot({ path: resolvedScreenshotOutput })
    }
  } catch (error) {
    scenarioError = error
  } finally {
    try {
      await presentation?.stop()
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

  const getTargetPoint = async ({ locator, position, pagePoint }) => {
    await locator.waitFor({ state: 'visible' })
    const box = await locator.boundingBox()
    if (!box) throw new Error('Cannot move the demo cursor to an element without a bounding box')
    const local = await locator.evaluate(
      (element, { position, pagePoint, box }) => {
        const rect = element.getBoundingClientRect()
        // The document remains the wheel surface after its border box scrolls away.
        const isDocumentScroller = element === document.scrollingElement
        let left = isDocumentScroller ? 0 : Math.max(0, rect.left)
        let top = isDocumentScroller ? 0 : Math.max(0, rect.top)
        let right = isDocumentScroller ? innerWidth : Math.min(innerWidth, rect.right)
        let bottom = isDocumentScroller ? innerHeight : Math.min(innerHeight, rect.bottom)
        const rootStyle = getComputedStyle(document.documentElement)
        for (
          let parent = isDocumentScroller ? null : element.parentElement;
          parent;
          parent = parent.parentElement
        ) {
          // Root overflow, and body overflow propagated from a visible root, clip at the viewport.
          const isViewportOverflow =
            parent === document.documentElement ||
            (parent === document.body &&
              document.scrollingElement === document.documentElement &&
              rootStyle.overflowX === 'visible' &&
              rootStyle.overflowY === 'visible')
          if (isViewportOverflow) continue
          const style = getComputedStyle(parent)
          const clip = parent.getBoundingClientRect()
          if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
            left = Math.max(left, clip.left)
            right = Math.min(right, clip.right)
          }
          if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
            top = Math.max(top, clip.top)
            bottom = Math.min(bottom, clip.bottom)
          }
        }
        const points = pagePoint
          ? [
              {
                x: rect.left + ((pagePoint.x - box.x) * rect.width) / box.width,
                y: rect.top + ((pagePoint.y - box.y) * rect.height) / box.height,
              },
            ]
          : position
            ? [
                {
                  x: rect.left + element.clientLeft + position.x,
                  y: rect.top + element.clientTop + position.y,
                },
              ]
            : [
                { x: (left + right) / 2, y: (top + bottom) / 2 },
                ...[0.1, 0.5, 0.9].flatMap((x) =>
                  [0.1, 0.5, 0.9].map((y) => ({
                    x: left + (right - left) * x,
                    y: top + (bottom - top) * y,
                  })),
                ),
              ]
        const point = points.find(({ x, y }) => {
          if (right <= left || bottom <= top || x < left || x >= right || y < top || y >= bottom)
            return false
          const hit = document.elementFromPoint(x, y)
          return hit && element.contains(hit)
        })
        if (!point) {
          throw new Error(
            'Demo target must be visible and unobstructed; reveal it with wheel scrolling before clicking',
          )
        }
        const { x, y } = point
        return {
          x: x - rect.left,
          y: y - rect.top,
          width: rect.width,
          height: rect.height,
        }
      },
      { position, pagePoint, box },
    )
    return {
      x: box.x + local.x * (box.width / local.width),
      y: box.y + local.y * (box.height / local.height),
    }
  }

  const moveCursor = async (
    locator,
    { duration = mouseMoveMs, pauseAfter = interactionPauseMs, position } = {},
  ) => {
    const targetPosition = await getTargetPoint({ locator, position })
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
    const target = await locator.elementHandle()
    if (!target) throw new Error('Demo click target is unavailable')

    try {
      await target.waitForElementState('enabled', { timeout: 10_000 })
      await target.waitForElementState('stable', { timeout: 10_000 })
      await moveCursor(locator, { duration, pauseAfter: before, position })
      await target.waitForElementState('enabled', { timeout: 10_000 })
      await target.waitForElementState('stable', { timeout: 10_000 })
      await getTargetPoint({ locator, pagePoint: pointerPosition })
      // Use the same outer-page point for the visible cursor and the actual click.
      await page.mouse.click(pointerPosition.x, pointerPosition.y)
    } finally {
      await target.dispose()
    }

    if (after > 0) {
      await page.waitForTimeout(after)
    }
  }

  return { click, moveCursor }
}

function printHelp() {
  console.log(`Usage: record-demo.mjs --scenario PATH [options]

Options:
  --a11y on|off        Override a11y feedback; omit to use the scenario setting
  --base-url URL       Running Payload URL (default: ${DEFAULT_BASE_URL})
  --interaction-pause-ms MS
                       Dwell before and after clicks (default: ${DEFAULT_INTERACTION_PAUSE_MS})
  --label TEXT         Safe output label (default: ${DEFAULT_LABEL})
  --mouse-move-ms MS   Smooth cursor travel time (default: ${DEFAULT_MOUSE_MOVE_MS})
  --output PATH        WebM output (default: /tmp/payload-pr-demo-<label>.webm)
  --viewport WxH       Initial application viewport inside chrome (default: 1440x900)
  --scenario PATH      Module exporting presentation metadata and a default async function
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
