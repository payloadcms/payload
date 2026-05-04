import { describe } from 'vitest'

import { configCodegenDataset } from './datasets/config/codegen.js'
import { configQADataset } from './datasets/config/qa.js'
import { registerCodegenCases, registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Config${labelSuffix}`, () => {
  registerQACases(configQADataset, 'Config: QA', options)
  registerCodegenCases(configCodegenDataset, 'Config: Codegen', options)
})
