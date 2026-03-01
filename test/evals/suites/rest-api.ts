import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import { restApiCrudQADataset } from '../datasets/rest-api/crud/qa.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { failureMessage } from '../utils/index.js'

export function registerRestApiSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel, systemPromptKey } = options

  describe(`REST API${labelSuffix}`, () => {
    describe('CRUD', () => {
      it(`should achieve >= ${ACCURACY_THRESHOLD * 100}% accuracy on CRUD question answering`, async () => {
        const { accuracy, results } = await runDataset(restApiCrudQADataset, 'REST API: CRUD QA', {
          runnerModel,
          systemPromptKey,
        })
        const failed = results.filter((r) => !r.pass)
        assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
      })
    })
  })
}
