import { describe } from 'vitest'

import { conventionsQADataset } from './datasets/conventions/qa.js'
import { registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Conventions${labelSuffix}`, () => {
  registerQACases(conventionsQADataset, 'Conventions: QA', options)
})
