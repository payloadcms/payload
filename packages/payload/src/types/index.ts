// @ts-strict-ignore
import type { I18n, TFunction } from '@payloadcms/translations'
import type DataLoader from 'dataloader'
import type { URL } from 'url'

import type {
  DataFromCollectionSlug,
  TypeWithID,
  TypeWithTimestamps,
} from '../collections/config/types.js'
import type payload from '../index.js'
import type {
  CollectionSlug,
  DataFromGlobalSlug,
  GlobalSlug,
  Payload,
  RequestContext,
  TypedCollectionJoins,
  TypedCollectionSelect,
  TypedLocale,
  TypedUser,
} from '../index.js'
import type { Operator } from './constants.js'
export type { Payload } from '../index.js'

export type CustomPayloadRequestProperties = {
  context: RequestContext
  /** The locale that should be used for a field when it is not translated to the requested locale */
  fallbackLocale?: string
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
  payloadAPI: 'GraphQL' | 'local' | 'REST'
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
  /** Translate function - duplicate of i18n.t */
  t: TFunction
  /**
   * Identifier for the database transaction for interactions in a single, all-or-nothing operation.
   * Can also be used to ensure consistency when multiple operations try to create a transaction concurrently on the same request.
   */
  transactionID?: number | Promise<number | string> | string
  /**
   * Used to ensure consistency when multiple operations try to create a transaction concurrently on the same request
   * @deprecated This is not used anywhere, instead `transactionID` is used for the above. Will be removed in next major version.
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
   *  2. import { addDataAndFileToRequest } from 'payload'
   *    `await addDataAndFileToRequest(req)`
   * */
  data?: JsonObject
  /** The file on the request, same rules apply as the `data` property */
  file?: {
    /**
     * Context of the file when it was uploaded via client side.
     */
    clientUploadContext?: unknown
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
  and?: Where[]
  or?: Where[]
}

export type Sort = Array<string> | string

type SerializableValue = boolean | number | object | string
export type DefaultValue =
  | ((args: {
      locale?: TypedLocale
      req: PayloadRequest
      user: PayloadRequest['user']
    }) => SerializableValue)
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

export type ResolvedFilterOptions = { [collection: string]: Where }
