import { describe } from 'vitest'

import { graphqlCollectionsQADataset } from './datasets/graphql/collections/qa.js'
import { registerQACases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`GraphQL${labelSuffix}`, () => {
  registerQACases(graphqlCollectionsQADataset, 'GraphQL: Collections QA', options)
})
