import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import {
  negativeCorrectionCodegenDataset,
  negativeInvalidInstructionDataset,
} from '../datasets/negative/codegen.js'
import { negativeQADataset } from '../datasets/negative/qa.js'
import { runCodegenCase } from '../runCodegenDataset.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { caseFailureMessage, failureMessage } from '../utils/index.js'

export function registerNegativeSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel, systemPromptKey } = options

  describe(`Negative Tests${labelSuffix}`, () => {
    it('should detect errors in deliberately broken configs', async () => {
      const { accuracy, results } = await runDataset(negativeQADataset, 'Negative: Detection', {
        runnerModel,
        systemPromptKey: 'configReview',
      })
      const failed = results.filter((r) => !r.pass)
      assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
    })

    describe.concurrent(`Correction: Codegen${labelSuffix}`, () => {
      for (const testCase of negativeCorrectionCodegenDataset) {
        it(`${testCase.fixturePath}`, async () => {
          const result = await runCodegenCase(testCase, 'Negative: Correction', {
            runnerModel,
            systemPromptKey,
          })
          assert(result.pass, caseFailureMessage(result))
        })
      }
    })

    describe.concurrent(`Invalid Instruction: Codegen${labelSuffix}`, () => {
      for (const testCase of negativeInvalidInstructionDataset) {
        it(`should fail: ${testCase.fixturePath}`, async () => {
          const result = await runCodegenCase(testCase, 'Negative: Invalid Instruction', {
            runnerModel,
            systemPromptKey,
          })
          assert(
            !result.pass,
            `Pipeline should have caught the deliberately broken config but it passed`,
          )
        })
      }
    })
  })
}
