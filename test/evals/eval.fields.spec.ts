import { describe } from 'vitest'

import { fieldsCodegenDataset } from './datasets/fields/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Fields${labelSuffix}`, () => {
  registerCodegenCases(fieldsCodegenDataset, 'Fields: Codegen', options)
})
