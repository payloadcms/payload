"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Take a where query and flatten it to all top-level operators
const flattenWhereConstraints = (query) => Object.entries(query).reduce((flattenedConstraints, [key, val]) => {
    if ((key === 'and' || key === 'or') && Array.isArray(val)) {
        return [
            ...flattenedConstraints,
            ...val.map((subVal) => flattenWhereConstraints(subVal)),
        ];
    }
    return [
        ...flattenedConstraints,
        val,
    ];
}, []);
exports.default = flattenWhereConstraints;
//# sourceMappingURL=flattenWhereConstraints.js.map