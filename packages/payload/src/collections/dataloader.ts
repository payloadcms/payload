import type { BatchLoadFn } from 'dataloader'

import DataLoader from 'dataloader'

import type { PayloadRequest, SelectType } from '../types/index.js'
import type { TypeWithID } from './config/types.js'

import { isValidID } from '../utilities/isValidID.js'

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

    const batchByFindArgs = keys.reduce((batches, key) => {
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
      ]

      const batchKey = JSON.stringify(batchKeyArray)

      const idType = payload.collections?.[collection].customIDType || payload.db.defaultIDType

      let sanitizedID: number | string = id

      if (idType === 'number') {
        sanitizedID = parseFloat(id)
      }

      if (isValidID(sanitizedID, idType)) {
        return {
          ...batches,
          [batchKey]: [...(batches[batchKey] || []), sanitizedID],
        }
      }
      return batches
    }, {})

    // Run find requests one after another, so as to not hang transactions

    await Object.entries(batchByFindArgs).reduce(async (priorFind, [batchKey, ids]) => {
      await priorFind

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

      result.docs.forEach((doc) => {
        const docKey = createDataloaderCacheKey({
          collectionSlug: collection,
          currentDepth,
          depth,
          docID: doc.id,
          draft,
          fallbackLocale,
          locale,
          overrideAccess,
          select,
          showHiddenFields,
          transactionID: req.transactionID,
        })
        const docsIndex = keys.findIndex((key) => key === docKey)

        if (docsIndex > -1) {
          docs[docsIndex] = doc
        }
      })
    }, Promise.resolve())

    // Return docs array,
    // which has now been injected with all fetched docs
    // and should match the length of the incoming keys arg
    return docs
  }

export const getDataLoader = (req: PayloadRequest) => new DataLoader(batchAndLoadDocs(req))

type CreateCacheKeyArgs = {
  collectionSlug: string
  currentDepth: number
  depth: number
  docID: number | string
  draft: boolean
  fallbackLocale: string
  locale: string
  overrideAccess: boolean
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
  ])
