import type { I18n, TFunction } from '@payloadcms/translations'
import type DataLoader from 'dataloader'
import type { OptionalKeys, Prettify, RequiredKeys } from 'ts-essentials'
import type { URL } from 'url'

import type { ServerAdapter } from '../admin/adapters/server.js'
import type {
  DataFromCollectionSlug,
  QueryDraftDataFromCollectionSlug,
  TypeWithID,
  TypeWithTimestamps,
} from '../collections/config/types.js'
import type payload from '../index.js'
import type {
  AllowedDepth,
  AuthenticatedUser,
  CollectionSlug,
  DataFromGlobalSlug,
  DecrementDepth,
  GlobalSlug,
  Payload,
  RequestContext,
  TypedCollectionJoins,
  TypedCollectionSelect,
  TypedFallbackLocale,
  TypedLocale,
} from '../index.js'
import type { File } from '../uploads/types.js'
import type { Operator } from './constants.js'
export type { TypeWithID } from '../collections/config/types.js'
export type { Payload } from '../index.js'

export interface PayloadRequestAPI {
  GraphQL: true
  local: true
  REST: true
}

export type CustomPayloadRequestProperties = {
  context: RequestContext
  /** The locale that should be used for a field when it is not translated to the requested locale */
  fallbackLocale?: TypedFallbackLocale
  i18n: I18n
  /**
   * The requested locale if specified
   * Only available for localized collections
   *
   * Suppressing warning below as it is a valid use case - won't be an issue if generated types exist
   */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  locale?: 'all' | TypedLocale
  /**
   * The payload object
   */
  payload: typeof payload
  /**
   * The context in which the request is being made
   */
  payloadAPI: keyof PayloadRequestAPI
  /** Optimized document loader */
  payloadDataLoader: {
    /**
     * Wraps `payload.find` with a cache to deduplicate requests
     * @experimental This is may be replaced by a more robust cache strategy in future versions
     * By calling this method with the same arguments many times in one request, it will only be handled one time
     * const result = await req.payloadDataLoader.find({
     *  collection,
     *  req,
     *  where: findWhere,
     * })
     */
    find: Payload['find']
  } & DataLoader<string, TypeWithID>
  /** Resized versions of the image that was uploaded during this request */
  payloadUploadSizes?: Record<string, Buffer>
  /** Query params on the request */
  query: Record<string, unknown>
  /** Any response headers that are required to be set when a response is sent */
  responseHeaders?: Headers
  /** The route parameters
   * @example
   * /:collection/:id -> /posts/123
   * { collection: 'posts', id: '123' }
   */
  routeParams?: Record<string, unknown>
  /**
   * Framework abstraction for server-only navigation, cookies, and headers APIs.
   * Populated by the framework adapter (e.g. `@payloadcms/next`). Plugins that
   * have access to `req` should call methods here (`req.server.unauthorized()`,
   * `req.server.redirect(...)`) instead of importing from `next/navigation` or
   * `next/headers` directly. Optional because non-framework contexts (jobs,
   * scripts, tests) construct requests without a server adapter.
   */
  server?: ServerAdapter
  /** Translate function - duplicate of i18n.t */
  t: TFunction
  /**
   * Identifier for the database transaction for interactions in a single, all-or-nothing operation.
   * Can also be used to ensure consistency when multiple operations try to create a transaction concurrently on the same request.
   */
  transactionID?: number | Promise<number | string> | string
  /** The signed-in user */
  user: AuthenticatedUser | null
} & Pick<
  URL,
  'hash' | 'host' | 'href' | 'origin' | 'pathname' | 'port' | 'protocol' | 'search' | 'searchParams'
>
type PayloadRequestData = {
  /**
   * Data from the request body
   *
   * Within Payload operations, i.e. hooks, data will be there
   * BUT in custom endpoints it will not be, you will need to
   * use either:
   *  1. `const data = await req.json()`
   *
   *  2. import { addDataAndFileToRequest } from 'payload'
   *    `await addDataAndFileToRequest(req)`
   *
   * You should not expect this object to be the document data. It is the request data.
   * */
  data?: JsonObject
  /** The file on the request, same rules apply as the `data` property */
  file?: {
    uploadReference?: unknown
  } & File
  /** All files from multipart form data, keyed by field name */
  files?: Record<string, File | File[]>
}
export interface PayloadRequest
  extends CustomPayloadRequestProperties,
    Partial<Request>,
    PayloadRequestData {
  headers: Request['headers']
}

export type { Operator }

// Makes it so things like passing new Date() will error
export type JsonValue = JsonArray | JsonObject | unknown //Date | JsonArray | JsonObject | boolean | null | number | string // TODO: Evaluate proper, strong type for this

export type JsonArray = Array<JsonValue>

export interface JsonObject {
  [key: string]: any
}

export type WhereField = {
  // any json-serializable value
  [key in Operator]?: JsonValue
}

export type Where = {
  [key: string]: Where[] | WhereField
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  and?: Where[]
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  or?: Where[]
}

