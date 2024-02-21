import { DeleteFromSearch } from '../../types'

const deleteFromSearch: DeleteFromSearch = async ({ doc, req: { payload }, req, searchConfig }) => {
  const searchCollectionSlug = searchConfig.searchOverrides?.slug || 'search';

  try {
    const searchDocQuery = await payload.find({
      collection: searchCollectionSlug,
      depth: 0,
      req,
      where: {
        'doc.value': {
          equals: doc.id,
        },
      },
    })

    if (searchDocQuery?.docs?.[0]) {
      await payload.delete({
        id: searchDocQuery?.docs?.[0]?.id,
        collection: searchCollectionSlug,
        req,
      })
    }
  } catch (err: unknown) {
    payload.logger.error({
      err: `Error deleting search doc: ${err}`,
    })
  }

  return doc
}

export default deleteFromSearch
