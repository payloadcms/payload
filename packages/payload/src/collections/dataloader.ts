import type { BatchLoadFn } from 'dataloader'

import DataLoader from 'dataloader'

import type { PayloadRequest } from '../express/types'
import type { TypeWithID } from './config/types'

import { fieldAffectsData } from '../fields/config/types'
import { getIDType } from '../utilities/getIDType'
import { isValidID } from '../utilities/isValidID'

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
    const docs: (TypeWithID | null)[] = keys.map(() => null)

    // Batch IDs by their `find` args
    // so we can make one find query per combination of collection, depth, locale, and fallbackLocale.

    // Resulting shape will be as follows:

    // {
    //   // key is stringified set of find args
    //   '[null,"pages",2,0,"es","en",false,false]': [
    //     // value is array of IDs to find with these args
    //     'q34tl23462346234524',
    //     '435523540194324280',
    //     '2346245j35l3j5234532li',
    //   ],
    //   // etc
    // };

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
      ]

      const batchKey = JSON.stringify(batchKeyArray)

      const idField = payload.collections?.[collection].config.fields.find(
        (field) => fieldAffectsData(field) && field.name === 'id',
      )

      let sanitizedID: number | string = id

      if (idField?.type === 'number') sanitizedID = parseFloat(id)

      if (isValidID(sanitizedID, getIDType(idField, payload?.db?.defaultIDType))) {
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
        const docKey = JSON.stringify([
          req.transactionID,
          collection,
          doc.id,
          depth,
          currentDepth,
          locale,
          fallbackLocale,
          overrideAccess,
          showHiddenFields,
          draft,
        ])
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
