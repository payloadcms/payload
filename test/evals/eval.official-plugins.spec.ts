import { registerOfficialPluginsSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

registerOfficialPluginsSuite(resolveVariantOptions())
