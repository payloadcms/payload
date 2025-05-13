// @ts-strict-ignore
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { FindOneArgs } from '../database/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import executeAccess from '../auth/executeAccess.js'
import { hasWhereAccessResult } from '../auth/types.js'
import { combineQueries } from '../database/combineQueries.js'
import { Forbidden } from '../errors/Forbidden.js'
import { NotFound } from '../errors/NotFound.js'
import { afterRead } from '../fields/hooks/afterRead/index.js'
import { beforeDuplicate } from '../fields/hooks/beforeDuplicate/index.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { getLatestCollectionVersion } from '../versions/getLatestCollectionVersion.js'

type GetDuplicateDocumentArgs = {
  collectionConfig: SanitizedCollectionConfig
  draftArg?: boolean
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  shouldSaveDraft?: boolean
}
export const getDuplicateDocumentData = async ({
  id,
  collectionConfig,
  draftArg,
  overrideAccess,
  req,
  shouldSaveDraft,
}: GetDuplicateDocumentArgs): Promise<{
  duplicatedFromDoc: JsonObject
  duplicatedFromDocWithLocales: JsonObject
}> => {
  const { payload } = req
  // /////////////////////////////////////
  // Read Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess
    ? await executeAccess({ id, req }, collectionConfig.access.read)
    : true
  const hasWherePolicy = hasWhereAccessResult(accessResults)

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////
  const findOneArgs: FindOneArgs = {
    collection: collectionConfig.slug,
    locale: req.locale,
    req,
    where: combineQueries({ id: { equals: id } }, accessResults),
  }

  let duplicatedFromDocWithLocales = await getLatestCollectionVersion({
    id,
    config: collectionConfig,
    payload,
    query: findOneArgs,
    req,
  })

  if (!duplicatedFromDocWithLocales && !hasWherePolicy) {
    throw new NotFound(req.t)
  }
  if (!duplicatedFromDocWithLocales && hasWherePolicy) {
    throw new Forbidden(req.t)
  }

  // remove the createdAt timestamp and rely on the db to set it
  if ('createdAt' in duplicatedFromDocWithLocales) {
    delete duplicatedFromDocWithLocales.createdAt
  }
  // remove the id and rely on the db to set it
  if ('id' in duplicatedFromDocWithLocales) {
    delete duplicatedFromDocWithLocales.id
  }

  duplicatedFromDocWithLocales = await beforeDuplicate({
    id,
    collection: collectionConfig,
    context: req.context,
    doc: duplicatedFromDocWithLocales,
    overrideAccess,
    req,
  })

  // for version enabled collections, override the current status with draft, unless draft is explicitly set to false
  if (shouldSaveDraft) {
    duplicatedFromDocWithLocales._status = 'draft'
  }

  const duplicatedFromDoc = await afterRead({
    collection: collectionConfig,
    context: req.context,
    depth: 0,
    doc: deepCopyObjectSimple(duplicatedFromDocWithLocales),
    draft: draftArg,
    fallbackLocale: null,
    global: null,
    locale: req.locale,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })

  return { duplicatedFromDoc, duplicatedFromDocWithLocales }
}
