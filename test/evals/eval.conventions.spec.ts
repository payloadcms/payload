import { registerConventionsSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

registerConventionsSuite(resolveVariantOptions())
