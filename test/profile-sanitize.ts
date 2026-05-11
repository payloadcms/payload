/**
 * Profile config sanitization across multiple test suites.
 *
 * Runs each named test config N times (cache-busted) with the profiler
 * enabled, prints aggregated hotspot stats to stdout.
 *
 * Usage:
 *   PAYLOAD_PROFILE_SANITIZE=1 \
 *   pnpm tsx test/profile-sanitize.ts \
 *     [--suites=fields,uploads,localization] [--iterations=3]
 */

process.env.PAYLOAD_PROFILE_SANITIZE = '1'
process.env.PAYLOAD_DO_NOT_SANITIZE_LOCALIZED_PROPERTY = 'true'
process.env.DISABLE_LOGGING = 'true'

import minimist from 'minimist'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  aggregateByName,
  getProfilerRecords,
  resetProfiler,
  type SpanRecord,
} from '../packages/payload/src/utilities/sanitizeProfiler.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const argv = minimist(process.argv.slice(2))

const DEFAULT_SUITES = [
  '_community',
  'field-perf',
  'fields',
  'localization',
  'uploads',
  'auth',
  'collections-rest',
  'lexical',
  'plugin-mcp',
  'relationships',
]

const suites: string[] = (argv.suites ? String(argv.suites).split(',') : DEFAULT_SUITES)
  .map((s) => s.trim())
  .filter(Boolean)

/**
 * Extra config paths formatted as `label:relative/path/to/payload.config.ts`.
 * Useful for profiling templates or apps outside test/.
 */
const extraEntries: Array<{ label: string; path: string }> = (
  argv.extra ? String(argv.extra).split(',') : []
)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((entry) => {
    const [label, ...rest] = entry.split(':')
    return { label: label!.trim(), path: rest.join(':').trim() }
  })

const iterations = Number(argv.iterations) || 3

type SuiteResult = {
  iterations: Array<{
    aggregates: ReturnType<typeof aggregateByName>
    records: SpanRecord[]
    totalMs: number
  }>
  suite: string
}

const formatMs = (ms: number) => ms.toFixed(2).padStart(9)
const pad = (s: string, n: number) => s.padEnd(n)

async function profileConfigPath(label: string, configPath: string): Promise<SuiteResult> {
  const result: SuiteResult = { iterations: [], suite: label }

  for (let i = 0; i < iterations; i++) {
    resetProfiler()

    // Cache-bust import URL so the config module re-evaluates each run
    const url = `${pathToFileURL(configPath).href}?run=${Date.now()}_${i}`

    const t0 = performance.now()
    const mod = await import(url)
    await mod.default
    const totalMs = performance.now() - t0

    result.iterations.push({
      aggregates: aggregateByName(),
      records: getProfilerRecords().slice(),
      totalMs,
    })
  }

  return result
}

async function profileSuite(suite: string): Promise<SuiteResult> {
  return profileConfigPath(suite, path.resolve(dirname, suite, 'config.ts'))
}

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b)
  const m = sorted.length >> 1
  return sorted.length % 2 === 0 ? (sorted[m - 1]! + sorted[m]!) / 2 : sorted[m]!
}

