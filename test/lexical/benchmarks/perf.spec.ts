import type { BrowserContext, Page } from '@playwright/test'

import { test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../__helpers/shared/sdk/index.js'
import type { Config } from '../payload-types.js'

import { ensureCompilationIsDone } from '../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../playwright.config.js'
import { LexicalHelpers } from '../collections/utils.js'
import { lexicalBenchmarkSlug } from '../slugs.js'

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

describe('Lexical Performance Benchmarks', () => {
  let lexical: LexicalHelpers
  let url: AdminUrlUtil

  test.describe.configure({ timeout: 300_000 })

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, lexicalBenchmarkSlug)
    await ensureCompilationIsDone({ serverURL, browser })
  })

  beforeEach(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    lexical = new LexicalHelpers(page)
  })

  test('CPU throttled typing - empty editor (6x slowdown)', async () => {
    const text = 'Typing under CPU throttling to simulate slower devices and real world conditions'
    const allMetrics: IterationMetrics[] = []

    for (let i = 0; i < ITERATIONS; i++) {
      await page.goto(url.create)
      await page.waitForSelector('[data-lexical-editor="true"]', { timeout: 30000 })
      await lexical.editor.first().focus()
      await page.waitForTimeout(500)

      const cdpSession = await context.newCDPSession(page)
      await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 6 })

      await setupPerfInstrumentation(page)
      await page.keyboard.type(text, { delay: 50 })
      await page.waitForTimeout(2000)
      allMetrics.push(extractMetrics(await collectPerfResults(page)))

      await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 1 })
      await cdpSession.detach()
    }

    printSummary('CPU Throttled (6x) — Empty Editor', allMetrics)
  })

  test('CPU throttled typing - with 30 blocks (6x slowdown)', async () => {
    const text = 'Typing under CPU throttling with blocks in the editor to stress toolbar updates'
    const allMetrics: IterationMetrics[] = []

    const docs = await payload.find({
      collection: lexicalBenchmarkSlug,
      limit: 1,
    })

    const docId = docs.docs[0]?.id
    if (!docId) {
      throw new Error('No seeded benchmark document found. Run seed first.')
    }

    const editURL = url.edit(docId)

    for (let i = 0; i < ITERATIONS; i++) {
      await page.goto(editURL)
      await page.waitForSelector('[data-lexical-editor="true"]', { timeout: 30000 })

      // Wait for blocks to render, then click the trailing paragraph
      await page.waitForTimeout(2000)
      const lastParagraph = lexical.editor.first().locator('p').last()
      await lastParagraph.click()
      await page.waitForTimeout(500)

      const cdpSession = await context.newCDPSession(page)
      await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 6 })

      await setupPerfInstrumentation(page)
      await page.keyboard.type(text, { delay: 50 })
      await page.waitForTimeout(2000)
      allMetrics.push(extractMetrics(await collectPerfResults(page)))

      await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 1 })
      await cdpSession.detach()
    }

    printSummary('CPU Throttled (6x) — With 30 Blocks', allMetrics)
  })
})
