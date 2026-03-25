import { registerBuildingPluginsSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

registerBuildingPluginsSuite(resolveVariantOptions())
