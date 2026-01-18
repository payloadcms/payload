export const dissasociateAfterDelete = ({ collectionSlugs, folderFieldName })=>{
    return async ({ id, req })=>{
        for (const collectionSlug of collectionSlugs){
            await req.payload.update({
                collection: collectionSlug,
                data: {
                    [folderFieldName]: null
                },
                req,
                where: {
                    [folderFieldName]: {
                        equals: id
                    }
                }
            });
        }
    };
};

//# sourceMappingURL=dissasociateAfterDelete.js.map