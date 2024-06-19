import type DataLoader from 'dataloader'
import type { Request } from 'express'
import type { UploadedFile } from 'express-fileupload'
import type { i18n as Ii18n, TFunction } from 'i18next'

import type { User } from '../auth/types'
import type { Collection, TypeWithID } from '../collections/config/types'
import type { FindOneArgs } from '../database/types'
import type { Payload } from '../payload'

/** Express request with some Payload related context added */
export declare type PayloadRequest<U = any> = Request & {
  /** Information about the collection that is being accessed
   * - Configuration from payload-config.ts
   * - MongoDB model for this collection
   * - GraphQL type metadata
   */
  collection?: Collection
  /** context allows you to pass your own data to the request object as context
   * This is useful for, for example, passing data from a beforeChange hook to an afterChange hook.
   * payoadContext can also be fully typed using declare module
   * {@link https://payloadcms.com/docs/hooks/context More info in the Payload Documentation}.
   */
  context: RequestContext
  /** The locale that should be used for a field when it is not translated to the requested locale */
  fallbackLocale?: string
  /** Uploaded files */
  files?: {
    /**
     * This is the file that Payload will use for the file upload, other files are ignored.
     *
     */
    file: UploadedFile
  }
  /** Cache of documents related to the current request */
  findByID?: {
    [transactionID: string]: {
      [slug: string]: (q: FindOneArgs) => Promise<TypeWithID>
    }
  }
  /** I18next instance */
  i18n: Ii18n
  /**
   * The requested locale if specified
   * Only available for localised collections
   */
  locale?: string
  /** The global payload object */
  payload: Payload
  /** What triggered this request */
  payloadAPI?: 'GraphQL' | 'REST' | 'local'
  /** Optimized document loader */
  payloadDataLoader: DataLoader<string, TypeWithID>
  /** Resized versions of the image that was uploaded during this request */
  payloadUploadSizes?: Record<string, Buffer>
  /** Get a translation for the admin screen */
  t: TFunction
  /**
   * Identifier for the database transaction for interactions in a single, all-or-nothing operation.
   * Can also be used to ensure consistency when multiple operations try to create a transaction concurrently on the same request.
   */
  transactionID?: number | string | Promise<number | string>
  /** The signed in user */
  user: (U & User) | null
}

export interface RequestContext {
  [key: string]: unknown
}
