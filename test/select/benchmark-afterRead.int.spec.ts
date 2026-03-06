import type { Payload } from 'payload'

import { performance } from 'node:perf_hooks'
import path from 'path'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const SEED_COUNT = 200
const WARMUP_ITERATIONS = 10
const BENCH_ITERATIONS = 100

type BenchResult = {
  avgMs: number
  maxMs: number
  medianMs: number
  minMs: number
  opsPerSec: string
  p95Ms: number
}

function runStats(times: number[]): BenchResult {
  const sorted = [...times].sort((a, b) => a - b)
  const avg = times.reduce((a, b) => a + b) / times.length
  return {
    avgMs: Math.round(avg * 100) / 100,
    maxMs: Math.round(sorted[sorted.length - 1]! * 100) / 100,
    medianMs: Math.round(sorted[Math.floor(sorted.length / 2)]! * 100) / 100,
    minMs: Math.round(sorted[0]! * 100) / 100,
    opsPerSec: (1000 / avg).toFixed(2),
    p95Ms: Math.round(sorted[Math.floor(sorted.length * 0.95)]! * 100) / 100,
  }
}

async function bench(fn: () => Promise<void>): Promise<BenchResult> {
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    await fn()
  }

  const times: number[] = []
  for (let i = 0; i < BENCH_ITERATIONS; i++) {
    const start = performance.now()
    await fn()
    times.push(performance.now() - start)
  }

  return runStats(times)
}

function printTable(rows: { label: string; result: BenchResult }[]) {
  console.log(
    '\n┌─────────────────────────────────┬───────────┬───────────────────┬───────────┬───────────┐',
  )
  console.log(
    '│ Scenario                        │ ops/sec   │ Average Time (ms) │ Median    │ p95       │',
  )
  console.log(
    '├─────────────────────────────────┼───────────┼───────────────────┼───────────┼───────────┤',
  )
  for (const { label, result } of rows) {
    console.log(
      `│ ${label.padEnd(31)} │ ${result.opsPerSec.padStart(9)} │ ${String(result.avgMs).padStart(17)} │ ${String(result.medianMs).padStart(9)} │ ${String(result.p95Ms).padStart(9)} │`,
    )
  }
  console.log(
    '└─────────────────────────────────┴───────────┴───────────────────┴───────────┴───────────┘',
  )
}

describe('Benchmark: afterRead data-driven field skipping', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    assert(initialized.payload)
    ;({ payload } = initialized)

    const existingRel = await payload.create({ collection: 'rels', data: { text: 'rel' } })

    const promises = Array.from({ length: SEED_COUNT }, (_, i) =>
      payload.create({
        collection: 'posts',
        depth: 0,
        data: {
          text: `post-${i}`,
          number: i,
          select: 'a',
          selectMany: ['a', 'b'],
          group: { text: `group-text-${i}`, number: i },
          array: [
            { text: `arr-${i}-0`, number: i },
            { text: `arr-${i}-1`, number: i + 1 },
          ],
          blocks: [
            { blockType: 'intro', text: `intro-${i}`, introText: `intro-text-${i}` },
            { blockType: 'cta', text: `cta-${i}`, ctaText: `cta-text-${i}` },
          ],
          tab: { text: `tab-text-${i}`, number: i },
          unnamedTabText: `unnamed-${i}`,
          unnamedTabNumber: i,
          hasOne: existingRel.id,
          hasMany: [existingRel.id],
        },
      }),
    )
    await Promise.all(promises)
    console.log(`\n✅ Seeded ${SEED_COUNT} documents for benchmarking\n`)
  }, 120000)

  afterAll(async () => {
    await payload.destroy()
  })

  it('benchmark: find with select vs full find', async () => {
    console.log(
      `\n📊 Benchmark: afterRead data-driven field optimization (${SEED_COUNT} docs, ${BENCH_ITERATIONS} iterations)`,
    )
    console.log('─'.repeat(90))

    const fullFind = await bench(() =>
      payload.find({ collection: 'posts', depth: 0, limit: SEED_COUNT, pagination: false }),
    )

    const selectOne = await bench(() =>
      payload.find({
        collection: 'posts',
        depth: 0,
        limit: SEED_COUNT,
        pagination: false,
        select: { text: true },
      }),
    )

    const selectThree = await bench(() =>
      payload.find({
        collection: 'posts',
        depth: 0,
        limit: SEED_COUNT,
        pagination: false,
        select: { text: true, number: true, group: true },
      }),
    )

    const selectHalf = await bench(() =>
      payload.find({
        collection: 'posts',
        depth: 0,
        limit: SEED_COUNT,
        pagination: false,
        select: { text: true, number: true, group: true, array: true, blocks: true, tab: true },
      }),
    )

    printTable([
      { label: 'Full find (no select)', result: fullFind },
      { label: 'Select 1/15 fields', result: selectOne },
      { label: 'Select 3/15 fields', result: selectThree },
      { label: 'Select 6/15 fields', result: selectHalf },
    ])

    const speedup1 = ((fullFind.avgMs / selectOne.avgMs - 1) * 100).toFixed(1)
    const speedup3 = ((fullFind.avgMs / selectThree.avgMs - 1) * 100).toFixed(1)
    const speedup6 = ((fullFind.avgMs / selectHalf.avgMs - 1) * 100).toFixed(1)

    console.log(`\n  ⚡ Select 1 field vs full:   +${speedup1}% faster`)
    console.log(`  ⚡ Select 3 fields vs full:  +${speedup3}% faster`)
    console.log(`  ⚡ Select 6 fields vs full:  +${speedup6}% faster`)
    console.log('')

    expect(selectOne.avgMs).toBeLessThan(fullFind.avgMs)
    expect(selectThree.avgMs).toBeLessThan(fullFind.avgMs)
  }, 300000)
})
