import type {
  CollectionSlug,
  DefaultDocumentIDType,
  GlobalSlug,
  PayloadRequest,
} from '../../../index.js'

/**
 * This is a cross-entity way to count the number of versions for any given document.
 * It will work for both collections and globals.
 * @returns number of versions
 */
export const countVersions = async (args: {
  collectionSlug?: CollectionSlug
  globalSlug?: GlobalSlug
  parentID?: DefaultDocumentIDType
  req: PayloadRequest
}): Promise<number> => {
  const { collectionSlug, globalSlug, parentID, req } = args

  let countFn

  if (collectionSlug) {
    countFn = () =>
      req.payload.countVersions({
        collection: collectionSlug,
        where: {
          parent: {
            equals: parentID,
          },
        },
      })
  }

  if (globalSlug) {
    countFn = () =>
      req.payload.countGlobalVersions({
        global: globalSlug,
      })
  }

  const res = countFn ? (await countFn()?.then((res) => res.totalDocs || 0)) || 0 : 0

  return res
}
