import type { DeleteFromSearch } from '../../types.js'

export const deleteFromSearch: DeleteFromSearch = async ({
  collection,
  doc,
  pluginConfig,
  req: { payload },
  req,
}) => {
  const searchSlug = pluginConfig?.searchOverrides?.slug || 'search'
  try {
    const searchDocQuery = await payload.find({
      collection: searchSlug,
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        doc: {
          equals: {
            relationTo: collection.slug,
            value: doc.id,
          },
        },
      },
    })

    if (searchDocQuery?.docs?.[0]) {
      await payload.delete({
        id: searchDocQuery?.docs?.[0]?.id,
        collection: searchSlug,
        req,
      })
    }
  } catch (err: unknown) {
    payload.logger.error({
      err,
      msg: `Error deleting ${searchSlug} doc.`,
    })
  }

  return doc
}
