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
        let hasDependentDocuments = false
        const childDocumentsResult = await req.payload.findByID({
          id: originalDoc.id,
          collection: foldersSlug,
          joins: {
            documentsAndFolders: {
              limit: 100_000_000,
              where: {
                or: [
                  {
                    relationTo: {
                      in: removedCollections,
                    },
                  },
                ],
              },
            },
          },
          overrideAccess: true,
          req,
        })

        hasDependentDocuments = childDocumentsResult.documentsAndFolders.docs.length > 0

        // matches folders that are directly related to the removed collections
        let hasDependentFolders = false
        if (!hasDependentDocuments) {
          const childFoldersResult = await req.payload.find({
            collection: foldersSlug,
            where: {
              and: [
                {
                  folderType: {
                    in: removedCollections,
                  },
                },
                {
                  folder: {
                    equals: originalDoc.id,
                  },
                },
              ],
            },
          })
          hasDependentFolders = childFoldersResult.totalDocs > 0
        }

        if (hasDependentDocuments || hasDependentFolders) {
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
            `The folder "${data.name}" contains ${hasDependentDocuments ? 'documents' : 'folders'} that still belong to the following collections: ${translatedLabels.join(', ')}`,
            400,
          )
        }
        return data
      }
    }
    return data
  }
