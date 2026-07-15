import { describe } from 'vitest'

import { collectionsCodegenDataset } from './datasets/collections/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Collections${labelSuffix}`, () => {
  registerCodegenCases(collectionsCodegenDataset, 'Collections: Codegen', options)
})
