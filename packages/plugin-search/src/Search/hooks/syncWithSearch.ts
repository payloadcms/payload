import type { SearchConfig, SyncWithSearch } from '../../types'

const syncWithSearch: SyncWithSearch = async (args) => {
  const {
    doc,
    operation,
    req: { payload },
    // @ts-expect-error
    collection,
    // @ts-expect-error
    searchConfig,
  } = args

  const { id, _status: status, title } = doc || {}

  const { beforeSync, defaultPriorities, deleteDrafts, syncDrafts } = searchConfig as SearchConfig // todo fix SyncWithSearch type, see note in ./types.ts

  let dataToSave = {
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
        payload.create({
          collection: 'search',
          data: {
            ...dataToSave,
            priority: defaultPriority,
          },
        })
      }
    }

    if (operation === 'update') {
      try {
        // find the correct doc to sync with
        const searchDocQuery = await payload.find({
          collection: 'search',
          depth: 0,
          where: {
            'doc.value': {
              equals: id,
            },
          },
        })

        const docs: Array<{
          id: string
          priority?: number
        }> = searchDocQuery?.docs || []

        const [foundDoc, ...duplicativeDocs] = docs

        // delete all duplicative search docs (docs that reference the same page)
        // to ensure the same, out-of-date result does not appear twice (where only syncing the first found doc)
        if (duplicativeDocs.length > 0) {
          try {
            Promise.all(
              duplicativeDocs.map(({ id: duplicativeDocID }) =>
                payload.delete({
                  id: duplicativeDocID,
                  collection: 'search',
                }),
              ), // eslint-disable-line function-paren-newline
            )
          } catch (err: unknown) {
            payload.logger.error(`Error deleting duplicative search documents.`)
          }
        }

        if (foundDoc) {
          const { id: searchDocID } = foundDoc

          if (doSync) {
            // update the doc normally
            try {
              payload.update({
                id: searchDocID,
                collection: 'search',
                data: {
                  ...dataToSave,
                  priority: foundDoc.priority || defaultPriority,
                },
              })
            } catch (err: unknown) {
              payload.logger.error(`Error updating search document.`)
            }
          }
          if (deleteDrafts && status === 'draft') {
            // do not include draft docs in search results, so delete the record
            try {
              payload.delete({
                id: searchDocID,
                collection: 'search',
              })
            } catch (err: unknown) {
              payload.logger.error(`Error deleting search document: ${err}`)
            }
          }
        } else if (doSync) {
          try {
            payload.create({
              collection: 'search',
              data: {
                ...dataToSave,
                priority: defaultPriority,
              },
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
