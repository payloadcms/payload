import { describe, expect, it } from 'vitest'

import type { EvalCase } from '../types.js'
import type { SuiteOptions } from './types.js'

import { runCodegenCase } from '../runCodegenDataset.js'
import { caseFailureMessage } from '../utils/index.js'

type RegisterCodegenOptions = {
  /** When false, asserts result.pass === false (used by negative invalid-instruction tests). */
  expectPass?: boolean
  /** Custom group name. Defaults to "Codegen". */
  groupName?: string
  /** Prefix prepended to each test's config path/name. */
  testNamePrefix?: string
} & SuiteOptions

export function registerCodegenCases(
  dataset: EvalCase[],
  label: string,
  options: RegisterCodegenOptions = {},
) {
  const {
    agentModel,
    expectPass = true,
    groupName = 'Codegen',
    kind,
    labelSuffix = '',
    runnerModel,
    skillInstall,
    systemPromptKey,
    testNamePrefix = '',
  } = options

  describe.concurrent(`${groupName}${labelSuffix}`, () => {
    for (const testCase of dataset) {
      it(`${testNamePrefix}${testCase.configPath}`, async () => {
        const result = await runCodegenCase(testCase, label, {
          agentModel,
          kind,
          runnerModel,
          skillInstall,
          systemPromptKey,
        })

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
