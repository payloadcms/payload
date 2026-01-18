export const getArrayRelationName = ({ field, path, tableName })=>{
    if (field.dbName && path.length > 63) {
        return `_${tableName}`;
    }
    return path;
};

//# sourceMappingURL=getArrayRelationName.js.map