/* eslint-disable @typescript-eslint/no-explicit-any -- Benchmark-only observation of actual protocol boundaries. */
import type { Payload } from 'payload'

import { performance } from 'node:perf_hooks'

type AttributionSample = {
  accessMilliseconds: number
  callbackAfterGuardMilliseconds?: number
  callbackMilliseconds: number
  commandMilliseconds?: number
  guardReadMilliseconds: number
  snapshotCleanupMilliseconds: number
  snapshotSetupMilliseconds: number
  wallMilliseconds?: number
}

/** Observe the native owner before scope creation; the operation's opaque facade remains untouched. */
export const attributeBranchPerformance = async ({
  iterations,
  payload,
  run,
  source,
  statements,
}: {
  iterations: number
  payload: Payload
  run: () => Promise<unknown>
  source: string
  statements: { durationMilliseconds?: number }[]
}) => {
  const adapter = payload.db as any
  const branching = adapter.branching
  const snapshot = branching.withReadSnapshot
  const find = adapter.find
  const access = payload.collections[source]!.config.access
  const read = access.read
  const samples: AttributionSample[] = []
  let sample: AttributionSample

  access.read = async (...args: Parameters<typeof read>) => {
    const started = performance.now()

    try {
      return await read(...args)
    } finally {
      sample.accessMilliseconds += performance.now() - started
    }
  }
  adapter.find = async function (...args: any[]) {
    const started = performance.now()

    try {
      return await find.apply(this, args)
    } finally {
      sample.guardReadMilliseconds += performance.now() - started
    }
  }
  branching.withReadSnapshot = async function ({ read: callback, ...args }: any) {
    const started = performance.now()
    let finished = started
    const result = await snapshot.call(this, {
      ...args,
      read: async ({ req }: any) => {
        sample.snapshotSetupMilliseconds += performance.now() - started
        const entered = performance.now()

        try {
          return await callback({ req })
        } finally {
          finished = performance.now()
          sample.callbackMilliseconds += finished - entered
        }
      },
    })

    sample.snapshotCleanupMilliseconds += performance.now() - finished
    return result
  }
  try {
    for (let iteration = 0; iteration < iterations; iteration++) {
      sample = {
        accessMilliseconds: 0,
        snapshotSetupMilliseconds: 0,
        snapshotCleanupMilliseconds: 0,
        guardReadMilliseconds: 0,
        callbackMilliseconds: 0,
      }
      const firstStatement = statements.length
      const started = performance.now()

      await run()
      sample.wallMilliseconds = performance.now() - started
      const commands = statements.slice(firstStatement)

      if (commands.some((statement) => statement.durationMilliseconds !== undefined)) {
        sample.commandMilliseconds = commands.reduce(
          (sum, statement) => sum + (statement.durationMilliseconds ?? 0),
          0,
        )
      }
      sample.callbackAfterGuardMilliseconds =
        sample.callbackMilliseconds - sample.accessMilliseconds - sample.guardReadMilliseconds
      samples.push(sample)
    }
    return samples
  } finally {
    adapter.find = find
    access.read = read
    branching.withReadSnapshot = snapshot
  }
}
