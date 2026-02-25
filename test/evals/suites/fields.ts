import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import { fieldsCodegenDataset } from '../datasets/fields/codegen.js'
import { fieldsQADataset } from '../datasets/fields/qa.js'
import { runCodegenCase } from '../runCodegenDataset.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { caseFailureMessage, failureMessage } from '../utils/index.js'

export function registerFieldsSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel, systemPromptKey } = options

  describe(`Fields${labelSuffix}`, () => {
    it(`should achieve >= ${ACCURACY_THRESHOLD * 100}% accuracy on question answering`, async () => {
      const { accuracy, results } = await runDataset(fieldsQADataset, 'Fields: QA', {
        runnerModel,
        systemPromptKey,
      })
      const failed = results.filter((r) => !r.pass)
      assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
    })

    describe.concurrent(`Codegen${labelSuffix}`, () => {
      for (const testCase of fieldsCodegenDataset) {
        it(`${testCase.fixturePath}`, async () => {
          const result = await runCodegenCase(testCase, 'Fields: Codegen', { runnerModel })
          assert(result.pass, caseFailureMessage(result))
        })
      }
    })
  })
}
