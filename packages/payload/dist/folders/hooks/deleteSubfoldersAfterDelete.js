export const deleteSubfoldersBeforeDelete = ({ folderFieldName, folderSlug })=>{
    return async ({ id, req })=>{
        await req.payload.delete({
            collection: folderSlug,
            req,
            where: {
                [folderFieldName]: {
                    equals: id
                }
            }
        });
    };
};

//# sourceMappingURL=deleteSubfoldersAfterDelete.js.map