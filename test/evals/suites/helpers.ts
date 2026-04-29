import { describe, expect, it } from 'vitest'

import type { CodegenEvalCase, EvalCase, SystemPromptKey } from '../types.js'
import type { SuiteOptions } from './types.js'

import { runCodegenCase } from '../runCodegenDataset.js'
import { runQACase } from '../runDataset.js'
import { caseFailureMessage } from '../utils/index.js'

type RegisterQAOptions = {
  /** Override the variant's systemPromptKey (used by negative.ts to force configReview). */
  systemPromptKeyOverride?: SystemPromptKey
} & SuiteOptions

export function registerQACases(
  dataset: EvalCase[],
  label: string,
  options: RegisterQAOptions = {},
) {
  const { labelSuffix = '', runnerModel, systemPromptKey, systemPromptKeyOverride } = options
  describe.concurrent(`QA${labelSuffix}`, () => {
    for (const testCase of dataset) {
      it(testCase.input, async () => {
        const result = await runQACase(testCase, label, {
          runnerModel,
          systemPromptKey: systemPromptKeyOverride ?? systemPromptKey,
        })
        expect(result.pass, caseFailureMessage(result)).toBe(true)
      })
    }
  })
}

type RegisterCodegenOptions = {
  /** When false, asserts result.pass === false (used by negative invalid-instruction tests). */
  expectPass?: boolean
  /** Custom group name. Defaults to "Codegen". */
  groupName?: string
  /** Prefix prepended to each test's fixturePath name. */
  testNamePrefix?: string
} & SuiteOptions

export function registerCodegenCases(
  dataset: CodegenEvalCase[],
  label: string,
  options: RegisterCodegenOptions = {},
) {
  const {
    expectPass = true,
    groupName = 'Codegen',
    labelSuffix = '',
    runnerModel,
    systemPromptKey,
    testNamePrefix = '',
  } = options
  describe.concurrent(`${groupName}${labelSuffix}`, () => {
    for (const testCase of dataset) {
      it(`${testNamePrefix}${testCase.fixturePath}`, async () => {
        const result = await runCodegenCase(testCase, label, { runnerModel, systemPromptKey })
        if (expectPass) {
          expect(result.pass, caseFailureMessage(result)).toBe(true)
        } else {
          expect(
            result.pass,
            'Pipeline should have caught the deliberately broken config but it passed',
          ).toBe(false)
        }
      })
    }
  })
}
