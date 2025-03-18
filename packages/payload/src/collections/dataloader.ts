// @ts-strict-ignore
import type { BatchLoadFn } from 'dataloader'

import DataLoader from 'dataloader'

import type { CollectionSlug } from '../index.js'
import type { PayloadRequest, PopulateType, SelectType } from '../types/index.js'
import type { TypeWithID } from './config/types.js'

import { isValidID } from '../utilities/isValidID.js'

const InternalIDSlugCacheKeyMap = Symbol('InternalIDSlugCacheKeyMap')

const getInternalIDSlugCacheKeyMap = (req: PayloadRequest): Map<string, string[]> => {
  return req.payloadDataLoader[InternalIDSlugCacheKeyMap]
}

// Payload uses `dataloader` to solve the classic GraphQL N+1 problem.

// We keep a list of all documents requested to be populated for any given request
// and then batch together documents within the same collection,
// making only 1 find per each collection, rather than `findByID` per each requested doc.

// This dramatically improves performance for REST and Local API `depth` populations,
// and also ensures complex GraphQL queries perform lightning-fast.

const batchAndLoadDocs =
  (req: PayloadRequest): BatchLoadFn<string, TypeWithID> =>
  async (keys: string[]): Promise<TypeWithID[]> => {
    const { payload } = req

    // Create docs array of same length as keys, using null as value
    // We will replace nulls with injected docs as they are retrieved
    const docs: (null | TypeWithID)[] = keys.map(() => null)

    /**
    * Batch IDs by their `find` args
    * so we can make one find query per combination of collection, depth, locale, and fallbackLocale.
    *
    * Resulting shape will be as follows:
      {
        // key is stringified set of find args
        '[null,"pages",2,0,"es","en",false,false]': [
          // value is array of IDs to find with these args
          'q34tl23462346234524',
          '435523540194324280',
          '2346245j35l3j5234532li',
        ],
        // etc
      };
    *
    **/

    const batchByFindArgs = {}

    for (const key of keys) {
      const [
        transactionID,
        collection,
        id,
        depth,
        currentDepth,
        locale,
        fallbackLocale,
        overrideAccess,
        showHiddenFields,
        draft,
        select,
        populate,
      ] = JSON.parse(key)

      const batchKeyArray = [
        transactionID,
        collection,
        depth,
        currentDepth,
        locale,
        fallbackLocale,
        overrideAccess,
        showHiddenFields,
        draft,
        select,
        populate,
      ]

      const batchKey = JSON.stringify(batchKeyArray)

      const idType = payload.collections?.[collection].customIDType || payload.db.defaultIDType
      const sanitizedID = idType === 'number' ? parseFloat(id) : id

      if (isValidID(sanitizedID, idType)) {
        batchByFindArgs[batchKey] = [...(batchByFindArgs[batchKey] || []), sanitizedID]
      }
    }

    // Run find requests one after another, so as to not hang transactions

    for (const [batchKey, ids] of Object.entries(batchByFindArgs)) {
      const [
        transactionID,
        collection,
        depth,
        currentDepth,
        locale,
        fallbackLocale,
        overrideAccess,
        showHiddenFields,
        draft,
        select,
        populate,
      ] = JSON.parse(batchKey)

      req.transactionID = transactionID

      const result = await payload.find({
        collection,
        currentDepth,
        depth,
        disableErrors: true,
        draft,
        fallbackLocale,
        locale,
        overrideAccess: Boolean(overrideAccess),
        pagination: false,
        populate,
        req,
        select,
        showHiddenFields: Boolean(showHiddenFields),
        where: {
          id: {
            in: ids,
          },
        },
      })

      // For each returned doc, find index in original keys
      // Inject doc within docs array if index exists
      for (const doc of result.docs) {
        const docKey = createDataloaderCacheKey({
          collectionSlug: collection,
          currentDepth,
          depth,
          docID: doc.id,
          draft,
          fallbackLocale,
          locale,
          overrideAccess,
          populate,
          select,
          showHiddenFields,
          transactionID: req.transactionID,
        })
        const docsIndex = keys.findIndex((key) => key === docKey)

        const map = getInternalIDSlugCacheKeyMap(req)
        let items = map.get(`${doc.id}-${collection}`)
        if (!items) {
          items = []
          map.set(`${doc.id}-${collection}`, items)
        }
        items.push(docKey)

        if (docsIndex > -1) {
          docs[docsIndex] = doc
        }
      }
    }

    // Return docs array,
    // which has now been injected with all fetched docs
    // and should match the length of the incoming keys arg
    return docs
  }

export const getDataLoader = (req: PayloadRequest): DataLoader<string, TypeWithID> => {
  const dataLoader = new DataLoader(batchAndLoadDocs(req))
  dataLoader[InternalIDSlugCacheKeyMap] = new Map()

  return dataLoader
}

type CreateCacheKeyArgs = {
  collectionSlug: string
  currentDepth: number
  depth: number
  docID: number | string
  draft: boolean
  fallbackLocale: string
  locale: string
  overrideAccess: boolean
  populate?: PopulateType
  select?: SelectType
  showHiddenFields: boolean
  transactionID: number | Promise<number | string> | string
}
export const createDataloaderCacheKey = ({
  collectionSlug,
  currentDepth,
  depth,
  docID,
  draft,
  fallbackLocale,
  locale,
  overrideAccess,
  populate,
  select,
  showHiddenFields,
  transactionID,
}: CreateCacheKeyArgs): string =>
  JSON.stringify([
    transactionID,
    collectionSlug,
    docID,
    depth,
    currentDepth,
    locale,
    fallbackLocale,
    overrideAccess,
    showHiddenFields,
    draft,
    select,
    populate,
  ])

export const invalidateDocumentInDataloader = ({
  id,
  collectionSlug,
  req,
}: {
  collectionSlug: CollectionSlug
  id: number | string
  req: PayloadRequest
}) => {
  if (!req.payloadDataLoader) {
    return
  }

  const cacheKeyMap = getInternalIDSlugCacheKeyMap(req)
  const keys = cacheKeyMap.get(`${id}-${collectionSlug}`)

  if (!keys) {
    return
  }

  for (const key of keys) {
    req.payloadDataLoader.clear(key)
  }

  cacheKeyMap.delete(`${id}-${collectionSlug}`)
}
