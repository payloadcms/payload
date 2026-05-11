/* eslint-disable no-console */
/**
 * Profile sanitization of the website template's payload.config.ts.
 *
 * Run from this directory so tsx picks up the local tsconfig and the
 * `@/*` alias resolves:
 *
 *   cd templates/website
 *   PAYLOAD_PROFILE_SANITIZE=1 pnpm tsx profile-sanitize.ts [--iterations=3]
 */

process.env.PAYLOAD_PROFILE_SANITIZE = '1'
process.env.PAYLOAD_DO_NOT_SANITIZE_LOCALIZED_PROPERTY = 'true'
process.env.DISABLE_LOGGING = 'true'
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mongodb://localhost:27017/payload-profile-noop'
process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'profiling-secret'
process.env.NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import minimist from 'minimist'

import {
  aggregateByName,
  getProfilerRecords,
  resetProfiler,
  type SpanRecord,
} from '../../packages/payload/src/utilities/sanitizeProfiler.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const argv = minimist(process.argv.slice(2))
const iterations = Number(argv.iterations) || 3

const formatMs = (ms: number) => ms.toFixed(2).padStart(9)
const pad = (s: string, n: number) => s.padEnd(n)

type IterResult = {
  aggregates: ReturnType<typeof aggregateByName>
  records: SpanRecord[]
  totalMs: number
}

async function profileOnce(i: number): Promise<IterResult> {
  resetProfiler()
  const configPath = path.resolve(dirname, 'src/payload.config.ts')
  const url = `${pathToFileURL(configPath).href}?run=${Date.now()}_${i}`
  const t0 = performance.now()
  const mod = await import(url)
  await mod.default
  return {
    aggregates: aggregateByName(),
    records: getProfilerRecords().slice(),
    totalMs: performance.now() - t0,
  }
}

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b)
  const m = sorted.length >> 1
  return sorted.length % 2 === 0 ? (sorted[m - 1]! + sorted[m]!) / 2 : sorted[m]!
}

async function main() {
  console.log(`Profiling templates/website/src/payload.config.ts × ${iterations}`)

  const iters: IterResult[] = []
  for (let i = 0; i < iterations; i++) {
    iters.push(await profileOnce(i))
  }

  const totals = iters.map((i) => i.totalMs)
  console.log(
    `\n  total wall (import+sanitize): median=${formatMs(median(totals))}ms  min=${formatMs(Math.min(...totals))}ms  max=${formatMs(Math.max(...totals))}ms`,
  )

  // Roots = spans NOT wrapped by sanitizeConfig (e.g., module-init side-effects)
  const rootsByName = new Map<string, { count: number; total: number }>()
  for (const it of iters) {
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
    console.log('  root-level spans:')
    for (const [name, agg] of [...rootsByName.entries()].sort((a, b) => b[1].total - a[1].total)) {
      console.log(
        `    ${pad(name, 36)} count=${agg.count}  totalMs=${formatMs(agg.total / iterations)}`,
      )
    }
  }

  // Aggregate spans across iterations
  const combined = new Map<string, { count: number; self: number; total: number }>()
  for (const it of iters) {
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
  const rows = Array.from(combined.entries())
    .map(([name, c]) => ({
      avgCount: c.count / iterations,
      avgSelf: c.self / iterations,
      avgTotal: c.total / iterations,
      name,
    }))
    .sort((a, b) => b.avgSelf - a.avgSelf)

  console.log(
    `\n  ${pad('span', 36)} ${pad('count', 7)} ${pad('selfMs', 9)} ${pad('totalMs', 9)} ${pad('selfMs/call(µs)', 16)}`,
  )
  for (const r of rows) {
    const perCall = r.avgCount > 0 ? (r.avgSelf * 1000) / r.avgCount : 0
    console.log(
      `  ${pad(r.name, 36)} ${pad(r.avgCount.toFixed(0), 7)} ${formatMs(r.avgSelf)} ${formatMs(r.avgTotal)} ${perCall.toFixed(2).padStart(15)}`,
    )
  }

  console.log('\nDone.')
}

void main()
