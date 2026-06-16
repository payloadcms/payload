import { describe } from 'vitest'

import { richtextCodegenDataset } from './datasets/richtext/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Richtext${labelSuffix}`, () => {
  registerCodegenCases(richtextCodegenDataset, 'Richtext: Codegen', options)
})
