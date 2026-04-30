import { describe } from 'vitest'

import { fieldsCodegenDataset } from './datasets/fields/codegen.js'
import { fieldsQADataset } from './datasets/fields/qa.js'
import { registerCodegenCases, registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Fields${labelSuffix}`, () => {
  registerQACases(fieldsQADataset, 'Fields: QA', options)
  registerCodegenCases(fieldsCodegenDataset, 'Fields: Codegen', options)
})
