import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import { conventionsQADataset } from '../datasets/conventions/qa.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { failureMessage } from '../utils/index.js'

export function registerConventionsSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel } = options

  describe(`Conventions${labelSuffix}`, () => {
    it(`should achieve >= ${ACCURACY_THRESHOLD * 100}% accuracy on question answering`, async () => {
      const { accuracy, results } = await runDataset(conventionsQADataset, 'Conventions: QA', {
        runnerModel,
      })
      const failed = results.filter((r) => !r.pass)
      assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
    })
  })
}
