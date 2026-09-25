import { describe } from 'vitest'

import { pluginsOfficialCodegenDataset } from './datasets/plugins/official/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Official Plugins${labelSuffix}`, () => {
  registerCodegenCases(pluginsOfficialCodegenDataset, 'Official Plugins: Codegen', options)
})
