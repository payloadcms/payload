import { describe } from 'vitest'

import { jobsCodegenDataset } from './datasets/jobs/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Jobs${labelSuffix}`, () => {
  registerCodegenCases(jobsCodegenDataset, 'Jobs: Codegen', options)
})
