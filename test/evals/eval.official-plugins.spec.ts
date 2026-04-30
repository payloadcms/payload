import { describe } from 'vitest'

import { pluginsOfficialCodegenDataset } from './datasets/plugins/official/codegen.js'
import { pluginsOfficialQADataset } from './datasets/plugins/official/qa.js'
import { registerCodegenCases, registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Official Plugins${labelSuffix}`, () => {
  registerQACases(pluginsOfficialQADataset, 'Official Plugins: QA', options)
  registerCodegenCases(pluginsOfficialCodegenDataset, 'Official Plugins: Codegen', options)
})
