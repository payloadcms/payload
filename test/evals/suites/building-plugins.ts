import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import { pluginsCodegenDataset } from '../datasets/plugins/codegen.js'
import { pluginsQADataset } from '../datasets/plugins/qa.js'
import { runCodegenCase } from '../runCodegenDataset.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { caseFailureMessage, failureMessage } from '../utils/index.js'

export function registerBuildingPluginsSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel, systemPromptKey } = options

  describe(`Building Plugins${labelSuffix}`, () => {
    it(`should achieve >= ${ACCURACY_THRESHOLD * 100}% accuracy on question answering`, async () => {
      const { accuracy, results } = await runDataset(pluginsQADataset, 'Building Plugins: QA', {
        runnerModel,
        systemPromptKey,
      })
      const failed = results.filter((r) => !r.pass)
      assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
    })

    describe.concurrent(`Codegen${labelSuffix}`, () => {
      for (const testCase of pluginsCodegenDataset) {
        it(`${testCase.fixturePath}`, async () => {
          const result = await runCodegenCase(testCase, 'Building Plugins: Codegen', {
            runnerModel,
            systemPromptKey,
          })
          assert(result.pass, caseFailureMessage(result))
        })
      }
    })
  })
}
