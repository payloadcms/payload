import type { DeleteFromSearch } from '../../types.js'

export const deleteFromSearch: DeleteFromSearch =
  (pluginConfig) =>
  async ({ id, collection, req: { payload }, req }) => {
    const searchSlug = pluginConfig?.searchOverrides?.slug || 'search'

    try {
      await payload.delete({
        collection: searchSlug,
        depth: 0,
        req,
        where: {
          'doc.relationTo': {
            equals: collection.slug,
          },
          'doc.value': {
            equals: id,
          },
        },
      })
    } catch (err: unknown) {
      payload.logger.error({
        err,
        msg: `Error deleting ${searchSlug} doc.`,
      })
    }
  }
