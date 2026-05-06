/**
 * Public re-exports of the Versions diff rendering surface.
 *
 * This subpath (`@payloadcms/next/views/diff`) gives plugin and integrator code
 * access to the same field-by-field diff UI used by Payload's built-in Versions
 * view, so consumers can build "review changes" / custom diff drawers without
 * vendoring or deep-importing internal modules.
 *
 * The internal Versions view (`packages/next/src/views/Version/index.tsx`)
 * imports from this same entry, so internal and external consumers share a
 * single source of truth and the public surface cannot silently drift.
 */

export {
  buildVersionFields,
  type BuildVersionFieldsArgs,
} from '../../views/Version/RenderFieldsToDiff/buildVersionFields.js'
export { DiffCollapser } from '../../views/Version/RenderFieldsToDiff/DiffCollapser/index.js'
// Re-export the keyed per-field diff component map under both the internal name
// and a clearer public alias, for `RenderDiff`'s `customDiffComponents` consumers.
export { diffComponents } from '../../views/Version/RenderFieldsToDiff/fields/index.js'
export { diffComponents as defaultDiffComponents } from '../../views/Version/RenderFieldsToDiff/fields/index.js'

export { RenderDiff } from '../../views/Version/RenderFieldsToDiff/index.js'
export { RenderVersionFieldsToDiff } from '../../views/Version/RenderFieldsToDiff/RenderVersionFieldsToDiff.js'

export {
  countChangedFields,
  countChangedFieldsInRows,
} from '../../views/Version/RenderFieldsToDiff/utilities/countChangedFields.js'
export { fieldHasChanges } from '../../views/Version/RenderFieldsToDiff/utilities/fieldHasChanges.js'
export { getFieldsForRowComparison } from '../../views/Version/RenderFieldsToDiff/utilities/getFieldsForRowComparison.js'
