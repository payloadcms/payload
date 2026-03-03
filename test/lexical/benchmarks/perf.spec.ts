import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../__helpers/shared/sdk/index.js'
import type { Config } from '../payload-types.js'

import { ensureCompilationIsDone } from '../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../playwright.config.js'
import { LexicalHelpers } from '../collections/utils.js'
import { lexicalFullyFeaturedSlug } from '../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../')

const { beforeAll, beforeEach, describe } = test

const ITERATIONS = 5

let payload: PayloadTestSDK<Config>
let serverURL: string
let page: Page
let context: BrowserContext

interface PerfResults {
  domMutationCount: number
  inputLag: { charIndex: number; lagMs: number }[]
  longTaskCount: number
  longTaskTotalMs: number
  selectionLagEntries?: { index: number; lagMs: number }[]
}

interface IterationMetrics {
  avgLag: number
  domMutationsPerKey: number
  longTaskCount: number
  longTaskTotalMs: number
  p95Lag: number
}

async function setupPerfInstrumentation(page: Page): Promise<void> {
  await page.evaluate(() => {
    const contentEditable = document.querySelector('[contenteditable="true"]')
    if (!contentEditable) {
      throw new Error('Could not find contentEditable element')
    }

    const perfData = {
      inputLag: [] as { charIndex: number; lagMs: number }[],
      domMutationCount: 0,
      longTaskCount: 0,
      longTaskTotalMs: 0,
    }

    ;(window as any).__lexicalPerf = perfData

    let charIndex = 0

    contentEditable.addEventListener('beforeinput', () => {
      const startTime = performance.now()
      const currentCharIndex = charIndex++

      requestAnimationFrame(() => {
        perfData.inputLag.push({
          charIndex: currentCharIndex,
          lagMs: Math.round((performance.now() - startTime) * 100) / 100,
        })
      })
    })

    const observer = new MutationObserver((mutations) => {
      perfData.domMutationCount += mutations.length
    })

    observer.observe(contentEditable, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })

    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            perfData.longTaskCount++
            perfData.longTaskTotalMs += entry.duration
          }
        })
        longTaskObserver.observe({ type: 'longtask', buffered: false })
      } catch {
        // longtask not supported in all browsers
      }
    }
  })
}

async function setupSelectionInstrumentation(page: Page): Promise<void> {
  await page.evaluate(() => {
    const editorContainer = document.querySelector('.rich-text-lexical') as HTMLElement
    if (!editorContainer) {
      throw new Error('Could not find .rich-text-lexical container')
    }

    const perfData = {
      inputLag: [] as { charIndex: number; lagMs: number }[],
      domMutationCount: 0,
      longTaskCount: 0,
      longTaskTotalMs: 0,
      selectionLagEntries: [] as { index: number; lagMs: number }[],
    }

    ;(window as any).__lexicalPerf = perfData

    let selIndex = 0
    const contentEditable = document.querySelector('[contenteditable="true"]') as HTMLElement

    contentEditable?.addEventListener('keydown', () => {
      const startTime = performance.now()
      const currentIndex = selIndex++

      requestAnimationFrame(() => {
        perfData.selectionLagEntries.push({
          index: currentIndex,
          lagMs: Math.round((performance.now() - startTime) * 100) / 100,
        })
      })
    })

    const observer = new MutationObserver((mutations) => {
      perfData.domMutationCount += mutations.length
    })

    observer.observe(editorContainer, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })

    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            perfData.longTaskCount++
            perfData.longTaskTotalMs += entry.duration
          }
        })
        longTaskObserver.observe({ type: 'longtask', buffered: false })
      } catch {
        // longtask not supported
      }
    }
  })
}

async function collectPerfResults(page: Page): Promise<PerfResults> {
  return page.evaluate(() => (window as any).__lexicalPerf as PerfResults)
}

