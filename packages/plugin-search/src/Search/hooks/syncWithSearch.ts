import type { DocToSync, SearchConfig, SyncWithSearch } from '../../types'

const syncWithSearch: SyncWithSearch = async (args) => {
  const {
    collection,
    doc,
    operation,
    req: { payload },
    req,
    // @ts-expect-error
    searchConfig,
  } = args

  const { id, _status: status, title } = doc || {}

  const { beforeSync, defaultPriorities, deleteDrafts, syncDrafts } = searchConfig as SearchConfig // todo fix SyncWithSearch type, see note in ./types.ts

  const searchCollectionSlug = searchConfig.searchOverrides?.slug || 'search';

  let dataToSave: DocToSync = {
    doc: {
      relationTo: collection,
      value: id,
    },
    title,
  }

  if (typeof beforeSync === 'function') {
    dataToSave = await beforeSync({
      originalDoc: doc,
      payload,
      req,
      searchDoc: dataToSave,
    })
  }

  let defaultPriority = 0
  if (defaultPriorities) {
    const { [collection]: priority } = defaultPriorities

    if (typeof priority === 'function') {
      try {
        defaultPriority = await priority(doc)
      } catch (err: unknown) {
        payload.logger.error(err)
        payload.logger.error(
          `Error gathering default priority for search documents related to ${collection}`,
        )
      }
    } else {
      defaultPriority = priority
    }
  }

  const doSync = syncDrafts || (!syncDrafts && status !== 'draft')

  try {
    if (operation === 'create') {
      if (doSync) {
        await payload.create({
          collection: searchCollectionSlug,
          data: {
            ...dataToSave,
            priority: defaultPriority,
          },
          req,
        })
      }
    }

    if (operation === 'update') {
      try {
        // find the correct doc to sync with
        const searchDocQuery = await payload.find({
          collection: searchCollectionSlug,
          depth: 0,
          req,
          where: {
            'doc.value': {
              equals: id,
            },
          },
        })

        const docs: Array<{
          id: number | string
          priority?: number
        }> = searchDocQuery?.docs || []

        const [foundDoc, ...duplicativeDocs] = docs

        // delete all duplicative search docs (docs that reference the same page)
        // to ensure the same, out-of-date result does not appear twice (where only syncing the first found doc)
        if (duplicativeDocs.length > 0) {
          try {
            const duplicativeDocIDs = duplicativeDocs.map(({ id }) => id)
            await payload.delete({
              collection: searchCollectionSlug,
              req,
              where: { id: { in: duplicativeDocIDs } },
            })
          } catch (err: unknown) {
            payload.logger.error(`Error deleting duplicative search documents.`)
          }
        }

        if (foundDoc) {
          const { id: searchDocID } = foundDoc

          if (doSync) {
            // update the doc normally
            try {
              await payload.update({
                id: searchDocID,
                collection: searchCollectionSlug,
                data: {
                  ...dataToSave,
                  priority: foundDoc.priority || defaultPriority,
                },
                req,
              })
            } catch (err: unknown) {
              payload.logger.error(`Error updating search document.`)
            }
          }
          if (deleteDrafts && status === 'draft') {
            // do not include draft docs in search results, so delete the record
            try {
              await payload.delete({
                id: searchDocID,
                collection: searchCollectionSlug,
                req,
              })
            } catch (err: unknown) {
              payload.logger.error(`Error deleting search document: ${err}`)
            }
          }
        } else if (doSync) {
          try {
            await payload.create({
              collection: searchCollectionSlug,
              data: {
                ...dataToSave,
                priority: defaultPriority,
              },
              req,
            })
          } catch (err: unknown) {
            payload.logger.error(`Error creating search document: ${err}`)
          }
        }
      } catch (err: unknown) {
        payload.logger.error(`Error finding search document: ${err}`)
      }
    }
  } catch (err: unknown) {
    payload.logger.error(
      `Error syncing search document related to ${collection} with id: '${id}': ${err}`,
    )
  }

  return doc
}

export default syncWithSearch
