import type {
  CollectionSlug,
  DefaultDocumentIDType,
  GlobalSlug,
  PayloadRequest,
  Where,
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

  const where: Where = {
    parent: {
      equals: parentID,
    },
  }

  if (collectionSlug) {
    countFn = () =>
      req.payload.countVersions({
        collection: collectionSlug,
        depth: 0,
        where,
      })
  }

  if (globalSlug) {
    countFn = () =>
      req.payload.countGlobalVersions({
        depth: 0,
        global: globalSlug,
        where,
      })
  }

  const res = countFn ? (await countFn()?.then((res) => res.totalDocs || 0)) || 0 : 0

  return res
}
