import { describe } from 'vitest'

import { accessControlCodegenDataset } from './datasets/access-control/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`AccessControl${labelSuffix}`, () => {
  registerCodegenCases(accessControlCodegenDataset, 'AccessControl: Codegen', options)
})
