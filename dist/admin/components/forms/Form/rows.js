"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenRows = exports.separateRows = void 0;
const separateRows = (path, fields) => {
    const remainingFields = {};
    const rows = Object.entries(fields).reduce((incomingRows, [fieldPath, field]) => {
        const newRows = incomingRows;
        if (fieldPath.indexOf(`${path}.`) === 0) {
            const index = Number(fieldPath.replace(`${path}.`, '').split('.')[0]);
            if (!newRows[index])
                newRows[index] = {};
            newRows[index][fieldPath.replace(`${path}.${String(index)}.`, '')] = field;
        }
        else {
            remainingFields[fieldPath] = field;
        }
        return newRows;
    }, []);
    return {
        remainingFields,
        rows,
    };
};
exports.separateRows = separateRows;
const flattenRows = (path, rows) => {
    return rows.reduce((fields, row, i) => ({
        ...fields,
        ...Object.entries(row).reduce((subFields, [subPath, subField]) => {
            return {
                ...subFields,
                [`${path}.${i}.${subPath}`]: subField,
            };
        }, {}),
    }), {});
};
exports.flattenRows = flattenRows;
//# sourceMappingURL=rows.js.map