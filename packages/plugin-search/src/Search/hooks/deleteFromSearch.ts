import type { CollectionAfterDeleteHook } from 'payload/types'

const deleteFromSearch: CollectionAfterDeleteHook = ({ req: { payload }, doc }) => {
  try {
    const deleteSearchDoc = async (): Promise<any> => {
      const searchDocQuery = await payload.find({
        collection: 'search',
        where: {
          'doc.value': {
            equals: doc.id,
          },
        },
        depth: 0,
      })

      if (searchDocQuery?.docs?.[0]) {
        payload.delete({
          collection: 'search',
          id: searchDocQuery?.docs?.[0]?.id,
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
