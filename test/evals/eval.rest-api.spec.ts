import { registerRestApiSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

registerRestApiSuite(resolveVariantOptions())
