import { describe } from 'vitest'

import { productionCodegenDataset } from './datasets/production/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Production${labelSuffix}`, () => {
  registerCodegenCases(productionCodegenDataset, 'Production: Codegen', options)
})
