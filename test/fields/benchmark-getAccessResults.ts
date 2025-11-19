#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'path'
import { createLocalReq, getAccessResults, getPayload, type PermissionStats } from 'payload'
import { Bench } from 'tinybench'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const factor = 10
const iterations = 1000 * factor
const warmupIterations = 20 * factor

/**
 * Performance benchmark for getAccessResults in fields test suite
 * Run with: pnpm tsx test/fields/benchmark-getAccessResults.ts
 */
async function runBenchmark() {
  console.log('🚀 Fields Test Suite - getAccessResults Performance Benchmark\n')

  // Import config
  const { default: configPromise } = await import(path.resolve(dirname, 'config.ts'))
  const config = await configPromise

  // Initialize Payload
  console.log('Initializing Payload...')
  const payload = await getPayload({ config })
  console.log('✅ Payload initialized\n')

  // Create test request
  const req = await createLocalReq(
    {
      user: {
        id: '123',
        collection: 'users',
        roles: ['admin'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        email: 'test@test.com',
      } as any,
    },
    payload,
  )

  // ============================================================================
  // Benchmark: getAccessResults (all collections + globals in fields suite)
  // ============================================================================
  console.log('📊 Benchmark: getAccessResults (all fields test collections + globals)')
  console.log('─'.repeat(70))

  const bench = new Bench({ time: iterations, warmupIterations })

  const statsNew: PermissionStats[] = []
  const statsOld: PermissionStats[] = []

  bench
    .add('NEW (optimized)', async () => {
      const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
      await getAccessResults({ req, legacy: false, stats: iterStats })
      statsNew.push(iterStats)
    })
    .add('OLD (previous)', async () => {
      const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
      await getAccessResults({ req, legacy: true, stats: iterStats })
      statsOld.push(iterStats)
    })

  await bench.run()

  console.table(
    bench.tasks.map((task) => ({
      'Task Name': task.name,
      'ops/sec': task.result?.hz?.toFixed(2) || '0',
      'Average Time (ms)': task.result?.mean ? (task.result.mean * 1000).toFixed(3) : '0',
      Margin: task.result?.rme ? `±${task.result.rme.toFixed(2)}%` : '0',
    })),
  )

  const newTask = bench.tasks.find((t) => t.name === 'NEW (optimized)')
  const oldTask = bench.tasks.find((t) => t.name === 'OLD (previous)')

  if (newTask?.result?.hz && oldTask?.result?.hz) {
    const speedup = ((newTask.result.hz - oldTask.result.hz) / oldTask.result.hz) * 100

    // Calculate averages from collected stats
    const newAvgTotal = statsNew.reduce((sum, s) => sum + s.totalCalls, 0) / statsNew.length
    const newAvgData = statsNew.reduce((sum, s) => sum + s.dataFetchCalls, 0) / statsNew.length
    const newAvgWhere = statsNew.reduce((sum, s) => sum + s.whereQueryCalls, 0) / statsNew.length

    const oldAvgTotal = statsOld.reduce((sum, s) => sum + s.totalCalls, 0) / statsOld.length
    const oldAvgData = statsOld.reduce((sum, s) => sum + s.dataFetchCalls, 0) / statsOld.length
    const oldAvgWhere = statsOld.reduce((sum, s) => sum + s.whereQueryCalls, 0) / statsOld.length

    console.log(
      `\n  ⚡ Speedup: ${speedup > 0 ? '+' : ''}${speedup.toFixed(1)}% ${speedup > 0 ? '🚀' : '⚠️'}`,
    )
    console.log(`  📊 DB Calls per operation (across all collections + globals):`)
    console.log(
      `     NEW: ${newAvgTotal.toFixed(1)} total (${newAvgData.toFixed(1)} data, ${newAvgWhere.toFixed(1)} where)`,
    )
    console.log(
      `     OLD: ${oldAvgTotal.toFixed(1)} total (${oldAvgData.toFixed(1)} data, ${oldAvgWhere.toFixed(1)} where)`,
    )
    console.log()

    // Additional metrics
    console.log('═'.repeat(70))
    console.log('📈 Performance Metrics:')
    console.log('═'.repeat(70))
    console.log(`  Total iterations:    ${newTask.result.count}`)
    console.log(`  NEW average time:    ${(newTask.result.mean * 1000).toFixed(3)}ms per call`)
    console.log(`  OLD average time:    ${(oldTask.result.mean * 1000).toFixed(3)}ms per call`)
    console.log(
      `  Time saved per call: ${((oldTask.result.mean - newTask.result.mean) * 1000).toFixed(3)}ms`,
    )
    console.log('═'.repeat(70))
  }

  // Cleanup
  await payload.destroy()
  console.log('\n✅ Benchmark complete!')
  process.exit(0)
}

await runBenchmark()
