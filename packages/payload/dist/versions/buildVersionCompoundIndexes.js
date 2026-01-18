export const buildVersionCompoundIndexes = ({ indexes })=>{
    return indexes.map((each)=>({
            fields: each.fields.map(({ field, localizedPath, path, pathHasLocalized })=>({
                    field,
                    localizedPath: `version.${localizedPath}`,
                    path: `version.${path}`,
                    pathHasLocalized
                })),
            unique: false
        }));
};

//# sourceMappingURL=buildVersionCompoundIndexes.js.map