export type Sort = Array<string> | string

type SerializableValue = boolean | number | object | string
export type DefaultValue =
  | ((args: {
      locale?: TypedLocale
      req: PayloadRequest
      user: PayloadRequest['user']
    }) => Promise<SerializableValue> | SerializableValue)
  | SerializableValue

/**
 * Applies pagination for join fields for including collection relationships
 */
export type JoinQuery<TSlug extends CollectionSlug = string> =
  TypedCollectionJoins[TSlug] extends Record<string, string>
    ?
        | false
        | Partial<{
            [K in keyof TypedCollectionJoins[TSlug]]:
              | {
                  count?: boolean
                  limit?: number
                  page?: number
                  sort?: string
                  where?: Where
                }
              | false
          }>
    : never

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Document = any

export type Operation = 'create' | 'delete' | 'read' | 'update'
export type VersionOperations = 'readVersions'
export type AuthOperations = 'unlock'
export type AllOperations = AuthOperations | Operation | VersionOperations

export function docHasTimestamps(doc: any): doc is TypeWithTimestamps {
  return doc?.createdAt && doc?.updatedAt
}

export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N // This is a commonly used trick to detect 'any'
export type IsAny<T> = IfAny<T, true, false>
export type ReplaceAny<T, DefaultType> = IsAny<T> extends true ? DefaultType : T

export type SelectIncludeType = {
  [k: string]: SelectIncludeType | true
}

export type SelectExcludeType = {
  [k: string]: false | SelectExcludeType
}

export type SelectMode = 'exclude' | 'include'

export type SelectType = SelectExcludeType | SelectIncludeType

/**
 * Operations that invoke an entity-level `select` function.
 *
 * Narrower than `HookOperationType`: `select` runs only for read- and
 * write-path operations that materialize a document (`create`, `delete`,
 * `read`, `restoreVersion`, `update`). Operations like `autosave`, `count`,
 * `countVersions`, `forgotPassword`, `login`, `readDistinct`, `refresh`, and
 * `resetPassword` do not invoke `select` and are intentionally excluded.
 */
export type SelectFnOperation = 'create' | 'delete' | 'read' | 'restoreVersion' | 'update'

export type SelectFnArgs = {
  operation: SelectFnOperation
  req: PayloadRequest
  /** The caller's `select` arg, or `undefined` if not provided. */
  select?: SelectType
}

export type SelectFn<TSelect extends SelectType = SelectType> = (
  args: SelectFnArgs,
) => TSelect | undefined

/**
 * Shared shape for the entity-level `select` config used by Collections and Globals.
 * The JSDoc on the `select` property is the single source of truth — pick from this
 * type when defining the config:
 *
 *   & Pick<WithSelectFn<...>, 'select'>
 */
export type WithSelectFn<TSelect extends SelectType = SelectType> = {
  /**
   * Entity-level Select API configuration.
   *
   * A function that receives the current request context (`operation`, `req`,
   * the caller's `select`) and returns the final `select` to apply, replacing
   * the caller's. Return `undefined` to leave the caller's `select` unchanged.
   *
   * Useful to dynamically modify the caller's selection based on the request context:
   *  - Forcing a field to be populated for reference within hooks / access control.
   *  - Differentiating between API requests and admin panel requests, to optimize
   *    the amount of data being queried in each case.
   *
   * Note: per-document data is not available — this runs before the read.
   *
   * @see https://payloadcms.com/docs/queries/select
   */
  select?: SelectFn<TSelect>
}

export type ApplyDisableErrors<T, DisableErrors = false> = false extends DisableErrors
  ? T
  : null | T

export type TransformDataWithSelect<
  Data extends Record<string, any>,
  Select extends SelectType,
> = Select extends never
  ? Data
  : string extends keyof Select
    ? Data
    : // START Handle types when they aren't generated
      // For example in any package in this repository outside of tests / plugins
      // This stil gives us autocomplete when using include select mode, i.e select: {title :true} returns type {title: any, id: string | number}
      string extends keyof Omit<Data, 'id'>
      ? Select extends SelectIncludeType
        ? {
            [K in Data extends TypeWithID ? 'id' | keyof Select : keyof Select]: K extends 'id'
              ? number | string
              : unknown
          }
        : Data
      : // END Handle types when they aren't generated
        // Handle include mode
        Select extends SelectIncludeType
        ? {
            [K in keyof Data as K extends keyof Select
              ? Select[K] extends object | true
                ? K
                : never
              : // select 'id' always
                K extends 'id'
                ? K
                : never]: Data[K]
          }
        : // Handle exclude mode
          {
            [K in keyof Data as K extends keyof Select
              ? Select[K] extends object | undefined
                ? K
                : never
              : K]: Data[K]
          }

export type TransformCollectionWithSelect<
  TSlug extends CollectionSlug,
  TSelect extends SelectType,
> = TSelect extends SelectType
  ? TransformDataWithSelect<DataFromCollectionSlug<TSlug>, TSelect>
  : DataFromCollectionSlug<TSlug>

