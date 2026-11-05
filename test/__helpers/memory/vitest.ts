import { test as vitestTest } from 'vitest'

type MeasureMemoryUsage = <Result>({ run }: { run: () => Promise<Result> | Result }) => Promise<{
  memoryUsage: NodeJS.MemoryUsage
  result: Result
}>

type MemoryFixtures = {
  measureMemoryUsage: MeasureMemoryUsage
}

export const test = vitestTest.extend<MemoryFixtures>({
  // eslint-disable-next-line no-empty-pattern
  measureMemoryUsage: async ({}, use) => {
    if (!global.gc) {
      throw new Error('The memory test fixture requires Node.js --expose-gc.')
    }

    await use(async ({ run }) => {
      collectGarbage()
      const memoryUsageBefore = process.memoryUsage()
      const result = await run()

      collectGarbage()
      const memoryUsageAfter = process.memoryUsage()

      return {
        memoryUsage: getMemoryUsageIncrease({ memoryUsageAfter, memoryUsageBefore }),
        result,
      }
    })
  },
})

const collectGarbage = (): void => {
  global.gc?.()
  global.gc?.()
  global.gc?.()
}

const getMemoryUsageIncrease = ({
  memoryUsageAfter,
  memoryUsageBefore,
}: {
  memoryUsageAfter: NodeJS.MemoryUsage
  memoryUsageBefore: NodeJS.MemoryUsage
}): NodeJS.MemoryUsage => ({
  arrayBuffers: memoryUsageAfter.arrayBuffers - memoryUsageBefore.arrayBuffers,
  external: memoryUsageAfter.external - memoryUsageBefore.external,
  heapTotal: memoryUsageAfter.heapTotal - memoryUsageBefore.heapTotal,
  heapUsed: memoryUsageAfter.heapUsed - memoryUsageBefore.heapUsed,
  rss: memoryUsageAfter.rss - memoryUsageBefore.rss,
})
