export { DEFAULT_TAXONOMY_TREE_LIMIT, getTaxonomyFieldName } from './constants.js'
export { injectTaxonomyFields } from './injectTaxonomyFields.js'
export { findRelatedDocuments } from './operations/index.js'
export type {
  SanitizedRelatedCollection,
  SanitizedTaxonomyConfig,
  TaxonomyConfig,
  TaxonomyRelatedCollectionConfig,
  TaxonomyRelationshipFieldOverrides,
} from './types.js'
