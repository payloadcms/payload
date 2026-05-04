import { describe } from 'vitest'

import { localApiCollectionsQADataset } from './datasets/local-api/collections/qa.js'
import { registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Local API${labelSuffix}`, () => {
  registerQACases(localApiCollectionsQADataset, 'Local API: Collections QA', options)
})
