import { APIError } from '../../errors/APIError.js';
import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js';
import { formatFolderOrDocumentItem } from './formatFolderOrDocumentItem.js';
export async function queryDocumentsAndFoldersFromJoin({ documentWhere, folderWhere, parentFolderID, req }) {
    const { payload, user } = req;
    if (payload.config.folders === false) {
        throw new APIError('Folders are not enabled', 500);
    }
    const subfolderDoc = await payload.find({
        collection: payload.config.folders.slug,
        depth: 1,
        joins: {
            documentsAndFolders: {
                limit: 100_000_000,
                sort: 'name',
                where: combineWhereConstraints([
                    folderWhere,
                    documentWhere
                ], 'or')
            }
        },
        limit: 1,
        overrideAccess: false,
        req,
        select: {
            documentsAndFolders: true,
            folderType: true
        },
        user,
        where: {
            id: {
                equals: parentFolderID
            }
        }
    });
    const childrenDocs = subfolderDoc?.docs[0]?.documentsAndFolders?.docs || [];
    const results = childrenDocs.reduce((acc, doc)=>{
        if (!payload.config.folders) {
            return acc;
        }
        const { relationTo, value } = doc;
        const item = formatFolderOrDocumentItem({
            folderFieldName: payload.config.folders.fieldName,
            isUpload: Boolean(payload.collections[relationTo].config.upload),
            relationTo,
            useAsTitle: payload.collections[relationTo].config.admin?.useAsTitle,
            value
        });
        if (relationTo === payload.config.folders.slug) {
            acc.subfolders.push(item);
        } else {
            acc.documents.push(item);
        }
        return acc;
    }, {
        documents: [],
        subfolders: []
    });
    return {
        documents: results.documents,
        folderAssignedCollections: subfolderDoc?.docs[0]?.folderType || [],
        subfolders: results.subfolders
    };
}

//# sourceMappingURL=getFoldersAndDocumentsFromJoin.js.map