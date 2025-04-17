import type { CollectionAfterChangeHook } from '../../index.js'

import { extractID } from '../../utilities/extractID.js'

/**
 * Determines if a child folder belongs to a parent folder by
 * recursively checking upwards through the folder hierarchy.
 */
async function isChildOfFolder({ folderID, parentFolderFieldName, parentIDToFind, payload }) {
  const parentFolder = await payload.findByID({
    id: folderID,
    collection: payload.config.folders.slug,
  })

  const parentFolderID = parentFolder[parentFolderFieldName]
    ? extractID(parentFolder[parentFolderFieldName])
    : null

  if (!parentFolderID) {
    // made it to the root
    return false
  }

  if (parentFolderID === parentIDToFind) {
    // found match, would be cyclic
    return true
  }

  return isChildOfFolder({
    folderID: parentFolderID,
    parentFolderFieldName,
    parentIDToFind,
    payload,
  })
}

/**
 * If a parent is moved into a child folder, we need to re-parent the child
 * 
 * @example
 * 
 * ```ts
    → F1
      → F2
        → F2A
      → F3

  Moving F1 → F2A becomes:

    → F2A
      → F1
        → F2
        → F3
  ```
 */
export const reparentChildFolder = ({
  parentFolderFieldName,
}: {
  parentFolderFieldName: string
}): CollectionAfterChangeHook => {
  return async ({ doc, previousDoc, req }) => {
    if (
      previousDoc[parentFolderFieldName] !== doc[parentFolderFieldName] &&
      doc[parentFolderFieldName]
    ) {
      const newParentFolderID = extractID(doc[parentFolderFieldName])
      const isMovingToChild = await isChildOfFolder({
        folderID: newParentFolderID,
        parentFolderFieldName,
        parentIDToFind: doc.id,
        payload: req.payload,
      })

      if (isMovingToChild) {
        // if the folder was moved into a child folder, the child folder needs
        // to be re-parented with the parent of the folder that was moved
        await req.payload.update({
          id: newParentFolderID,
          collection: req.payload.config.folders.slug,
          data: {
            [parentFolderFieldName]: previousDoc[parentFolderFieldName]
              ? extractID(previousDoc[parentFolderFieldName])
              : null,
          },
          req,
        })
      }
    }
  }
}
