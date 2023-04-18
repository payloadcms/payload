"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneDataFromOriginalDoc = void 0;
const cloneDataFromOriginalDoc = (originalDocData) => {
    if (Array.isArray(originalDocData)) {
        return originalDocData.map((row) => {
            if (typeof row === 'object' && row != null) {
                return {
                    ...row,
                };
            }
            return row;
        });
    }
    if (typeof originalDocData === 'object' && originalDocData !== null) {
        return { ...originalDocData };
    }
    return originalDocData;
};
exports.cloneDataFromOriginalDoc = cloneDataFromOriginalDoc;
//# sourceMappingURL=cloneDataFromOriginalDoc.js.map