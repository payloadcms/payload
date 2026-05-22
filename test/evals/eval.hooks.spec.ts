import { describe } from 'vitest'

import { hooksCodegenDataset } from './datasets/hooks/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Hooks${labelSuffix}`, () => {
  registerCodegenCases(hooksCodegenDataset, 'Hooks: Codegen', options)
})
