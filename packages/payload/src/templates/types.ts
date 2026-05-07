import type { Access } from '../config/types.js'

/**
 * Per-collection configuration for the Templates API.
 *
 * Pass `true` as shorthand for `{ save: true, create: true }`.
 *
 * @see https://github.com/payloadcms/payload/discussions/16515
 */
export type TemplatesConfig = {
  /**
   * Customize access control on `payload-templates` for documents owned by this collection.
   * Defaults to gating saving on the host collection's `create` access.
   */
  access?: {
    /** Who can save documents from this collection as templates. */
    save?: Access
    /** Who can apply templates of this collection when creating new documents. */
    use?: Access
  }
  /**
   * Expose the "Create from Template" affordance on this collection's list view.
   * @default true
   */
  create?: boolean
  /**
   * Expose the "Save as Template" affordance on this collection's edit view.
   * @default true
   */
  save?: boolean
}

/**
 * Tier of template — what kind of entity the stored data corresponds to.
 *
 * - `collection`: a full document's data, applied at create time.
 * - `block`: a single block instance, inserted into a `blocks` field.
 * - `field`: the entire value of a single field, replacing it.
 */
export type TemplateEntityType = 'block' | 'collection' | 'field'

/**
 * Internal: the document shape stored in the `payload-templates` collection.
 * Field-level types in `payload-types.ts` are generated from the runtime config;
 * this type exists for consumers who import templates programmatically.
 */
export type TemplateDocument = {
  /**
   * Stamped lazily when an apply attempt detects schema drift.
   * Cleared by saving the template through the editor.
   */
  _isStale?: boolean
  createdAt: string
  createdBy?: number | string
  data: unknown
  description?: null | string
  entitySlug: string
  entityType: TemplateEntityType
  id: number | string
  /**
   * Deterministic structural hash of the source schema at save time.
   * Compared against the live schema to detect drift.
   */
  schemaHash: string
  /**
   * Structural snapshot of the source schema at save time
   * (names, types, nesting, block slugs — functions/components stripped).
   * Used for drift diagnostics, not for re-rendering.
   */
  schemaSnapshot: unknown
  title: string
  updatedAt: string
}
