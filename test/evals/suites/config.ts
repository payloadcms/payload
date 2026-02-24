import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import { configCodegenDataset } from '../datasets/config/codegen.js'
import { configQADataset } from '../datasets/config/qa.js'
import { runCodegenCase } from '../runCodegenDataset.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { caseFailureMessage, failureMessage } from '../utils/index.js'

export function registerConfigSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel } = options

  describe(`Config${labelSuffix}`, () => {
    it(`should achieve >= ${ACCURACY_THRESHOLD * 100}% accuracy on question answering`, async () => {
      const { accuracy, results } = await runDataset(configQADataset, 'Config: QA', { runnerModel })
      const failed = results.filter((r) => !r.pass)
      assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
    })

    describe.concurrent(`Codegen${labelSuffix}`, () => {
      for (const testCase of configCodegenDataset) {
        it(`${testCase.fixturePath}`, async () => {
          const result = await runCodegenCase(testCase, 'Config: Codegen', { runnerModel })
          assert(result.pass, caseFailureMessage(result))
        })
      }
    })
  })
}