function printSuite(suite: SuiteResult): void {
  const totals = suite.iterations.map((i) => i.totalMs)
  const totalMedian = median(totals)
  const totalMin = Math.min(...totals)
  const totalMax = Math.max(...totals)

  console.log(`\n=== ${suite.suite} ===`)
  console.log(
    `  total wall (import+sanitize): median=${formatMs(totalMedian)}ms  min=${formatMs(totalMin)}ms  max=${formatMs(totalMax)}ms  iters=${iterations}`,
  )

  // Roots (parent=-1) tell us which spans were called outside any parent span,
  // i.e., outside sanitizeConfig. Useful for finding module-init side-effect work.
  const rootsByName = new Map<string, { count: number; total: number }>()
  for (const it of suite.iterations) {
    for (const r of it.records) {
      if (r.parent === -1) {
        let agg = rootsByName.get(r.name)
        if (!agg) {
          agg = { count: 0, total: 0 }
          rootsByName.set(r.name, agg)
        }
        agg.count += 1
        agg.total += r.duration
      }
    }
  }
  if (rootsByName.size > 0) {
    console.log(`  root-level spans (NOT wrapped by sanitizeConfig):`)
    for (const [name, agg] of [...rootsByName.entries()].sort((a, b) => b[1].total - a[1].total)) {
      console.log(`    ${pad(name, 36)} count=${agg.count}  totalMs=${formatMs(agg.total / iterations)}`)
    }
  }

  // Aggregate across iterations: sum spans per name across runs, divide by iterations
  type CombinedAgg = {
    avgCount: number
    avgSelf: number
    avgTotal: number
    name: string
  }
  const combined = new Map<string, { count: number; self: number; total: number }>()
  for (const it of suite.iterations) {
    for (const a of it.aggregates) {
      let c = combined.get(a.name)
      if (!c) {
        c = { count: 0, self: 0, total: 0 }
        combined.set(a.name, c)
      }
      c.count += a.count
      c.self += a.totalSelf
      c.total += a.totalTime
    }
  }
  const rows: CombinedAgg[] = Array.from(combined.entries())
    .map(([name, c]) => ({
      avgCount: c.count / iterations,
      avgSelf: c.self / iterations,
      avgTotal: c.total / iterations,
      name,
    }))
    .sort((a, b) => b.avgSelf - a.avgSelf)

  console.log(
    `  ${pad('span', 36)} ${pad('count', 7)} ${pad('selfMs', 9)} ${pad('totalMs', 9)} ${pad('selfMs/call(µs)', 16)}`,
  )
  for (const r of rows) {
    const perCall = r.avgCount > 0 ? (r.avgSelf * 1000) / r.avgCount : 0
    console.log(
      `  ${pad(r.name, 36)} ${pad(r.avgCount.toFixed(0), 7)} ${formatMs(r.avgSelf)} ${formatMs(r.avgTotal)} ${perCall.toFixed(2).padStart(15)}`,
    )
  }
}

async function main() {
  const totalCount = suites.length + extraEntries.length
  console.log(
    `Profiling sanitization across ${totalCount} config(s), ${iterations} iteration(s) each`,
  )
  if (suites.length) {
    console.log(`Test suites: ${suites.join(', ')}`)
  }
  if (extraEntries.length) {
    console.log(`Extra configs: ${extraEntries.map((e) => e.label).join(', ')}`)
  }

  const results: SuiteResult[] = []
  for (const suite of suites) {
    try {
      const r = await profileSuite(suite)
      results.push(r)
      printSuite(r)
    } catch (err) {
      console.error(`\n!!! Suite ${suite} failed:`, err instanceof Error ? err.message : err)
    }
  }
  for (const extra of extraEntries) {
    try {
      const absPath = path.isAbsolute(extra.path)
        ? extra.path
        : path.resolve(process.cwd(), extra.path)
      const r = await profileConfigPath(extra.label, absPath)
      results.push(r)
      printSuite(r)
    } catch (err) {
      console.error(
        `\n!!! Extra config ${extra.label} (${extra.path}) failed:`,
        err instanceof Error ? err.message : err,
      )
    }
  }

  // Cross-suite summary
  console.log('\n=== Cross-suite summary (median total wall ms) ===')
  console.log(`  ${pad('suite', 28)} ${pad('medianMs', 12)} ${pad('iters', 6)}`)
  for (const r of results) {
    const med = median(r.iterations.map((i) => i.totalMs))
    console.log(`  ${pad(r.suite, 28)} ${formatMs(med)}    ${r.iterations.length}`)
  }

  console.log('\nDone.')
}

void main()
