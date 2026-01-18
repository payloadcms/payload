import { extractID } from '../../utilities/extractID.js';
/**
 * Determines if a child folder belongs to a parent folder by
 * recursively checking upwards through the folder hierarchy.
 */ async function isChildOfFolder({ folderCollectionSlug, folderFieldName, folderID, parentIDToFind, payload }) {
    const parentFolder = await payload.findByID({
        id: folderID,
        collection: folderCollectionSlug
    });
    const parentFolderID = parentFolder[folderFieldName] ? extractID(parentFolder[folderFieldName]) : undefined;
    if (!parentFolderID) {
        // made it to the root
        return false;
    }
    if (parentFolderID === parentIDToFind) {
        // found match, would be cyclic
        return true;
    }
    return isChildOfFolder({
        folderCollectionSlug,
        folderFieldName,
        folderID: parentFolderID,
        parentIDToFind,
        payload
    });
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
 */ export const reparentChildFolder = ({ folderFieldName })=>{
    return async ({ doc, previousDoc, req })=>{
        if (previousDoc[folderFieldName] !== doc[folderFieldName] && doc[folderFieldName] && req.payload.config.folders) {
            const newParentFolderID = extractID(doc[folderFieldName]);
            const isMovingToChild = newParentFolderID ? await isChildOfFolder({
                folderCollectionSlug: req.payload.config.folders.slug,
                folderFieldName,
                folderID: newParentFolderID,
                parentIDToFind: doc.id,
                payload: req.payload
            }) : false;
            if (isMovingToChild) {
                // if the folder was moved into a child folder, the child folder needs
                // to be re-parented with the parent of the folder that was moved
                await req.payload.update({
                    id: newParentFolderID,
                    collection: req.payload.config.folders.slug,
                    data: {
                        [folderFieldName]: previousDoc[folderFieldName] ? extractID(previousDoc[folderFieldName]) : null
                    },
                    req
                });
            }
        }
    };
};

//# sourceMappingURL=reparentChildFolder.js.map