import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import { localApiCollectionsQADataset } from '../datasets/local-api/collections/qa.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { failureMessage } from '../utils/index.js'

export function registerLocalApiSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel, systemPromptKey } = options

  describe(`Local API${labelSuffix}`, () => {
    describe('Collections', () => {
      it(`should achieve >= ${ACCURACY_THRESHOLD * 100}% accuracy on Collections question answering`, async () => {
        const { accuracy, results } = await runDataset(
          localApiCollectionsQADataset,
          'Local API: Collections QA',
          { runnerModel, systemPromptKey },
        )
        const failed = results.filter((r) => !r.pass)
        assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
      })
    })
  })
}
