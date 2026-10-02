export type ProcessBatchResult = {
  shouldContinue?: boolean
}

export type ProcessInBatchesArgs<T> = {
  /**
   * The maximum number of items supplied to one processor call.
   *
   * @default 100
   */
  batchSize?: number
  input: AsyncIterable<T> | Iterable<T>
  processBatch: (args: {
    batch: T[]
    batchIndex: number
  }) => ProcessBatchResult | Promise<ProcessBatchResult | void> | void
}

/**
 * Processes iterable input in ordered, bounded batches. Processing is sequential and stops when the
 * processor returns `shouldContinue: false` or throws. This utility does not retry work or manage
 * transactions.
 */
export const processInBatches = async <T>({
  batchSize = 100,
  input,
  processBatch,
}: ProcessInBatchesArgs<T>): Promise<void> => {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new TypeError('batchSize must be a positive integer')
  }

  let batch: T[] = []
  let batchIndex = 0

  for await (const item of input) {
    batch.push(item)

    if (batch.length < batchSize) {
      continue
    }

    const result = await processBatch({ batch, batchIndex })

    if (result?.shouldContinue === false) {
      return
    }

    batch = []
    batchIndex += 1
  }

  if (batch.length > 0) {
    await processBatch({ batch, batchIndex })
  }
}
