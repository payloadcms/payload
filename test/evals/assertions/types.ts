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
  | 'afterForgotPassword' // auth-enabled collections
  | 'afterLogin' // auth-enabled collections
  | 'afterLogout' // auth-enabled collections
  | 'afterMe' // auth-enabled collections
  | 'afterOperation'
  | 'afterRead'
  | 'afterRefresh' // auth-enabled collections
  | 'beforeChange'
  | 'beforeDelete'
  | 'beforeLogin' // auth-enabled collections
  | 'beforeOperation'
  | 'beforeRead'
  | 'beforeValidate'
  | 'me' // auth-enabled collections
  | 'refresh' // auth-enabled collections

export type FieldHookName = 'afterChange' | 'afterRead' | 'beforeChange' | 'beforeValidate'

export type AccessOperation = 'create' | 'delete' | 'read' | 'update'

export type Assertion =
  | {
      /** Asserts a collection-level access function (`collection.access.<operation>`) is defined. */
      kind: 'collectionAccess'
      /** Access operation whose function must be present. */
      operation: AccessOperation
      /** Slug of the collection whose access object is being checked. */
      slug: string
    }
  | {
      /** Asserts a collection with the given slug exists in the parsed config. */
      kind: 'collectionExists'
      /** Slug to find in `collections[]`. */
      slug: string
    }
  | {
      /** Asserts a property on a collection beyond `fields[]`/`hooks`/`access` — versions, auth, admin, timestamps, upload, etc. */
      kind: 'collectionOption'
      /** Dotted path on the collection, e.g. 'versions.drafts', 'auth.loginWithUsername', 'admin.useAsTitle'. */
      path: string
      /** Slug of the collection. */
      slug: string
      /** Optional expected literal value. Omit to check existence only. */
      value?: boolean | number | string
    }
  | {
      /** Asserts a property on the top-level `buildConfig({ ... })` object, addressed by a dotted path. Used for root-level options that don't fit collections.fields/hooks/access (csrf, cookiePrefix, serverURL, routes, admin.importMap.baseDir, admin.components.*, jobs.autoRun, etc.). When the value at a path is not an object literal (e.g. `db` is a call to `postgresAdapter(...)`), descent stops there — use `dbAdapterOption` for adapter args. */
      kind: 'configOption'
      /** Dotted path under buildConfig, e.g. 'csrf', 'admin.importMap.baseDir', 'jobs.autoRun'. */
      path: string
      /** Optional expected literal value (boolean/number/string). Omit to check existence only. */
      value?: boolean | number | string
    }
  | {
      /** Asserts a task with the given slug exists in `buildConfig.jobs.tasks[]`. */
      kind: 'jobsTask'
      /** Slug of the task. */
      slug: string
    }
  | {
      /** Asserts a workflow with the given slug exists in `buildConfig.jobs.workflows[]`. */
      kind: 'jobsWorkflow'
      /** Slug of the workflow. */
      slug: string
    }
  | {
      /** Lifecycle name of the collection hook (e.g. "beforeChange"). */
      hook: CollectionHookName
      /** Asserts a collection-level hook (`collection.hooks.<hook>`) is defined and non-empty. */
      kind: 'collectionHook'
      /** Slug of the collection that should own the hook. */
      slug: string
    }
  | {
      /** Name of the field inside the resolved collection (or parent field) to assert exists. */
      field: string
      /** Optional expected `type` of the field (e.g. "text", "relationship"). */
      fieldType?: string
      /** Asserts a field exists at the collection root or inside an array/group `parentField`. */
      kind: 'fieldExists'
      /** When set, walks into the named array/group field's `fields` array (single-level). */
      parentField?: string
      /** Slug of the collection that should contain the field. */
      slug: string
    }
  | {
      /** Name of the field that must own the field-level hook. */
      field: string
      /** Lifecycle name of the field hook (e.g. "afterRead"). */
      hook: FieldHookName
      /** Asserts a field-level hook (`fields[].hooks.<hook>`) is defined and non-empty. */
      kind: 'fieldHook'
      /** When set, the hook lives on a field nested inside the named array/group parent. */
      parentField?: string
      /** Slug of the collection containing the field. */
      slug: string
    }
  | {
      /** Name of the field whose option is being asserted. */
      field: string
      /** Asserts a field option is set, optionally to a specific primitive value. */
      kind: 'fieldOption'
      /** Property name on the field object (e.g. "required", "relationTo", "defaultValue"). */
      option: string
      /** When set, the option is checked on a field nested inside the named array/group parent. */
      parentField?: string
      /** Slug of the collection containing the field. */
      slug: string
      /** Optional expected literal value. When omitted, only existence of the option is checked. */
      value?: boolean | number | string
    }
  | {
      /** Optional adapter discriminator. Values: 'mongoose' | 'postgres' | 'sqlite' | 'vercel-postgres' | 'd1-sqlite'. Omit to accept any. */
      adapter?: string
      /** Asserts a property passed to the db adapter call (mongooseAdapter, postgresAdapter, sqliteAdapter, vercelPostgresAdapter, d1SqliteAdapter). */
      kind: 'dbAdapterOption'
      /** Dotted path on the adapter args, e.g. 'migrationDir', 'prodMigrations', 'transactionOptions'. */
      path: string
      /** Optional expected literal value. */
      value?: boolean | number | string
    }
  | {
      /** Slug of the block (within `field.blocks[]`) the subfield must appear in. */
      blockSlug: string
      /** Name of the parent `blocks` field on the collection. */
      field: string
      /** Optional expected `type` of the subfield (e.g. "text"). */
      fieldType?: string
      /** Asserts a field exists inside a specific block of a `blocks` field. */
      kind: 'blockField'
      /** Slug of the collection containing the blocks field. */
      slug: string
      /** Name of the field inside the block to assert exists. */
      subfield: string
    }