function extractMetrics(results: PerfResults): IterationMetrics {
  const lags = results.inputLag.map((e) => e.lagMs)
  const sorted = [...lags].sort((a, b) => a - b)
  const avgLag = lags.length > 0 ? lags.reduce((a, b) => a + b, 0) / lags.length : 0
  const p95Lag = lags.length > 0 ? (sorted[Math.floor(lags.length * 0.95)] ?? Math.max(...lags)) : 0

  return {
    avgLag,
    domMutationsPerKey: lags.length > 0 ? results.domMutationCount / lags.length : 0,
    longTaskCount: results.longTaskCount,
    longTaskTotalMs: results.longTaskTotalMs,
    p95Lag,
  }
}

function extractSelectionMetrics(results: PerfResults): IterationMetrics {
  const lags = (results.selectionLagEntries ?? []).map((e) => e.lagMs)
  const sorted = [...lags].sort((a, b) => a - b)
  const avgLag = lags.length > 0 ? lags.reduce((a, b) => a + b, 0) / lags.length : 0
  const p95Lag = lags.length > 0 ? (sorted[Math.floor(lags.length * 0.95)] ?? Math.max(...lags)) : 0

  return {
    avgLag,
    domMutationsPerKey: lags.length > 0 ? results.domMutationCount / lags.length : 0,
    longTaskCount: results.longTaskCount,
    longTaskTotalMs: results.longTaskTotalMs,
    p95Lag,
  }
}

function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

function stddev(values: number[]): number {
  if (values.length < 2) {
    return 0
  }
  const m = mean(values)
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1))
}

function pad(str: string, width: number): string {
  return str.padStart(width)
}

function printSummary(label: string, allMetrics: IterationMetrics[]): void {
  const cols = [
    { key: 'avgLag' as const, label: 'AvgLag', width: 8 },
    { key: 'p95Lag' as const, label: 'P95Lag', width: 8 },
    { key: 'domMutationsPerKey' as const, label: 'Mut/Key', width: 9 },
    { key: 'longTaskCount' as const, label: 'LongTasks', width: 10 },
    { key: 'longTaskTotalMs' as const, label: 'LongTaskMs', width: 11 },
  ]

  const header = pad('Iter', 6) + cols.map((c) => pad(c.label, c.width)).join('')
  const separator = '─'.repeat(header.length)

  const lines = [`\n=== ${label} (${allMetrics.length} iterations) ===`, `  ${header}`]

  for (let i = 0; i < allMetrics.length; i++) {
    const m = allMetrics[i]!
    const row = pad(String(i + 1), 6) + cols.map((c) => pad(m[c.key].toFixed(2), c.width)).join('')
    lines.push(`  ${row}`)
  }

  lines.push(`  ${separator}`)

  const stats: Record<string, (vals: number[]) => number> = {
    Mean: mean,
    StdDev: stddev,
    Min: (v) => Math.min(...v),
    Max: (v) => Math.max(...v),
  }

  for (const [statLabel, fn] of Object.entries(stats)) {
    const row =
      pad(statLabel, 6) +
      cols
        .map((c) => {
          const values = allMetrics.map((m) => m[c.key])
          return pad(fn(values).toFixed(2), c.width)
        })
        .join('')
    lines.push(`  ${row}`)
  }

  console.log(lines.join('\n'))
}

async function navigateAndFocusEditor(
  page: Page,
  lexical: LexicalHelpers,
  serverURL: string,
): Promise<void> {
  const url = new AdminUrlUtil(serverURL, lexicalFullyFeaturedSlug)
  await page.goto(url.create)
  await page.waitForSelector('[data-lexical-editor="true"]', { timeout: 30000 })
  await lexical.editor.first().focus()
  await page.waitForTimeout(500)
}

