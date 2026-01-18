/**
 * Builds breadcrumbs up from child folder
 * all the way up to root folder
 */ export const getFolderBreadcrumbs = async ({ breadcrumbs = [], folderID, req })=>{
    const { payload, user } = req;
    if (folderID && payload.config.folders) {
        const folderFieldName = payload.config.folders.fieldName;
        const folderQuery = await payload.find({
            collection: payload.config.folders.slug,
            depth: 0,
            limit: 1,
            overrideAccess: false,
            req,
            select: {
                name: true,
                [folderFieldName]: true,
                folderType: true
            },
            user,
            where: {
                id: {
                    equals: folderID
                }
            }
        });
        const folder = folderQuery.docs[0];
        if (folder) {
            breadcrumbs.push({
                id: folder.id,
                name: folder.name,
                folderType: folder.folderType
            });
            if (folder[folderFieldName]) {
                return getFolderBreadcrumbs({
                    breadcrumbs,
                    folderID: typeof folder[folderFieldName] === 'number' || typeof folder[folderFieldName] === 'string' ? folder[folderFieldName] : folder[folderFieldName].id,
                    req
                });
            }
        }
    }
    return breadcrumbs.reverse();
};

//# sourceMappingURL=getFolderBreadcrumbs.js.map