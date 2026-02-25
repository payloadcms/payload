import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import { graphqlCollectionsQADataset } from '../datasets/graphql/collections/qa.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { failureMessage } from '../utils/index.js'

export function registerGraphQLSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel, systemPromptKey } = options

  describe(`GraphQL${labelSuffix}`, () => {
    describe('Collections', () => {
      it(`should achieve >= ${ACCURACY_THRESHOLD * 100}% accuracy on Collections question answering`, async () => {
        const { accuracy, results } = await runDataset(
          graphqlCollectionsQADataset,
          'GraphQL: Collections QA',
          { runnerModel, systemPromptKey },
        )
        const failed = results.filter((r) => !r.pass)
        assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
      })
    })
  })
}
