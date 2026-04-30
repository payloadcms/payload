import { describe } from 'vitest'

import {
  negativeCorrectionCodegenDataset,
  negativeInvalidInstructionDataset,
} from './datasets/negative/codegen.js'
import { negativeQADataset } from './datasets/negative/qa.js'
import { registerCodegenCases, registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Negative Tests${labelSuffix}`, () => {
  registerQACases(negativeQADataset, 'Negative: Detection', {
    ...options,
    systemPromptKeyOverride: 'configReview',
  })
  registerCodegenCases(negativeCorrectionCodegenDataset, 'Negative: Correction', {
    ...options,
    groupName: 'Correction: Codegen',
  })
  registerCodegenCases(negativeInvalidInstructionDataset, 'Negative: Invalid Instruction', {
    ...options,
    expectPass: false,
    groupName: 'Invalid Instruction: Codegen',
    testNamePrefix: 'should fail: ',
  })
})
