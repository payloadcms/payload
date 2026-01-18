import { defaultAccess } from '../auth/defaultAccess.js';
import { buildFolderField } from './buildFolderField.js';
import { deleteSubfoldersBeforeDelete } from './hooks/deleteSubfoldersAfterDelete.js';
import { dissasociateAfterDelete } from './hooks/dissasociateAfterDelete.js';
import { ensureSafeCollectionsChange } from './hooks/ensureSafeCollectionsChange.js';
import { reparentChildFolder } from './hooks/reparentChildFolder.js';
export const createFolderCollection = ({ slug, collectionSpecific, debug, folderEnabledCollections, folderFieldName })=>{
    const { collectionOptions, collectionSlugs } = folderEnabledCollections.reduce((acc, collection)=>{
        acc.collectionSlugs.push(collection.slug);
        acc.collectionOptions.push({
            label: collection.labels?.plural || collection.slug,
            value: collection.slug
        });
        return acc;
    }, {
        collectionOptions: [],
        collectionSlugs: []
    });
    return {
        slug,
        access: {
            create: defaultAccess,
            delete: defaultAccess,
            read: defaultAccess,
            readVersions: defaultAccess,
            update: defaultAccess
        },
        admin: {
            hidden: !debug,
            useAsTitle: 'name'
        },
        fields: [
            {
                name: 'name',
                type: 'text',
                index: true,
                required: true
            },
            buildFolderField({
                collectionSpecific,
                folderFieldName,
                folderSlug: slug,
                overrides: {
                    admin: {
                        hidden: !debug
                    }
                }
            }),
            {
                name: 'documentsAndFolders',
                type: 'join',
                admin: {
                    hidden: !debug
                },
                collection: [
                    slug,
                    ...collectionSlugs
                ],
                hasMany: true,
                on: folderFieldName
            },
            ...collectionSpecific ? [
                {
                    name: 'folderType',
                    type: 'select',
                    admin: {
                        components: {
                            Field: {
                                path: '@payloadcms/ui#FolderTypeField'
                            }
                        },
                        position: 'sidebar'
                    },
                    hasMany: true,
                    options: collectionOptions
                }
            ] : []
        ],
        hooks: {
            afterChange: [
                reparentChildFolder({
                    folderFieldName
                })
            ],
            afterDelete: [
                dissasociateAfterDelete({
                    collectionSlugs,
                    folderFieldName
                })
            ],
            beforeDelete: [
                deleteSubfoldersBeforeDelete({
                    folderFieldName,
                    folderSlug: slug
                })
            ],
            beforeValidate: [
                ...collectionSpecific ? [
                    ensureSafeCollectionsChange({
                        foldersSlug: slug
                    })
                ] : []
            ]
        },
        labels: {
            plural: 'Folders',
            singular: 'Folder'
        },
        typescript: {
            interface: 'FolderInterface'
        }
    };
};

//# sourceMappingURL=createFolderCollection.js.map