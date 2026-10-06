import { hasDraftsEnabled } from 'payload'

import type { DocToSync, SyncDocArgs } from '../types.js'

import { clearLocalizedSearchData } from './clearLocalizedSearchData.js'

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
  const { id, _status, title } = doc || {}

  const { beforeSync, defaultPriorities, deleteDrafts, searchOverrides, syncDrafts } = pluginConfig

  const searchSlug = searchOverrides?.slug || 'search'

  // Determine sync locale
  const syncLocale = locale || req.locale || undefined

  if (payload.config.localization && (syncLocale === 'all' || syncLocale === '*')) {
    for (const localeCode of payload.config.localization.localeCodes) {
      await syncDocAsSearchIndex({
        collection,
        data: doc,
        doc,
        locale: localeCode,
        onSyncError,
        operation: 'update',
        pluginConfig,
        req,
      })
    }

    return doc
  }

  const status = _status && typeof _status === 'object' ? _status[syncLocale!] : _status

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

  const doSync = syncDrafts || status !== 'draft'
  let docToSyncWith = doc

  if (doSync && payload.config.localization) {
    // Check if document is trashed (has deletedAt field)
    const isTrashDocument = doc && 'deletedAt' in doc && doc.deletedAt

    docToSyncWith = await payload.findByID({
      id,
      collection,
      disableErrors: true,
      locale: syncLocale,
      overrideAccess: true,
      req,
      // Include trashed documents when the document being synced is trashed
      trash: isTrashDocument,
      version:
        syncDrafts && hasDraftsEnabled(payload.collections[collection]!.config)
          ? 'latest'
          : 'published',
    })

    if (!docToSyncWith) {
      return doc
    }

    dataToSave.title = docToSyncWith.title
  }

  if (typeof pluginConfig.skipSync === 'function') {
    try {
      const skipSync = await pluginConfig.skipSync({
        collectionSlug: collection,
        doc: docToSyncWith,
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

  if (doSync && typeof beforeSync === 'function') {
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
        defaultPriority = await priority(docToSyncWith)
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
        overrideAccess: true,
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
          overrideAccess: true,
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
              overrideAccess: true,
              req,
              where: { id: { in: duplicativeDocIDs } },
            })
          } catch (err: unknown) {
            payload.logger.error({
              err,
              msg: `Error deleting duplicative ${searchSlug} documents.`,
            })
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
                overrideAccess: true,
                req,
              })
            } catch (err: unknown) {
              payload.logger.error({
                err,
                msg: `Error deleting ${searchSlug} document for trashed doc.`,
              })
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
                  overrideAccess: true,
                  req,
                })
              } catch (err: unknown) {
                payload.logger.error({ err, msg: `Error updating ${searchSlug} document.` })
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
                limit: 1,
                locale: payload.config.localization ? 'all' : syncLocale,
                overrideAccess: true,
                pagination: false,
                req,
                version: 'published',
                where: {
                  id: { equals: id },
                },
              })

              if (!docWithPublish) {
                // do not include draft docs in search results, so delete the record
                try {
                  await payload.delete({
                    id: searchDocID,
                    collection: searchSlug,
                    depth: 0,
                    overrideAccess: true,
                    req,
                  })
                } catch (err: unknown) {
                  payload.logger.error({ err, msg: `Error deleting ${searchSlug} document.` })
                }
              } else if (
                payload.config.localization &&
                syncLocale &&
                typeof docWithPublish._status === 'object' &&
                docWithPublish._status[syncLocale] !== 'published'
              ) {
                const searchDoc = await payload.db.findOne({
                  collection: searchSlug,
                  locale: 'all',
                  req,
                  where: { id: { equals: searchDocID } },
                })

                if (!searchDoc) {
                  return doc
                }

                // Unpublishing must also clear required index fields without validating empty content.
                await payload.db.updateOne({
                  id: searchDocID,
                  collection: searchSlug,
                  data: clearLocalizedSearchData({
                    blocks: payload.config.blocks,
                    data: searchDoc,
                    fields: payload.collections[searchSlug]!.config.flattenedFields,
                    locale: syncLocale,
                  }),
                  req,
                })
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
              overrideAccess: true,
              req,
            })
          } catch (err: unknown) {
            payload.logger.error({ err, msg: `Error creating ${searchSlug} document.` })
          }
        }
      } catch (err: unknown) {
        payload.logger.error({ err, msg: `Error finding ${searchSlug} document.` })
      }
    }
  } catch (err: unknown) {
    payload.logger.error({
      err,
      msg: `Error syncing ${searchSlug} document related to ${collection} with id: '${id}'.`,
    })

    if (onSyncError) {
      onSyncError()
    }
  }

  return doc
}
