export { DEFAULT_TAXONOMY_TREE_LIMIT, getTaxonomyFieldName } from './constants.js'
export { createTaxonomyField } from './createTaxonomyField.js'
export { findRelatedDocuments } from './operations/index.js'
export type {
  CreateTaxonomyFieldOptions,
  SanitizedRelatedCollection,
  SanitizedTaxonomyConfig,
  TaxonomyConfig,
} from './types.js'
export { validateTaxonomyFields } from './validateTaxonomyFields.js'
