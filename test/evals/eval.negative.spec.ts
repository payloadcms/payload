import { registerNegativeSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

registerNegativeSuite(resolveVariantOptions())
