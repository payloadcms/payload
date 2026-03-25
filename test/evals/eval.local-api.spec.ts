import { registerLocalApiSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

registerLocalApiSuite(resolveVariantOptions())
