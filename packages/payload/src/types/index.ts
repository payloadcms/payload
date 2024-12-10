import type { I18n, TFunction } from '@payloadcms/translations'
import type DataLoader from 'dataloader'
import type { Prettify } from 'ts-essentials'
import type { URL } from 'url'

import type {
  DataFromCollectionSlug,
  TypeWithID,
  TypeWithTimestamps,
} from '../collections/config/types.js'
import type payload from '../index.js'
import type {
  AllowedDepth,
  CollectionSlug,
  DataFromGlobalSlug,
  DecrementDepth,
  GlobalSlug,
  RequestContext,
  TypedCollectionJoins,
  TypedCollectionSelect,
  TypedLocale,
  TypedUser,
} from '../index.js'
import type { validOperators } from './constants.js'
export type { Payload as Payload } from '../index.js'

export type CustomPayloadRequestProperties = {
  context: RequestContext
  /** The locale that should be used for a field when it is not translated to the requested locale */
  fallbackLocale?: string
  i18n: I18n
  /**
   * The requested locale if specified
   * Only available for localized collections
   */
  locale?: TypedLocale
  /**
   * The payload object
   */
  payload: typeof payload
  /**
   * The context in which the request is being made
   */
  payloadAPI: 'GraphQL' | 'local' | 'REST'
  /** Optimized document loader */
  payloadDataLoader?: DataLoader<string, TypeWithID>
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
  /** Translate function - duplicate of i18n.t */
  t: TFunction
  /**
   * Identifier for the database transaction for interactions in a single, all-or-nothing operation.
   * Can also be used to ensure consistency when multiple operations try to create a transaction concurrently on the same request.
   */
  transactionID?: number | Promise<number | string> | string
  /**
   * Used to ensure consistency when multiple operations try to create a transaction concurrently on the same request
   */
  transactionIDPromise?: Promise<void>
  /** The signed-in user */
  user: null | TypedUser
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
   *  2. import { addDataAndFileToRequest } from '@payloadcms/next/utilities'
   *    `await addDataAndFileToRequest(req)`
   * */
  data?: JsonObject
  /** The file on the request, same rules apply as the `data` property */
  file?: {
    data: Buffer
    mimetype: string
    name: string
    size: number
    tempFilePath?: string
  }
}
export type PayloadRequest = CustomPayloadRequestProperties &
  Partial<Request> &
  PayloadRequestData &
  Required<Pick<Request, 'headers'>>

export type Operator = (typeof validOperators)[number]

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
  and?: Where[]
  or?: Where[]
}

export type Sort = Array<string> | string

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
                  limit?: number
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

export type TransformGlobalWithSelect<
  TSlug extends GlobalSlug,
  TSelect extends SelectType,
> = TSelect extends SelectType
  ? TransformDataWithSelect<DataFromGlobalSlug<TSlug>, TSelect>
  : DataFromGlobalSlug<TSlug>

export type PopulateType = Partial<TypedCollectionSelect>

type ExcludeID<T> = Exclude<T, number | string>

type ExcludeObject<T> = Exclude<T, object>

type HasCollectionType<T> = keyof NonNullable<T> extends '__collection' ? true : false

type TypeIsPolymorphicRelationship<T> =
  T extends Record<string, unknown>
    ? T['relationTo'] extends string
      ? '__collection' extends keyof ExcludeID<T['value']>
        ? true
        : false
      : false
    : false

type ApplyDepthOnRelationship<T, Depth extends AllowedDepth> = 0 extends Depth
  ? ExcludeObject<T>
  : // @ts-expect-error preserve T | null
    ApplyDepth<ExcludeID<T>, DecrementDepth<Depth>>

type ApplyDepthOnPolyRelationship<T, Depth extends AllowedDepth> = Prettify<{
  // @ts-expect-error index checked in TypeIsPolymorphicRelationship
  relationTo: NonNullable<T>['relationTo']
  value: 0 extends Depth
    ? // @ts-expect-error index checked in TypeIsPolymorphicRelationship
      ExcludeObject<NonNullable<T>['value']>
    : // @ts-expect-error index checked in TypeIsPolymorphicRelationship
      ApplyDepth<ExcludeID<NonNullable<T>['value']>, DecrementDepth<Depth>>
}>

type ApplyDepthProcessKey<T, Depth extends AllowedDepth> =
  // HAS ONE
  HasCollectionType<T> extends true
    ? ApplyDepthOnRelationship<T, Depth>
    : T extends (infer U)[]
      ? // HAS MANY
        HasCollectionType<U> extends true
        ? ApplyDepthOnRelationship<U, Depth>[]
        : // HAS MANY POLY
          TypeIsPolymorphicRelationship<U> extends true
          ? (U extends Record<string, unknown> ? ApplyDepthOnPolyRelationship<U, Depth> : U)[]
          : // JUST ARRAY / BLOCKS
            (U extends Record<string, unknown> ? ApplyDepth<U, Depth> : U)[]
      : // HAS ONE POLY
        TypeIsPolymorphicRelationship<T> extends true
        ? T extends Record<string, unknown>
          ? ApplyDepthOnPolyRelationship<T, Depth>
          : T
        : // OBJECT (NAMED TAB OR GROUP)
          T extends Record<string, unknown>
          ? ApplyDepth<T, Depth>
          : T

export type ApplyDepth<T extends object, Depth extends AllowedDepth> = {
  [K in keyof T as K]: ApplyDepthProcessKey<T[K], Depth>
}

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
