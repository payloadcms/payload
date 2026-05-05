/**
 * Lightweight DSL for structural assertions over a generated payload.config.ts.
 *
 * Assertions describe what *must* be true of the LLM's modified config in
 * structural terms (where a hook lives, whether a field has an option, etc.).
 * They are evaluated against a parsed AST, not against the LLM scorer's
 * judgment, so they catch the kinds of mismatches the scorer otherwise rates
 * as "minor" (e.g. collection-level vs. field-level hooks).
 */

export type CollectionHookName =
  | 'afterChange'
  | 'afterDelete'
  | 'afterRead'
  | 'beforeChange'
  | 'beforeDelete'
  | 'beforeOperation'
  | 'beforeRead'
  | 'beforeValidate'

export type FieldHookName = 'afterChange' | 'afterRead' | 'beforeChange' | 'beforeValidate'

export type AccessOperation = 'create' | 'delete' | 'read' | 'update'

/**
 * `parentField` lets nested-field assertions target a field inside an
 * `array` or `group` field's `fields` array. Single-level only — for blocks
 * use `blockField` instead.
 */
export type Assertion =
  | {
      blockSlug: string
      field: string
      fieldType?: string
      kind: 'blockField'
      slug: string
      subfield: string
    }
  | { field: string; fieldType?: string; kind: 'fieldExists'; parentField?: string; slug: string }
  | { field: string; hook: FieldHookName; kind: 'fieldHook'; parentField?: string; slug: string }
  | {
      field: string
      kind: 'fieldOption'
      option: string
      parentField?: string
      slug: string
      value?: boolean | number | string
    }
  | { hook: CollectionHookName; kind: 'collectionHook'; slug: string }
  | { kind: 'collectionAccess'; operation: AccessOperation; slug: string }
  | { kind: 'collectionExists'; slug: string }
