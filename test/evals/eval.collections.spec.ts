import { describe } from 'vitest'

import { collectionsCodegenDataset } from './datasets/collections/codegen.js'
import { collectionsQADataset } from './datasets/collections/qa.js'
import { registerCodegenCases, registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Collections${labelSuffix}`, () => {
  registerQACases(collectionsQADataset, 'Collections: QA', options)
  registerCodegenCases(collectionsCodegenDataset, 'Collections: Codegen', options)
})
