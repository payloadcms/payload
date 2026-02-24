import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import { pluginsOfficialCodegenDataset } from '../datasets/plugins/official/codegen.js'
import { pluginsOfficialQADataset } from '../datasets/plugins/official/qa.js'
import { runCodegenCase } from '../runCodegenDataset.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { caseFailureMessage, failureMessage } from '../utils/index.js'

export function registerOfficialPluginsSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel } = options

  describe(`Official Plugins${labelSuffix}`, () => {
    it(`should achieve >= ${ACCURACY_THRESHOLD * 100}% accuracy on question answering`, async () => {
      const { accuracy, results } = await runDataset(
        pluginsOfficialQADataset,
        'Official Plugins: QA',
        { runnerModel },
      )
      const failed = results.filter((r) => !r.pass)
      assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
    })

    describe.concurrent(`Codegen${labelSuffix}`, () => {
      for (const testCase of pluginsOfficialCodegenDataset) {
        it(`${testCase.fixturePath}`, async () => {
          const result = await runCodegenCase(testCase, 'Official Plugins: Codegen', {
            runnerModel,
          })
          assert(result.pass, caseFailureMessage(result))
        })
      }
    })
  })
}
