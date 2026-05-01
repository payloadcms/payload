import { describe } from 'vitest'

import { restApiCrudQADataset } from './datasets/rest-api/crud/qa.js'
import { registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`REST API${labelSuffix}`, () => {
  registerQACases(restApiCrudQADataset, 'REST API: CRUD QA', options)
})
