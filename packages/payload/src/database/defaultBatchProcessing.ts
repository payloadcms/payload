import type {
  BaseDatabaseAdapter,
  BatchProcessing,
  BatchProcessingOperation,
  BatchProcessingResult,
} from './types.js'

import { processInBatches } from '../utilities/processInBatches.js'

export const defaultBatchProcessing: BatchProcessing = async function defaultBatchProcessing({
  batchSize,
  operations,
  req,
  shouldContinueOnError = false,
}) {
  const results: BatchProcessingResult[] = []
  let shouldStop = false

  await processInBatches({
    batchSize,
    input: operations.map((operation, index) => ({ index, operation })),
    processBatch: async ({ batch }) => {
      for (const { index, operation } of batch) {
        try {
          results.push(await executeOperation({ adapter: this, index, operation, req }))
        } catch (error) {
          results.push({
            error,
            index,
            operation: operation.operation,
            status: 'failed',
          })

          if (!shouldContinueOnError) {
            shouldStop = true
            return { shouldContinue: false }
          }
        }
      }
    },
  })

  if (shouldStop) {
    for (let index = results.length; index < operations.length; index += 1) {
      results.push({
        index,
        operation: operations[index]!.operation,
        status: 'unattempted',
      })
    }
  }

  return results
}

const executeOperation = async ({
  adapter,
  index,
  operation,
  req,
}: {
  adapter: BaseDatabaseAdapter
  index: number
  operation: BatchProcessingOperation
  req: Parameters<BatchProcessing>[0]['req']
}): Promise<BatchProcessingResult> => {
  let document

  switch (operation.operation) {
    case 'create':
      document = await adapter.create({ ...operation.args, req, returning: true })
      break
    case 'deleteOne':
      document = await adapter.deleteOne({ ...operation.args, req, returning: true })
      break
    case 'updateOne':
      document = await adapter.updateOne({ ...operation.args, req, returning: true })
      break
    default:
      throw new TypeError('Unsupported database batch operation')
  }

  if (!document) {
    return { index, operation: operation.operation, status: 'noMatch' }
  }

  return {
    ...(operation.args.returning === false ? {} : { document }),
    documentID: document.id,
    index,
    operation: operation.operation,
    status: 'succeeded',
  }
}
