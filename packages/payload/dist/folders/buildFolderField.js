import { extractID } from '../utilities/extractID.js';
export const buildFolderField = ({ collectionSpecific, folderFieldName, folderSlug, overrides = {} })=>{
    const field = {
        name: folderFieldName,
        type: 'relationship',
        admin: {},
        hasMany: false,
        index: true,
        label: 'Folder',
        relationTo: folderSlug,
        validate: async (value, { collectionSlug, data, overrideAccess, previousValue, req })=>{
            if (!collectionSpecific) {
                // if collection scoping is not enabled, no validation required since folders can contain any type of document
                return true;
            }
            if (!value) {
                // no folder, no validation required
                return true;
            }
            const newID = extractID(value);
            if (previousValue && extractID(previousValue) === newID) {
                // value did not change, no validation required
                return true;
            } else {
                // need to validat the folder value allows this collection type
                let parentFolder = null;
                if (typeof value === 'string' || typeof value === 'number') {
                    // need to populate the value with the document
                    parentFolder = await req.payload.findByID({
                        id: newID,
                        collection: folderSlug,
                        depth: 0,
                        overrideAccess,
                        req,
                        select: {
                            folderType: true
                        },
                        user: req.user
                    });
                }
                if (parentFolder && collectionSlug) {
                    const parentFolderTypes = parentFolder.folderType || [];
                    // if the parent folder has no folder types, it accepts all collections
                    if (parentFolderTypes.length === 0) {
                        return true;
                    }
                    // validation for a folder document
                    if (collectionSlug === folderSlug) {
                        // ensure the parent accepts ALL folder types
                        const folderTypes = 'folderType' in data ? data.folderType : [];
                        const invalidSlugs = folderTypes.filter((validCollectionSlug)=>{
                            return !parentFolderTypes.includes(validCollectionSlug);
                        });
                        if (invalidSlugs.length === 0) {
                            return true;
                        } else {
                            return `Folder with ID ${newID} does not allow documents of type ${invalidSlugs.join(', ')}`;
                        }
                    }
                    // validation for a non-folder document
                    if (parentFolderTypes.includes(collectionSlug)) {
                        return true;
                    } else {
                        return `Folder with ID ${newID} does not allow documents of type ${collectionSlug}`;
                    }
                } else {
                    return `Folder with ID ${newID} not found in collection ${folderSlug}`;
                }
            }
        }
    };
    if (overrides?.admin) {
        field.admin = {
            ...field.admin,
            ...overrides.admin || {}
        };
        if (overrides.admin.components) {
            field.admin.components = {
                ...field.admin.components,
                ...overrides.admin.components || {}
            };
        }
    }
    return field;
};

//# sourceMappingURL=buildFolderField.js.map