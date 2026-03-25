import { registerGraphQLSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

registerGraphQLSuite(resolveVariantOptions())
