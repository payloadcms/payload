import type { GeneratedTypes } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document, Where } from '../../../types'
import type { BulkOperationResult } from '../../config/types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import deleteOperation from '../delete'
import deleteByID from '../deleteByID'

export type BaseOptions<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export type ByIDOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
  id: number | string
  where?: never
}

export type ManyOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
  id?: never
  where: Where
}

export type Options<TSlug extends keyof GeneratedTypes['collections']> =
  | ByIDOptions<TSlug>
  | ManyOptions<TSlug>

async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: ByIDOptions<TSlug>,
): Promise<GeneratedTypes['collections'][TSlug]>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: ManyOptions<TSlug>,
): Promise<BulkOperationResult<TSlug>>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]> {
  const {
    id,
    collection: collectionSlug,
    depth,
    overrideAccess = true,
    showHiddenFields,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Delete Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  const args = {
    id,
    collection,
    depth,
    overrideAccess,
    req,
    showHiddenFields,
    where,
  }

  if (options.id) {
    return deleteByID<TSlug>(args)
  }
  return deleteOperation<TSlug>(args)
}

export default deleteLocal
