import { APIError, type CollectionBeforeValidateHook, type CollectionSlug } from '../../index.js'
import { getTranslatedLabel } from '../../utilities/getTranslatedLabel.js'

export const ensureSafeCollectionsChange =
  ({ foldersSlug }: { foldersSlug: CollectionSlug }): CollectionBeforeValidateHook =>
  async ({ data, originalDoc, req }) => {
    if (data?.folderType) {
      const folderType = data.folderType as string[]
      const originalAssignedCollections = originalDoc?.folderType as string[] | undefined
      /**
       * Check if the assigned collections have changed.
       * example:
       * - originalAssignedCollections: ['posts', 'pages']
       * - folderType: ['posts']
       *
       * The user is narrowing the types of documents that can be associated with this folder.
       * If the user is only expanding the types of documents that can be associated with this folder,
       * we do not need to do anything.
       */
      const removedCollections = originalAssignedCollections
        ? originalAssignedCollections.filter((c) => !folderType.includes(c))
        : undefined

      if (removedCollections && removedCollections.length > 0) {
        const result = await req.payload.findByID({
          id: originalDoc.id,
          collection: foldersSlug,
          depth: 0,
          joins: {
            documentsAndFolders: {
              limit: 100_000_000,
              where: {
                or: [
                  // matches documents that are directly related to the removed collections
                  {
                    relationTo: {
                      in: removedCollections,
                    },
                  },
                  // matches folders that are directly related to the removed collections
                  {
                    and: [
                      {
                        relationTo: {
                          equals: foldersSlug,
                        },
                      },
                      {
                        'folder.folderType': {
                          in: removedCollections,
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
          req,
        })

        if (result.documentsAndFolders.docs.length > 0) {
          const translatedLabels = removedCollections.map((collectionSlug) => {
            if (req.payload.collections[collectionSlug]?.config.labels.singular) {
              return getTranslatedLabel(
                req.payload.collections[collectionSlug]?.config.labels.plural,
                req.i18n,
              )
            }
            return collectionSlug
          })

          throw new APIError(
            `The folder "${data.name}" contains documents that still belong to the following collections: ${translatedLabels.join(', ')}`,
            400,
          )
        }
        return data
      }
    }
    return data
  }