export type DraftTransformCollectionWithSelect<
  TSlug extends CollectionSlug,
  TSelect extends SelectType,
> = TSelect extends SelectType
  ? TransformDataWithSelect<QueryDraftDataFromCollectionSlug<TSlug>, TSelect>
  : QueryDraftDataFromCollectionSlug<TSlug>

export type TransformGlobalWithSelect<
  TSlug extends GlobalSlug,
  TSelect extends SelectType,
> = TSelect extends SelectType
  ? TransformDataWithSelect<DataFromGlobalSlug<TSlug>, TSelect>
  : DataFromGlobalSlug<TSlug>

export type PopulateType = Partial<TypedCollectionSelect>

export type ResolvedFilterOptions = { [collection: string]: Where }

export type PickPreserveOptional<T, K extends keyof T> = Partial<
  Pick<T, Extract<K, OptionalKeys<T>>>
> &
  Pick<T, Extract<K, RequiredKeys<T>>>

export type MaybePromise<T> = Promise<T> | T

type ExcludeID<T> = Exclude<T, number | string>

type ExcludeObject<T> = Exclude<T, object>

/**
 * A relationship / upload field is generated as `ID | Doc`, and `keyof (ID | Doc)` collapses to
 * `never` because a primitive and a document share no keys. Every generated document interface
 * carries the `__collection` marker when `typescript.typeSafeDepth` is enabled, so `never extends
 * '__collection'` is what distinguishes "this key points at another document" from a plain field.
 */
type HasCollectionType<T> = keyof NonNullable<T> extends '__collection' ? true : false

type IsPolymorphicRelationship<T> = T extends { relationTo: string; value: unknown }
  ? '__collection' extends keyof ExcludeID<T['value']>
    ? true
    : false
  : false

type ApplyDepthOnRelationship<T, Depth extends AllowedDepth> = 0 extends Depth
  ? ExcludeObject<T>
  : ApplyDepthOnObject<ExcludeID<T>, DecrementDepth<Depth>>

type ApplyDepthOnPolyRelationship<T, Depth extends AllowedDepth> = T extends {
  relationTo: string
  value: unknown
}
  ? Prettify<{
      relationTo: T['relationTo']
      value: 0 extends Depth
        ? ExcludeObject<T['value']>
        : ApplyDepthOnObject<ExcludeID<T['value']>, DecrementDepth<Depth>>
    }>
  : T

type ApplyDepthProcessKey<T, Depth extends AllowedDepth> =
  // HAS ONE
  HasCollectionType<T> extends true
    ? ApplyDepthOnRelationship<T, Depth>
    : T extends (infer U)[]
      ? // HAS MANY
        HasCollectionType<U> extends true
        ? ApplyDepthOnRelationship<U, Depth>[]
        : // HAS MANY POLY
          IsPolymorphicRelationship<U> extends true
          ? ApplyDepthOnPolyRelationship<U, Depth>[]
          : // JUST ARRAY / BLOCKS
            ApplyDepthOnObject<U, Depth>[]
      : // HAS ONE POLY
        IsPolymorphicRelationship<T> extends true
        ? ApplyDepthOnPolyRelationship<T, Depth>
        : // OBJECT (NAMED TAB OR GROUP)
          ApplyDepthOnObject<T, Depth>

/**
 * Recurses into object types and leaves everything else (including `null` and `undefined`) alone.
 * The naked `T extends object` check distributes over unions, which is what keeps `Doc | null`
 * nullable, and - unlike `T extends Record<string, unknown>` - it also matches `interface`
 * declarations, which do not get an implicit index signature.
 */
type ApplyDepthOnObject<T, Depth extends AllowedDepth> = T extends object
  ? {
      [K in keyof T]: ApplyDepthProcessKey<T[K], Depth>
    }
  : T

/**
 * Rewrites the relationship, upload and join fields of a generated document type as they are
 * actually returned for the given `depth`. Requires `typescript.typeSafeDepth`.
 */
export type ApplyDepth<T extends object, Depth extends AllowedDepth> = ApplyDepthOnObject<T, Depth>

/**
 * Use this type to support both, `typescript.typeSafeDepth` enabled and disabled.
 * This is not needed to use in an actual project, since you either have it enabled or disabled, use `ApplyDepth` directly.
 * Having this wrapper is preferred over doing this check directly in `ApplyDepth` to:
 * * Preserve hover type output of `payload.find()` to `PaginatedDocs<Post>` instead of `PaginatedDocs<ApplyDepth<Post>>`
 * * With enabled, make hover type output of `payload.find({ depth: 0 })` to `PaginatedDocs<ApplyDepth<Post, 0>>` instead of `PaginatedDocs<{ id : number, ///}>`
 */
export type ApplyDepthInternal<
  T extends object,
  Depth extends AllowedDepth,
> = number extends AllowedDepth ? T : ApplyDepth<T, Depth>
