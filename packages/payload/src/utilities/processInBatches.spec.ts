import { describe, expect, test } from 'vitest'

import { processInBatches } from './processInBatches.js'

describe('processInBatches', () => {
  test('should process an empty input without calling the processor', async () => {
    let processedGroupCount = 0

    await processInBatches({
      input: [],
      processBatch: () => {
        processedGroupCount += 1
      },
    })

    expect(processedGroupCount).toBe(0)
  })

  test('should process groups of 100 by default and include the final partial group', async () => {
    const processedGroups: number[][] = []

    await processInBatches({
      input: Array.from({ length: 205 }, (_, index) => index),
      processBatch: ({ batch }) => {
        processedGroups.push(batch)
      },
    })

    expect(processedGroups).toEqual([
      Array.from({ length: 100 }, (_, index) => index),
      Array.from({ length: 100 }, (_, index) => index + 100),
      [200, 201, 202, 203, 204],
    ])
  })

  test('should process an async iterable sequentially with an explicit group size', async () => {
    const processingOrder: string[] = []

    async function* input() {
      for (const value of [1, 2, 3, 4, 5]) {
        processingOrder.push(`yield:${value}`)
        yield value
      }
    }

    await processInBatches({
      batchSize: 2,
      input: input(),
      processBatch: async ({ batch, batchIndex }) => {
        processingOrder.push(`start:${batchIndex}:${batch.join(',')}`)
        await Promise.resolve()
        processingOrder.push(`end:${batchIndex}`)
      },
    })

    expect(processingOrder).toEqual([
      'yield:1',
      'yield:2',
      'start:0:1,2',
      'end:0',
      'yield:3',
      'yield:4',
      'start:1:3,4',
      'end:1',
      'yield:5',
      'start:2:5',
      'end:2',
    ])
  })

  test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'should reject the invalid group size %s',
    async (batchSize) => {
      await expect(
        processInBatches({
          batchSize,
          input: [1],
          processBatch: () => undefined,
        }),
      ).rejects.toBeInstanceOf(TypeError)
    },
  )

  test('should propagate a processor failure without retrying or consuming later input', async () => {
    const processedGroups: number[][] = []
    let yieldedCount = 0

    function* input() {
      for (const value of [1, 2, 3, 4, 5, 6]) {
        yieldedCount += 1
        yield value
      }
    }

    await expect(
      processInBatches({
        batchSize: 2,
        input: input(),
        processBatch: ({ batch, batchIndex }) => {
          processedGroups.push(batch)

          if (batchIndex === 1) {
            throw new Error('processor failed')
          }
        },
      }),
    ).rejects.toThrow('processor failed')

    expect(processedGroups).toEqual([
      [1, 2],
      [3, 4],
    ])
    expect(yieldedCount).toBe(4)
  })

  test('should stop before consuming more input when the processor requests it', async () => {
    const processedGroups: number[][] = []
    let yieldedCount = 0

    function* input() {
      for (const value of [1, 2, 3, 4, 5, 6]) {
        yieldedCount += 1
        yield value
      }
    }

    await processInBatches({
      batchSize: 2,
      input: input(),
      processBatch: ({ batch, batchIndex }) => {
        processedGroups.push(batch)

        return { shouldContinue: batchIndex === 0 }
      },
    })

    expect(processedGroups).toEqual([
      [1, 2],
      [3, 4],
    ])
    expect(yieldedCount).toBe(4)
  })

  test('should propagate an input failure without processing an incomplete group', async () => {
    const processedGroups: number[][] = []

    async function* input() {
      yield 1
      yield 2
      throw new Error('input failed')
    }

    await expect(
      processInBatches({
        batchSize: 3,
        input: input(),
        processBatch: ({ batch }) => {
          processedGroups.push(batch)
        },
      }),
    ).rejects.toThrow('input failed')

    expect(processedGroups).toEqual([])
  })
})
