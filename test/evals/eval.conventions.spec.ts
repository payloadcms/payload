import { beforeAll } from 'vitest'

import { registerConventionsSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

beforeAll(() => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY must be set to run eval tests')
  }
})

registerConventionsSuite(resolveVariantOptions())
