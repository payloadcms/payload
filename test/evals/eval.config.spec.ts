import { registerConfigSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

registerConfigSuite(resolveVariantOptions())
