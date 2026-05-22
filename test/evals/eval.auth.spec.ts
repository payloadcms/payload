import { describe } from 'vitest'

import { authCodegenDataset } from './datasets/auth/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Auth${labelSuffix}`, () => {
  registerCodegenCases(authCodegenDataset, 'Auth: Codegen', options)
})
