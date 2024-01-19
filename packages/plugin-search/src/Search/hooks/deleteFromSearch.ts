import type { CollectionAfterDeleteHook } from 'payload/types'

const deleteFromSearch: CollectionAfterDeleteHook = ({ doc, req: { payload }, searchConfig }) => {
  const searchCollectionSlug = searchConfig.searchOverrides?.slug || 'search';

  try {
    const deleteSearchDoc = async (): Promise<any> => {
      const searchDocQuery = await payload.find({
        collection: searchCollectionSlug,
        depth: 0,
        where: {
          'doc.value': {
            equals: doc.id,
          },
        },
      })

      if (searchDocQuery?.docs?.[0]) {
        payload.delete({
          id: searchDocQuery?.docs?.[0]?.id,
          collection: searchCollectionSlug,
        })
      }
    }

    deleteSearchDoc()
  } catch (err: unknown) {
    payload.logger.error({
      err: `Error deleting search doc: ${err}`,
    })
  }

  return doc
}

export default deleteFromSearch
