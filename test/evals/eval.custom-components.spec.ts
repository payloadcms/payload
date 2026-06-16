import { describe } from 'vitest'

import { customComponentsCodegenDataset } from './datasets/custom-components/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`CustomComponents${labelSuffix}`, () => {
  registerCodegenCases(customComponentsCodegenDataset, 'CustomComponents: Codegen', options)
})
