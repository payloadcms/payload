import { APIError, type CollectionBeforeValidateHook, type CollectionSlug } from '../../index.js'
import { extractID } from '../../utilities/extractID.js'
import { getTranslatedLabel } from '../../utilities/getTranslatedLabel.js'

export const ensureSafeCollectionsChange =
  ({
    folderFieldName,
    foldersSlug,
    parentFieldName = 'folder',
  }: {
    folderFieldName: string
    foldersSlug: CollectionSlug
    parentFieldName?: string
  }): CollectionBeforeValidateHook =>
  async ({ data, originalDoc, req }) => {
    const currentFolderID = extractID(originalDoc || {})
    const parentFolderID = extractID(
      data?.[parentFieldName] || originalDoc?.[parentFieldName] || {},
    )
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
          folderType

      if (newCollections && newCollections.length > 0) {
        let dependentCollection: null | string = null

        if (typeof currentFolderID === 'string' || typeof currentFolderID === 'number') {
          // Check each collection being removed for dependent documents
          for (const collectionSlug of newCollections) {
            const result = await req.payload.find({
              collection: collectionSlug,
              limit: 1,
              overrideAccess: true,
              req,
              where: {
                [folderFieldName]: { equals: currentFolderID },
              },
            })

            if (result.totalDocs > 0) {
              dependentCollection = collectionSlug
              break
            }
          }

          // Also check for child folders with these types
          if (!dependentCollection) {
            const childFoldersResult = await req.payload.find({
              collection: foldersSlug,
              limit: 1,
              overrideAccess: true,
              req,
              where: {
                and: [
                  { folderType: { in: newCollections } },
                  { [parentFieldName]: { equals: currentFolderID } },
                ],
              },
            })

            if (childFoldersResult.totalDocs > 0) {
              dependentCollection = foldersSlug
            }
          }
        }

        if (dependentCollection) {
          const translatedLabels = newCollections.map((collectionSlug) => {
            if (req.payload.collections[collectionSlug]?.config.labels.singular) {
              return getTranslatedLabel(
                req.payload.collections[collectionSlug]?.config.labels.plural,
                req.i18n,
              )
            }
            return collectionSlug
          })

          const isFolder = dependentCollection === foldersSlug
          throw new APIError(
            `The folder "${data.name || originalDoc.name}" contains ${isFolder ? 'folders' : 'documents'} that still belong to the following collections: ${translatedLabels.join(', ')}`,
            400,
          )
        }

        return data
      }
    } else if (
      (data?.folderType === null ||
        (Array.isArray(data?.folderType) && data?.folderType.length === 0)) &&
      parentFolderID
    ) {
      // attempting to set the folderType to catch-all, so we need to ensure that the parent allows this
      let parentFolder
      if (typeof parentFolderID === 'string' || typeof parentFolderID === 'number') {
        try {
          parentFolder = await req.payload.findByID({
            id: parentFolderID,
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
