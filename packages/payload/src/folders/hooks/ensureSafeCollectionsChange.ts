import { APIError, type CollectionBeforeValidateHook, type CollectionSlug } from '../../index.js'
import { extractID } from '../../utilities/extractID.js'
import { getTranslatedLabel } from '../../utilities/getTranslatedLabel.js'

export const ensureSafeCollectionsChange =
  ({ foldersSlug }: { foldersSlug: CollectionSlug }): CollectionBeforeValidateHook =>
  async ({ data, originalDoc, req }) => {
    if (Array.isArray(data?.folderType) && data.folderType.length > 0) {
      const folderType = data.folderType as string[]
      const currentlyAssignedCollections: string[] | undefined =
        Array.isArray(originalDoc?.folderType) && originalDoc.folderType.length > 0
          ? originalDoc.folderType
          : undefined
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
      const newCollections = currentlyAssignedCollections
        ? // user is narrowing the current scope of the folder
          currentlyAssignedCollections.filter((c) => !folderType.includes(c))
        : // user is adding a scope to the folder
          data.folderType

      if (newCollections && newCollections.length > 0) {
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
                      in: newCollections,
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
                    in: newCollections,
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
          const translatedLabels = newCollections.map((collectionSlug) => {
            if (req.payload.collections[collectionSlug]?.config.labels.singular) {
              return getTranslatedLabel(
                req.payload.collections[collectionSlug]?.config.labels.plural,
                req.i18n,
              )
            }
            return collectionSlug
          })

          throw new APIError(
            `The folder "${data.name || originalDoc.name}" contains ${hasDependentDocuments ? 'documents' : 'folders'} that still belong to the following collections: ${translatedLabels.join(', ')}`,
            400,
          )
        }
        return data
      }
    } else if (
      (data?.folderType === null ||
        (Array.isArray(data?.folderType) && data?.folderType.length === 0)) &&
      originalDoc.folder &&
      data?.folder !== null
    ) {
      // attempting to set the folderType to catch-all, so we need to ensure that the parent allows this
      let parentFolder
      try {
        parentFolder = await req.payload.findByID({
          id: extractID(data?.folder || originalDoc.folder),
          collection: foldersSlug,
          overrideAccess: true,
          req,
          select: {
            name: true,
            folderType: true,
          },
          user: req.user,
        })
      } catch (_) {
        // parent folder does not exist
      }

      if (
        parentFolder &&
        parentFolder?.folderType &&
        Array.isArray(parentFolder.folderType) &&
        parentFolder.folderType.length > 0
      ) {
        throw new APIError(
          `The folder "${data?.name || originalDoc.name}" must have folder-type set since its parent folder ${parentFolder?.name ? `"${parentFolder?.name}" ` : ''}has a folder-type set.`,
          400,
        )
      }
    }

    return data
  }
