import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionConfig,
  PayloadRequest,
} from 'payload'

import { bulkOperationsSequentialSlug } from '../shared.js'

const contextKey = 'bulkOperationsHookInFlight'

async function assertSequentialHookExecution(req: PayloadRequest): Promise<void> {
  if (req.context[contextKey]) {
    throw new Error('Bulk document hooks ran concurrently on the same request')
  }

  req.context[contextKey] = true
  await new Promise((resolve) => setTimeout(resolve, 10))
  req.context[contextKey] = false
}

const assertSequentialBeforeChange: CollectionBeforeChangeHook = async ({ data, req }) => {
  await assertSequentialHookExecution(req)

  return data
}

const assertSequentialBeforeDelete: CollectionBeforeDeleteHook = async ({ req }) => {
  await assertSequentialHookExecution(req)
}

export const BulkOperationsSequential: CollectionConfig = {
  slug: bulkOperationsSequentialSlug,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
  hooks: {
    beforeChange: [assertSequentialBeforeChange],
    beforeDelete: [assertSequentialBeforeDelete],
  },
}
