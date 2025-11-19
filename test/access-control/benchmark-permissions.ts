#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'path'
import {
  createLocalReq,
  docAccessOperation,
  getAccessResults,
  getPayload,
  type PermissionStats,
} from 'payload'
import { Bench } from 'tinybench'
import { fileURLToPath } from 'url'

import {
  complexContentSlug,
  syncHeavySlug,
  whereCacheSameSlug,
  whereCacheUniqueSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Configure which benchmarks to run (1-6)
const benchmarksToRun = [1, 2, 3, 4, 5, 6]

const factor = 1

const iterations = 1000 * factor
const warmupIterations = 20 * factor
/**
 * Performance benchmark for permission calculations using tinybench
 * Run with: pnpm tsx test/access-control/benchmark-permissions.ts
 */
async function runBenchmark() {
  console.log('🚀 Starting Permission Performance Benchmark...\n')

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

  // Create test documents
  console.log('Creating test documents...')
  const doc1 = await payload.create({
    collection: whereCacheSameSlug,
    data: {
      title: 'Benchmark Doc 1',
      userRole: 'admin',
    },
  } as any)

  const doc2 = await payload.create({
    collection: whereCacheUniqueSlug,
    data: {
      title: 'Benchmark Doc 2',
      readRole: 'admin',
      updateRole: 'admin',
      deleteRole: 'admin',
    },
  } as any)

  const doc3 = await payload.create({
    collection: complexContentSlug,
    data: {
      title: 'Complex Content Doc',
      status: 'published',
      isPublic: true,
      author: '123',
    },
  } as any)

  const doc4 = await payload.create({
    collection: syncHeavySlug,
    data: {
      title: 'Sync Heavy Doc',
      ownerRole: 'admin',
    },
  } as any)
  console.log('✅ Test documents created\n')

  // ============================================================================
  // Benchmark 1: getAccessResults (full permission calculation)
  // ============================================================================
  if (benchmarksToRun.includes(1)) {
    console.log('📊 Benchmark 1: getAccessResults (all collections + globals)')
    console.log('─'.repeat(70))

    const bench1 = new Bench({ time: iterations, warmupIterations })

    const stats1New: PermissionStats[] = []
    const stats1Old: PermissionStats[] = []

    bench1
      .add('NEW (optimized)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await getAccessResults({ req, legacy: false, stats: iterStats })
        stats1New.push(iterStats)
      })
      .add('OLD (previous)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await getAccessResults({ req, legacy: true, stats: iterStats })
        stats1Old.push(iterStats)
      })

    await bench1.run()

    console.table(
      bench1.tasks.map((task) => ({
        'Task Name': task.name,
        'ops/sec': task.result?.hz?.toFixed(2) || '0',
        'Average Time (ms)': task.result?.mean ? (task.result.mean * 1000).toFixed(3) : '0',
        Margin: task.result?.rme ? `±${task.result.rme.toFixed(2)}%` : '0',
      })),
    )

    const new1 = bench1.tasks.find((t) => t.name === 'NEW (optimized)')
    const old1 = bench1.tasks.find((t) => t.name === 'OLD (previous)')
    if (new1?.result?.hz && old1?.result?.hz) {
      const speedup = ((new1.result.hz - old1.result.hz) / old1.result.hz) * 100

      // Calculate averages from collected stats
      const newAvgTotal = stats1New.reduce((sum, s) => sum + s.totalCalls, 0) / stats1New.length
      const newAvgData = stats1New.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats1New.length
      const newAvgWhere =
        stats1New.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats1New.length

      const oldAvgTotal = stats1Old.reduce((sum, s) => sum + s.totalCalls, 0) / stats1Old.length
      const oldAvgData = stats1Old.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats1Old.length
      const oldAvgWhere =
        stats1Old.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats1Old.length

      console.log(
        `  ⚡ Speedup: ${speedup > 0 ? '+' : ''}${speedup.toFixed(1)}% ${speedup > 0 ? '🚀' : '⚠️'}`,
      )
      console.log(`  📊 DB Calls per operation (across all collections + globals):`)
      console.log(
        `     NEW: ${newAvgTotal.toFixed(1)} total (${newAvgData.toFixed(1)} data, ${newAvgWhere.toFixed(1)} where)`,
      )
      console.log(
        `     OLD: ${oldAvgTotal.toFixed(1)} total (${oldAvgData.toFixed(1)} data, ${oldAvgWhere.toFixed(1)} where)\n`,
      )
    }
  }

  // ============================================================================
  // Benchmark 2: docAccessOperation (single document with data fetch)
  // ============================================================================
  if (benchmarksToRun.includes(2)) {
    console.log('📊 Benchmark 2: docAccessOperation (with fetchData)')
    console.log('─'.repeat(70))
    console.log(`  Collection: ${whereCacheSameSlug} (same where queries)\n`)

    const bench2 = new Bench({ time: iterations, warmupIterations })

    const stats2New: PermissionStats[] = []
    const stats2Old: PermissionStats[] = []

    bench2
      .add('NEW (with cache)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await docAccessOperation({
          id: doc1.id,
          collection: payload.collections[whereCacheSameSlug],
          req,
          legacy: false,
          stats: iterStats,
        })
        stats2New.push(iterStats)
      })
      .add('OLD (no cache)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await docAccessOperation({
          id: doc1.id,
          collection: payload.collections[whereCacheSameSlug],
          req,
          legacy: true,
          stats: iterStats,
        })
        stats2Old.push(iterStats)
      })

    await bench2.run()

    console.table(
      bench2.tasks.map((task) => ({
        'Task Name': task.name,
        'ops/sec': task.result?.hz?.toFixed(2) || '0',
        'Average Time (ms)': task.result?.mean ? (task.result.mean * 1000).toFixed(3) : '0',
        Margin: task.result?.rme ? `±${task.result.rme.toFixed(2)}%` : '0',
      })),
    )

    const new2 = bench2.tasks.find((t) => t.name === 'NEW (with cache)')
    const old2 = bench2.tasks.find((t) => t.name === 'OLD (no cache)')
    if (new2?.result?.hz && old2?.result?.hz) {
      const speedup = ((new2.result.hz - old2.result.hz) / old2.result.hz) * 100

      // Calculate averages from collected stats
      const newAvgTotal = stats2New.reduce((sum, s) => sum + s.totalCalls, 0) / stats2New.length
      const newAvgData = stats2New.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats2New.length
      const newAvgWhere =
        stats2New.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats2New.length

      const oldAvgTotal = stats2Old.reduce((sum, s) => sum + s.totalCalls, 0) / stats2Old.length
      const oldAvgData = stats2Old.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats2Old.length
      const oldAvgWhere =
        stats2Old.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats2Old.length

      console.log(
        `  ⚡ Speedup: ${speedup > 0 ? '+' : ''}${speedup.toFixed(1)}% ${speedup > 0 ? '🚀' : '⚠️'}`,
      )
      console.log(`  📊 DB Calls per operation:`)
      console.log(
        `     NEW: ${newAvgTotal.toFixed(1)} total (${newAvgData.toFixed(1)} data, ${newAvgWhere.toFixed(1)} where)`,
      )
      console.log(
        `     OLD: ${oldAvgTotal.toFixed(1)} total (${oldAvgData.toFixed(1)} data, ${oldAvgWhere.toFixed(1)} where)\n`,
      )
    }
  }

  // ============================================================================
  // Benchmark 3: docAccessOperation with data passed (no fetch)
  // ============================================================================
  if (benchmarksToRun.includes(3)) {
    console.log('📊 Benchmark 3: docAccessOperation (with data passed)')
    console.log('─'.repeat(70))
    console.log(`  Collection: ${whereCacheSameSlug} (same where queries, no DB fetch)\n`)

    const bench3 = new Bench({ time: iterations, warmupIterations })

    const stats3New: PermissionStats[] = []
    const stats3Old: PermissionStats[] = []

    bench3
      .add('NEW (with cache)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await docAccessOperation({
          id: doc1.id,
          collection: payload.collections[whereCacheSameSlug],
          data: doc1,
          req,
          legacy: false,
          stats: iterStats,
        })
        stats3New.push(iterStats)
      })
      .add('OLD (no cache)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await docAccessOperation({
          id: doc1.id,
          collection: payload.collections[whereCacheSameSlug],
          data: doc1,
          req: { ...req, data: doc1 },
          legacy: true,
          stats: iterStats,
        })
        stats3Old.push(iterStats)
      })

    await bench3.run()

    console.table(
      bench3.tasks.map((task) => ({
        'Task Name': task.name,
        'ops/sec': task.result?.hz?.toFixed(2) || '0',
        'Average Time (ms)': task.result?.mean ? (task.result.mean * 1000).toFixed(3) : '0',
        Margin: task.result?.rme ? `±${task.result.rme.toFixed(2)}%` : '0',
      })),
    )

    const new3 = bench3.tasks.find((t) => t.name === 'NEW (with cache)')
    const old3 = bench3.tasks.find((t) => t.name === 'OLD (no cache)')
    if (new3?.result?.hz && old3?.result?.hz) {
      const speedup = ((new3.result.hz - old3.result.hz) / old3.result.hz) * 100

      // Calculate averages from collected stats
      const newAvgTotal = stats3New.reduce((sum, s) => sum + s.totalCalls, 0) / stats3New.length
      const newAvgData = stats3New.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats3New.length
      const newAvgWhere =
        stats3New.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats3New.length

      const oldAvgTotal = stats3Old.reduce((sum, s) => sum + s.totalCalls, 0) / stats3Old.length
      const oldAvgData = stats3Old.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats3Old.length
      const oldAvgWhere =
        stats3Old.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats3Old.length

      console.log(
        `  ⚡ Speedup: ${speedup > 0 ? '+' : ''}${speedup.toFixed(1)}% ${speedup > 0 ? '🚀' : '⚠️'}`,
      )
      console.log(`  📊 DB Calls per operation:`)
      console.log(
        `     NEW: ${newAvgTotal.toFixed(1)} total (${newAvgData.toFixed(1)} data, ${newAvgWhere.toFixed(1)} where)`,
      )
      console.log(
        `     OLD: ${oldAvgTotal.toFixed(1)} total (${oldAvgData.toFixed(1)} data, ${oldAvgWhere.toFixed(1)} where)\n`,
      )
    }
  }

  // ============================================================================
  // Benchmark 4: docAccessOperation with unique where queries
  // ============================================================================
  if (benchmarksToRun.includes(4)) {
    console.log('📊 Benchmark 4: docAccessOperation (unique where queries)')
    console.log('─'.repeat(70))
    console.log(`  Collection: ${whereCacheUniqueSlug} (unique where queries per operation)\n`)

    const bench4 = new Bench({ time: iterations, warmupIterations })

    const stats4New: PermissionStats[] = []
    const stats4Old: PermissionStats[] = []

    bench4
      .add('NEW (parallel)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await docAccessOperation({
          id: doc2.id,
          collection: payload.collections[whereCacheUniqueSlug],
          req,
          legacy: false,
          stats: iterStats,
        })
        stats4New.push(iterStats)
      })
      .add('OLD (sequential)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await docAccessOperation({
          id: doc2.id,
          collection: payload.collections[whereCacheUniqueSlug],
          req,
          legacy: true,
          stats: iterStats,
        })
        stats4Old.push(iterStats)
      })

    await bench4.run()

    console.table(
      bench4.tasks.map((task) => ({
        'Task Name': task.name,
        'ops/sec': task.result?.hz?.toFixed(2) || '0',
        'Average Time (ms)': task.result?.mean ? (task.result.mean * 1000).toFixed(3) : '0',
        Margin: task.result?.rme ? `±${task.result.rme.toFixed(2)}%` : '0',
      })),
    )

    const new4 = bench4.tasks.find((t) => t.name === 'NEW (parallel)')
    const old4 = bench4.tasks.find((t) => t.name === 'OLD (sequential)')
    if (new4?.result?.hz && old4?.result?.hz) {
      const speedup = ((new4.result.hz - old4.result.hz) / old4.result.hz) * 100

      // Calculate averages from collected stats
      const newAvgTotal = stats4New.reduce((sum, s) => sum + s.totalCalls, 0) / stats4New.length
      const newAvgData = stats4New.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats4New.length
      const newAvgWhere =
        stats4New.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats4New.length

      const oldAvgTotal = stats4Old.reduce((sum, s) => sum + s.totalCalls, 0) / stats4Old.length
      const oldAvgData = stats4Old.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats4Old.length
      const oldAvgWhere =
        stats4Old.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats4Old.length

      console.log(
        `  ⚡ Speedup: ${speedup > 0 ? '+' : ''}${speedup.toFixed(1)}% ${speedup > 0 ? '🚀' : '⚠️'}`,
      )
      console.log(`  📊 DB Calls per operation:`)
      console.log(
        `     NEW: ${newAvgTotal.toFixed(1)} total (${newAvgData.toFixed(1)} data, ${newAvgWhere.toFixed(1)} where)`,
      )
      console.log(
        `     OLD: ${oldAvgTotal.toFixed(1)} total (${oldAvgData.toFixed(1)} data, ${oldAvgWhere.toFixed(1)} where)\n`,
      )
    }
  }

  // ============================================================================
  // Benchmark 5: Complex collection with async access + many fields/blocks
  // ============================================================================
  if (benchmarksToRun.includes(5)) {
    console.log('📊 Benchmark 5: Complex Collection (async access, nested blocks, field access)')
    console.log('─'.repeat(70))
    console.log(`  Collection: ${complexContentSlug} (stress test)\n`)

    const bench5 = new Bench({ time: iterations, warmupIterations })

    const stats5New: PermissionStats[] = []
    const stats5Old: PermissionStats[] = []

    bench5
      .add('NEW (optimized)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        try {
          await docAccessOperation({
            id: doc3.id,
            collection: payload.collections[complexContentSlug as any],
            req,
            legacy: false,
            stats: iterStats,
          })
          stats5New.push(iterStats)
        } catch (error) {
          console.error('\n[Benchmark 5 NEW] Error:', error)
          throw error
        }
      })
      .add('OLD (sequential)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await docAccessOperation({
          id: doc3.id,
          collection: payload.collections[complexContentSlug as any],
          req,
          legacy: true,
          stats: iterStats,
        })
        stats5Old.push(iterStats)
      })

    await bench5.run()

    console.table(
      bench5.tasks.map((task) => ({
        'Task Name': task.name,
        'ops/sec': task.result?.hz?.toFixed(2) || '0',
        'Average Time (ms)': task.result?.mean ? (task.result.mean * 1000).toFixed(3) : '0',
        Margin: task.result?.rme ? `±${task.result.rme.toFixed(2)}%` : '0',
      })),
    )

    const new5 = bench5.tasks.find((t) => t.name === 'NEW (optimized)')
    const old5 = bench5.tasks.find((t) => t.name === 'OLD (sequential)')

    if (new5?.result?.hz && old5?.result?.hz) {
      const speedup = ((new5.result.hz - old5.result.hz) / old5.result.hz) * 100

      // Calculate averages from collected stats
      const newAvgTotal = stats5New.reduce((sum, s) => sum + s.totalCalls, 0) / stats5New.length
      const newAvgData = stats5New.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats5New.length
      const newAvgWhere =
        stats5New.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats5New.length

      const oldAvgTotal = stats5Old.reduce((sum, s) => sum + s.totalCalls, 0) / stats5Old.length
      const oldAvgData = stats5Old.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats5Old.length
      const oldAvgWhere =
        stats5Old.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats5Old.length

      console.log(
        `  ⚡ Speedup: ${speedup > 0 ? '+' : ''}${speedup.toFixed(1)}% ${speedup > 0 ? '🚀' : '⚠️'}`,
      )
      console.log(`  📊 DB Calls per operation:`)
      console.log(
        `     NEW: ${newAvgTotal.toFixed(1)} total (${newAvgData.toFixed(1)} data, ${newAvgWhere.toFixed(1)} where)`,
      )
      console.log(
        `     OLD: ${oldAvgTotal.toFixed(1)} total (${oldAvgData.toFixed(1)} data, ${oldAvgWhere.toFixed(1)} where)\n`,
      )
    }
  }

  // ============================================================================
  // Benchmark 6: Sync-heavy collection (same where queries, many field access)
  // ============================================================================
  if (benchmarksToRun.includes(6)) {
    console.log('📊 Benchmark 6: Sync-Heavy Collection (same where, many sync field access)')
    console.log('─'.repeat(70))
    console.log(`  Collection: ${syncHeavySlug} (where cache + field access)\n`)

    const bench6 = new Bench({ time: iterations, warmupIterations })

    const stats6New: PermissionStats[] = []
    const stats6Old: PermissionStats[] = []

    bench6
      .add('NEW (with cache)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await docAccessOperation({
          id: doc4.id,
          collection: payload.collections[syncHeavySlug as any],
          data: doc4,
          req,
          legacy: false,
          stats: iterStats,
        })
        stats6New.push(iterStats)
      })
      .add('OLD (no cache)', async () => {
        const iterStats: PermissionStats = { totalCalls: 0, dataFetchCalls: 0, whereQueryCalls: 0 }
        await docAccessOperation({
          id: doc4.id,
          collection: payload.collections[syncHeavySlug as any],
          data: doc4,
          req: { ...req, data: doc4 },
          legacy: true,
          stats: iterStats,
        })
        stats6Old.push(iterStats)
      })

    await bench6.run()

    console.table(
      bench6.tasks.map((task) => ({
        'Task Name': task.name,
        'ops/sec': task.result?.hz?.toFixed(2) || '0',
        'Average Time (ms)': task.result?.mean ? (task.result.mean * 1000).toFixed(3) : '0',
        Margin: task.result?.rme ? `±${task.result.rme.toFixed(2)}%` : '0',
      })),
    )

    const new6 = bench6.tasks.find((t) => t.name === 'NEW (with cache)')
    const old6 = bench6.tasks.find((t) => t.name === 'OLD (no cache)')

    if (new6?.result?.hz && old6?.result?.hz) {
      const speedup = ((new6.result.hz - old6.result.hz) / old6.result.hz) * 100

      // Calculate averages from collected stats
      const newAvgTotal = stats6New.reduce((sum, s) => sum + s.totalCalls, 0) / stats6New.length
      const newAvgData = stats6New.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats6New.length
      const newAvgWhere =
        stats6New.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats6New.length

      const oldAvgTotal = stats6Old.reduce((sum, s) => sum + s.totalCalls, 0) / stats6Old.length
      const oldAvgData = stats6Old.reduce((sum, s) => sum + s.dataFetchCalls, 0) / stats6Old.length
      const oldAvgWhere =
        stats6Old.reduce((sum, s) => sum + s.whereQueryCalls, 0) / stats6Old.length

      console.log(
        `  ⚡ Speedup: ${speedup > 0 ? '+' : ''}${speedup.toFixed(1)}% ${speedup > 0 ? '🚀' : '⚠️'}`,
      )
      console.log(`  📊 DB Calls per operation:`)
      console.log(
        `     NEW: ${newAvgTotal.toFixed(1)} total (${newAvgData.toFixed(1)} data, ${newAvgWhere.toFixed(1)} where)`,
      )
      console.log(
        `     OLD: ${oldAvgTotal.toFixed(1)} total (${oldAvgData.toFixed(1)} data, ${oldAvgWhere.toFixed(1)} where)\n`,
      )
    }
  }

  // ============================================================================
  // Summary
  // ============================================================================
  if (benchmarksToRun.length > 0) {
    console.log('═'.repeat(70))
    console.log('📈 Summary:')
    console.log('═'.repeat(70))

    if (benchmarksToRun.includes(1)) {
      console.log(`  1. getAccessResults:                        (see above)`)
    }
    if (benchmarksToRun.includes(2)) {
      console.log(`  2. docAccessOperation (with fetchData):     (see above)`)
    }
    if (benchmarksToRun.includes(3)) {
      console.log(`  3. docAccessOperation (with data passed):   (see above)`)
    }
    if (benchmarksToRun.includes(4)) {
      console.log(`  4. docAccessOperation (unique where):       (see above)`)
    }
    if (benchmarksToRun.includes(5)) {
      console.log(`  5. Complex collection (async + nested):     (see above)`)
    }
    if (benchmarksToRun.includes(6)) {
      console.log(`  6. Sync-heavy (where cache + fields):       (see above)`)
    }
    console.log('═'.repeat(70))
    console.log()
  }

  // Cleanup
  await payload.destroy()
  console.log('✅ Benchmark complete!')
  process.exit(0)
}

await runBenchmark()
