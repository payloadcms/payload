export const cloneDataFromOriginalDoc = (originalDocData)=>{
    if (Array.isArray(originalDocData)) {
        return originalDocData.map((row)=>{
            if (typeof row === 'object' && row != null) {
                return {
                    ...row
                };
            }
            return row;
        });
    }
    if (typeof originalDocData === 'object' && originalDocData !== null) {
        return {
            ...originalDocData
        };
    }
    return originalDocData;
};

//# sourceMappingURL=cloneDataFromOriginalDoc.js.map