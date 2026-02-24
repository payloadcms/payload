import { assert, describe, it } from 'vitest'

import type { SuiteOptions } from './types.js'

import { collectionsCodegenDataset } from '../datasets/collections/codegen.js'
import { collectionsQADataset } from '../datasets/collections/qa.js'
import { runCodegenCase } from '../runCodegenDataset.js'
import { runDataset } from '../runDataset.js'
import { ACCURACY_THRESHOLD } from '../thresholds.js'
import { caseFailureMessage, failureMessage } from '../utils/index.js'

export function registerCollectionsSuite(options: SuiteOptions = {}) {
  const { labelSuffix = '', runnerModel } = options

  describe(`Collections${labelSuffix}`, () => {
    it(`should achieve >= ${ACCURACY_THRESHOLD * 100}% accuracy on question answering`, async () => {
      const { accuracy, results } = await runDataset(collectionsQADataset, 'Collections: QA', {
        runnerModel,
      })
      const failed = results.filter((r) => !r.pass)
      assert(accuracy >= ACCURACY_THRESHOLD, failureMessage(accuracy, failed))
    })

    describe.concurrent(`Codegen${labelSuffix}`, () => {
      for (const testCase of collectionsCodegenDataset) {
        it(`${testCase.fixturePath}`, async () => {
          const result = await runCodegenCase(testCase, 'Collections: Codegen', { runnerModel })
          assert(result.pass, caseFailureMessage(result))
        })
      }
    })
  })
}
