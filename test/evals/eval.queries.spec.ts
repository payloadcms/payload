import { describe } from 'vitest'

import { queriesCodegenDataset } from './datasets/queries/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Queries${labelSuffix}`, () => {
  registerCodegenCases(queriesCodegenDataset, 'Queries: Codegen', options)
})
