"use strict";
/**
  * If there is an incoming row id,
  * and it matches the existing sibling doc id,
  * this is an existing row, so it should be merged.
  * Otherwise, return an empty object.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExistingRowDoc = void 0;
const getExistingRowDoc = (incomingRow, existingRows) => {
    if (incomingRow.id && Array.isArray(existingRows)) {
        const matchedExistingRow = existingRows.find((existingRow) => {
            if (typeof existingRow === 'object' && 'id' in existingRow) {
                if (existingRow.id === incomingRow.id)
                    return existingRow;
            }
            return false;
        });
        if (matchedExistingRow)
            return matchedExistingRow;
    }
    return {};
};
exports.getExistingRowDoc = getExistingRowDoc;
//# sourceMappingURL=getExistingRowDoc.js.map