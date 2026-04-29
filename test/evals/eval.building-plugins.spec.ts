import { describe } from 'vitest'

import { pluginsCodegenDataset } from './datasets/plugins/codegen.js'
import { pluginsQADataset } from './datasets/plugins/qa.js'
import { registerCodegenCases, registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Building Plugins${labelSuffix}`, () => {
  registerQACases(pluginsQADataset, 'Building Plugins: QA', options)
  registerCodegenCases(pluginsCodegenDataset, 'Building Plugins: Codegen', options)
})
