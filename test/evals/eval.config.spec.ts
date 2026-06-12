import { describe } from 'vitest'

import { configCodegenDataset } from './datasets/config/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Config${labelSuffix}`, () => {
  registerCodegenCases(configCodegenDataset, 'Config: Codegen', options)
})
