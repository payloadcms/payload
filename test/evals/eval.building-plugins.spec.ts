import { describe } from 'vitest'

import { pluginsCodegenDataset } from './datasets/plugins/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Building Plugins${labelSuffix}`, () => {
  registerCodegenCases(pluginsCodegenDataset, 'Building Plugins: Codegen', options)
})