describe('Lexical Performance Benchmarks', () => {
  let lexical: LexicalHelpers

  // 5 minutes per test — each test runs ITERATIONS iterations with full page navigations
  test.describe.configure({ timeout: 300_000 })

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    await ensureCompilationIsDone({ serverURL, browser })
  })

  beforeEach(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    lexical = new LexicalHelpers(page)
  })

  test('empty editor typing', async () => {
    const text =
      'The quick brown fox jumps over the lazy dog and keeps on running through the fields'
    const allMetrics: IterationMetrics[] = []

    for (let i = 0; i < ITERATIONS; i++) {
      await navigateAndFocusEditor(page, lexical, serverURL)
      await setupPerfInstrumentation(page)
      await page.keyboard.type(text, { delay: 30 })
      await page.waitForTimeout(1000)
      allMetrics.push(extractMetrics(await collectPerfResults(page)))
    }

    printSummary('Empty Editor Typing', allMetrics)
  })

  test('editor with blocks typing', async () => {
    const text =
      'The quick brown fox jumps over the lazy dog and keeps on running through the fields'
    const allMetrics: IterationMetrics[] = []

    for (let i = 0; i < ITERATIONS; i++) {
      await navigateAndFocusEditor(page, lexical, serverURL)

      await lexical.slashCommand('myblock')
      await expect(lexical.editor.locator('.LexicalEditorTheme__block')).toBeVisible()
      await page.keyboard.press('Enter')
      await page.keyboard.type('Some existing paragraph text.', { delay: 10 })
      await page.keyboard.press('Enter')

      await lexical.slashCommand('myblock')
      await expect(lexical.editor.locator('.LexicalEditorTheme__block')).toHaveCount(2)
      await page.keyboard.press('Enter')
      await page.keyboard.type('Another paragraph of content.', { delay: 10 })
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')

      await page.waitForTimeout(1000)
      await setupPerfInstrumentation(page)
      await page.keyboard.type(text, { delay: 30 })
      await page.waitForTimeout(1000)
      allMetrics.push(extractMetrics(await collectPerfResults(page)))
    }

    printSummary('Editor With Blocks', allMetrics)
  })

  test('rapid typing (burst)', async () => {
    const text =
      'Rapid typing test to measure performance under pressure when user types very quickly'
    const allMetrics: IterationMetrics[] = []

    for (let i = 0; i < ITERATIONS; i++) {
      await navigateAndFocusEditor(page, lexical, serverURL)
      await setupPerfInstrumentation(page)
      await page.keyboard.type(text, { delay: 0 })
      await page.waitForTimeout(1000)
      allMetrics.push(extractMetrics(await collectPerfResults(page)))
    }

    printSummary('Rapid Typing (burst)', allMetrics)
  })

  test('CPU throttled typing (6x slowdown)', async () => {
    const text = 'Typing under CPU throttling to simulate slower devices and real world conditions'
    const allMetrics: IterationMetrics[] = []

    for (let i = 0; i < ITERATIONS; i++) {
      await navigateAndFocusEditor(page, lexical, serverURL)

      const cdpSession = await context.newCDPSession(page)
      await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 6 })

      await setupPerfInstrumentation(page)
      await page.keyboard.type(text, { delay: 50 })
      await page.waitForTimeout(2000)
      allMetrics.push(extractMetrics(await collectPerfResults(page)))

      await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 1 })
      await cdpSession.detach()
    }

    printSummary('CPU Throttled (6x)', allMetrics)
  })

  test('selection change (Shift+Arrow)', async () => {
    const allMetrics: IterationMetrics[] = []

    for (let i = 0; i < ITERATIONS; i++) {
      await navigateAndFocusEditor(page, lexical, serverURL)
      await page.keyboard.type('Hello world this is a test of selection performance', {
        delay: 10,
      })
      await page.waitForTimeout(500)

      await setupSelectionInstrumentation(page)

      await page.keyboard.press('Home')
      for (let j = 0; j < 50; j++) {
        await page.keyboard.press('Shift+ArrowRight')
      }
      await page.waitForTimeout(1000)

      allMetrics.push(extractSelectionMetrics(await collectPerfResults(page)))
    }

    printSummary('Selection Change (50 Shift+Arrow)', allMetrics)
  })
})
