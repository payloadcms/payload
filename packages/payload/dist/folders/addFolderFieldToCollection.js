import { buildFolderField } from './buildFolderField.js';
export const addFolderFieldToCollection = ({ collection, collectionSpecific, folderFieldName, folderSlug })=>{
    collection.fields.push(buildFolderField({
        collectionSpecific,
        folderFieldName,
        folderSlug,
        overrides: {
            admin: {
                allowCreate: false,
                allowEdit: false,
                components: {
                    Cell: '@payloadcms/ui/rsc#FolderTableCell',
                    Field: '@payloadcms/ui/rsc#FolderField'
                }
            }
        }
    }));
};

//# sourceMappingURL=addFolderFieldToCollection.js.map