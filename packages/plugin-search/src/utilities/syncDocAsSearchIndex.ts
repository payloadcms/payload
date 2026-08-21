import type { DocToSync, SyncDocArgs } from '../types.js'

export const syncDocAsSearchIndex = async ({
  collection,
  doc,
  locale,
  onSyncError,
  operation,
  pluginConfig,
  req: { payload },
  req,
}: SyncDocArgs) => {
  const { id, _status: status, title } = doc || {}

  const { beforeSync, defaultPriorities, deleteDrafts, searchOverrides, syncDrafts } = pluginConfig

  const searchSlug = searchOverrides?.slug || 'search'

  // Determine sync locale
  const syncLocale = locale || req.locale || undefined

  // A failed search-doc write inside the parent operation's transaction has already
  // aborted that transaction, so the parent (e.g. a publish) will roll back. Swallowing
  // the error would let the parent operation report success for a write that did not
  // persist, so the editor sees a silent revert (#17699). Surface it in that case.
  //
  // The rethrow is scoped to callers that have not opted into handling sync errors
  // themselves: the reindex handler passes `onSyncError` and manages its own transaction
  // and per-collection recovery, so it stays best-effort exactly as before. It is also a
  // no-op when there is no shared transaction to abort. Each error object is logged once,
  // so a rethrow re-caught by an outer handler keeps its original, most specific message.
  const loggedSyncErrors = new WeakSet<object>()
  const handleSyncError = (err: unknown, msg: string) => {
    if (typeof err === 'object' && err !== null) {
      if (!loggedSyncErrors.has(err)) {
        payload.logger.error({ err, msg })
        loggedSyncErrors.add(err)
      }
    } else {
      payload.logger.error({ err, msg })
    }

    if (req.transactionID && !onSyncError) {
      throw err
    }
  }

  if (typeof pluginConfig.skipSync === 'function') {
    try {
      const skipSync = await pluginConfig.skipSync({
        collectionSlug: collection,
        doc,
        locale: syncLocale,
        req,
      })

      if (skipSync) {
        return doc
      }
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: 'Search plugin: Error executing skipSync. Proceeding with sync.',
      })
    }
  }

  let dataToSave: DocToSync = {
    doc: {
      relationTo: collection,
      value: id,
    },
    title,
  }
  const docKeyPrefix = `${collection}:${id}`
  const docKey = req.payload.config.localization ? `${docKeyPrefix}:${syncLocale}` : docKeyPrefix
  const syncedDocsSet = (req.context?.syncedDocsSet as Set<string>) || new Set<string>()

  if (syncedDocsSet.has(docKey)) {
    /*
     * prevents duplicate syncing of documents in the same request
     * this can happen when hooks call `payload.update` within the create lifecycle
     * like the nested-docs plugin does
     */
    return doc
  } else {
    syncedDocsSet.add(docKey)
  }

  req.context.syncedDocsSet = syncedDocsSet

  if (typeof beforeSync === 'function') {
    let docToSyncWith = doc
    if (payload.config?.localization) {
      // Check if document is trashed (has deletedAt field)
      const isTrashDocument = doc && 'deletedAt' in doc && doc.deletedAt

      docToSyncWith = await payload.findByID({
        id,
        collection,
        locale: syncLocale,
        req,
        // Include trashed documents when the document being synced is trashed
        trash: isTrashDocument,
      })
    }
    dataToSave = await beforeSync({
      collectionSlug: collection,
      originalDoc: docToSyncWith,
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
          `Error gathering default priority for ${searchSlug} documents related to ${collection}`,
        )
      }
    } else if (priority !== undefined) {
      defaultPriority = priority
    }
  }

  const doSync = syncDrafts || (!syncDrafts && status !== 'draft')

  try {
    if (operation === 'create' && doSync) {
      await payload.create({
        collection: searchSlug,
        data: {
          ...dataToSave,
          priority: defaultPriority,
        },
        depth: 0,
        locale: syncLocale,
        req,
      })
    }

    if (operation === 'update') {
      try {
        // find the correct doc to sync with
        const searchDocQuery = await payload.find({
          collection: searchSlug,
          depth: 0,
          locale: syncLocale,
          req,
          where: {
            'doc.relationTo': {
              equals: collection,
            },
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
              collection: searchSlug,
              depth: 0,
              req,
              where: { id: { in: duplicativeDocIDs } },
            })
          } catch (err: unknown) {
            handleSyncError(err, `Error deleting duplicative ${searchSlug} documents.`)
          }
        }

        if (foundDoc) {
          const { id: searchDocID } = foundDoc

          // Check if document is trashed and delete from search
          const isTrashDocument = doc && 'deletedAt' in doc && doc.deletedAt

          if (isTrashDocument) {
            try {
              await payload.delete({
                id: searchDocID,
                collection: searchSlug,
                depth: 0,
                req,
              })
            } catch (err: unknown) {
              handleSyncError(err, `Error deleting ${searchSlug} document for trashed doc.`)
            }
          } else {
            if (doSync) {
              // update the doc normally
              try {
                await payload.update({
                  id: searchDocID,
                  collection: searchSlug,
                  data: {
                    ...dataToSave,
                    priority: foundDoc.priority || defaultPriority,
                  },
                  depth: 0,
                  locale: syncLocale,
                  req,
                })
              } catch (err: unknown) {
                handleSyncError(err, `Error updating ${searchSlug} document.`)
              }
            }

            if (deleteDrafts && status === 'draft') {
              // Check to see if there's a published version of the doc
              // We don't want to remove the search doc if there is a published version but a new draft has been created
              const {
                docs: [docWithPublish],
              } = await payload.find({
                collection,
                depth: 0,
                draft: false,
                limit: 1,
                locale: syncLocale,
                pagination: false,
                req,
                where: {
                  and: [
                    {
                      _status: {
                        equals: 'published',
                      },
                    },
                    {
                      id: {
                        equals: id,
                      },
                    },
                  ],
                },
              })

              if (!docWithPublish) {
                // do not include draft docs in search results, so delete the record
                try {
                  await payload.delete({
                    id: searchDocID,
                    collection: searchSlug,
                    depth: 0,
                    req,
                  })
                } catch (err: unknown) {
                  handleSyncError(err, `Error deleting ${searchSlug} document.`)
                }
              }
            }
          }
        } else if (doSync) {
          try {
            await payload.create({
              collection: searchSlug,
              data: {
                ...dataToSave,
                priority: defaultPriority,
              },
              depth: 0,
              locale: syncLocale,
              req,
            })
          } catch (err: unknown) {
            handleSyncError(err, `Error creating ${searchSlug} document.`)
          }
        }
      } catch (err: unknown) {
        handleSyncError(err, `Error finding ${searchSlug} document.`)
      }
    }
  } catch (err: unknown) {
    if (onSyncError) {
      onSyncError()
    }

    handleSyncError(
      err,
      `Error syncing ${searchSlug} document related to ${collection} with id: '${id}'.`,
    )
  }

  return doc
}
