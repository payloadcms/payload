import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../../../payload-types.js'

import { ensureCompilationIsDone } from '../../../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../../../playwright.config.js'
import { lexicalFullyFeaturedSlug } from '../../../../slugs.js'
import { LexicalHelpers } from '../../../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let serverURL: string
let page: Page
let context: BrowserContext

interface InputLagEntry {
  charIndex: number
  lagMs: number
}

interface PerfResults {
  domMutationCount: number
  inputLag: InputLagEntry[]
  longTaskCount: number
  longTaskTotalMs: number
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
        const endTime = performance.now()
        perfData.inputLag.push({
          charIndex: currentCharIndex,
          lagMs: Math.round((endTime - startTime) * 100) / 100,
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

function formatResults(label: string, results: PerfResults): string {
  const lags = results.inputLag.map((e) => e.lagMs)
  const avgLag = lags.length > 0 ? lags.reduce((a, b) => a + b, 0) / lags.length : 0
  const maxLag = lags.length > 0 ? Math.max(...lags) : 0
  const minLag = lags.length > 0 ? Math.min(...lags) : 0
  const p95Lag =
    lags.length > 0 ? (lags.sort((a, b) => a - b)[Math.floor(lags.length * 0.95)] ?? maxLag) : 0

  return [
    `\n=== ${label} ===`,
    `  Keystrokes measured: ${lags.length}`,
    `  Input lag (ms):`,
    `    avg: ${avgLag.toFixed(2)}`,
    `    min: ${minLag.toFixed(2)}`,
    `    max: ${maxLag.toFixed(2)}`,
    `    p95: ${p95Lag.toFixed(2)}`,
    `  DOM mutations: ${results.domMutationCount}`,
    `  DOM mutations per keystroke: ${lags.length > 0 ? (results.domMutationCount / lags.length).toFixed(2) : 'N/A'}`,
    `  Long tasks (>50ms): ${results.longTaskCount}`,
    `  Long task total time (ms): ${results.longTaskTotalMs.toFixed(2)}`,
  ].join('\n')
}

async function navigateAndFocusEditor(page: Page, lexical: LexicalHelpers, serverURL: string) {
  const url = new AdminUrlUtil(serverURL, lexicalFullyFeaturedSlug)
  await page.goto(url.create)
  // Wait for editor to be ready with a generous timeout (SSR hydration + lazy load)
  await page.waitForSelector('[data-lexical-editor="true"]', { timeout: 30000 })
  await lexical.editor.first().focus()
  // Small delay for focus events to settle
  await page.waitForTimeout(500)
}

describe('Lexical Performance', () => {
  let lexical: LexicalHelpers

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

  test('measure typing performance in empty editor', async () => {
    await navigateAndFocusEditor(page, lexical, serverURL)
    await setupPerfInstrumentation(page)

    const text =
      'The quick brown fox jumps over the lazy dog and keeps on running through the fields'
    await page.keyboard.type(text, { delay: 30 })

    await page.waitForTimeout(1000)

    const results = await collectPerfResults(page)
    const output = formatResults('Empty Editor Typing', results)
    console.log(output)

    const lags = results.inputLag.map((e) => e.lagMs)
    const avgLag = lags.reduce((a, b) => a + b, 0) / lags.length

    expect(lags.length).toBeGreaterThan(0)
    expect(avgLag).toBeLessThan(500)
  })

  test('measure typing performance with existing content (blocks)', async () => {
    await navigateAndFocusEditor(page, lexical, serverURL)

    // Add blocks to simulate a real document
    await lexical.slashCommand('myblock')
    await expect(lexical.editor.locator('.LexicalEditorTheme__block')).toBeVisible()

    await page.keyboard.press('Enter')
    await page.keyboard.type('Some existing paragraph text here.', { delay: 10 })
    await page.keyboard.press('Enter')

    await lexical.slashCommand('myblock')
    await expect(lexical.editor.locator('.LexicalEditorTheme__block')).toHaveCount(2)

    await page.keyboard.press('Enter')
    await page.keyboard.type('Another paragraph of content.', { delay: 10 })
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')

    await page.waitForTimeout(1000)

    await setupPerfInstrumentation(page)

    const text =
      'The quick brown fox jumps over the lazy dog and keeps on running through the fields'
    await page.keyboard.type(text, { delay: 30 })

    await page.waitForTimeout(1000)

    const results = await collectPerfResults(page)
    const output = formatResults('Editor With Blocks - Typing', results)
    console.log(output)

    const lags = results.inputLag.map((e) => e.lagMs)
    const avgLag = lags.reduce((a, b) => a + b, 0) / lags.length

    expect(lags.length).toBeGreaterThan(0)
    expect(avgLag).toBeLessThan(500)
  })

  test('measure rapid typing performance (burst)', async () => {
    await navigateAndFocusEditor(page, lexical, serverURL)
    await setupPerfInstrumentation(page)

    const text =
      'Rapid typing test to measure performance under pressure when user types very quickly'
    await page.keyboard.type(text, { delay: 0 })

    await page.waitForTimeout(1000)

    const results = await collectPerfResults(page)
    const output = formatResults('Rapid Typing (no delay)', results)
    console.log(output)

    const lags = results.inputLag.map((e) => e.lagMs)
    const avgLag = lags.reduce((a, b) => a + b, 0) / lags.length

    expect(lags.length).toBeGreaterThan(0)
    expect(avgLag).toBeLessThan(500)
  })

  test('measure typing with CPU throttling', async () => {
    await navigateAndFocusEditor(page, lexical, serverURL)

    const cdpSession = await context.newCDPSession(page)
    // 6x slowdown simulates a mid-range mobile device
    await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 6 })

    await setupPerfInstrumentation(page)

    const text = 'Typing under CPU throttling to simulate slower devices and real world conditions'
    await page.keyboard.type(text, { delay: 50 })

    await page.waitForTimeout(2000)

    const results = await collectPerfResults(page)
    const output = formatResults('CPU Throttled (6x) Typing', results)
    console.log(output)

    const lags = results.inputLag.map((e) => e.lagMs)
    const avgLag = lags.reduce((a, b) => a + b, 0) / lags.length

    expect(lags.length).toBeGreaterThan(0)
    expect(avgLag).toBeLessThan(2000)

    await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await cdpSession.detach()
  })

  test('measure DOM mutations during selection change', async () => {
    await navigateAndFocusEditor(page, lexical, serverURL)

    await page.keyboard.type('Hello world this is a test of selection performance', { delay: 10 })
    await page.waitForTimeout(500)

    // Observe the entire editor container (not just contentEditable) to catch
    // toolbar re-renders and floating element repositioning during selection
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

    await page.keyboard.press('Home')
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Shift+ArrowRight')
    }

    await page.waitForTimeout(1000)

    const results: { selectionLagEntries?: { index: number; lagMs: number }[] } & PerfResults =
      await page.evaluate(() => (window as any).__lexicalPerf)

    const selLags = (results.selectionLagEntries ?? []).map((e) => e.lagMs)
    const avgSelLag = selLags.length > 0 ? selLags.reduce((a, b) => a + b, 0) / selLags.length : 0
    const maxSelLag = selLags.length > 0 ? Math.max(...selLags) : 0
    const p95SelLag =
      selLags.length > 0
        ? (selLags.sort((a, b) => a - b)[Math.floor(selLags.length * 0.95)] ?? maxSelLag)
        : 0

    const output = [
      `\n=== Selection Change (50 Shift+Arrow) ===`,
      `  Selection key events measured: ${selLags.length}`,
      `  Selection lag (ms):`,
      `    avg: ${avgSelLag.toFixed(2)}`,
      `    max: ${maxSelLag.toFixed(2)}`,
      `    p95: ${p95SelLag.toFixed(2)}`,
      `  DOM mutations (full container): ${results.domMutationCount}`,
      `  DOM mutations per selection step: ${selLags.length > 0 ? (results.domMutationCount / selLags.length).toFixed(2) : 'N/A'}`,
      `  Long tasks (>50ms): ${results.longTaskCount}`,
      `  Long task total time (ms): ${results.longTaskTotalMs.toFixed(2)}`,
    ].join('\n')

    console.log(output)
  })
})
