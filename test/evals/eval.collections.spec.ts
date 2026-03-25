import { registerCollectionsSuite } from './suites/index.js'
import { resolveVariantOptions } from './variantOptions.js'

registerCollectionsSuite(resolveVariantOptions())
