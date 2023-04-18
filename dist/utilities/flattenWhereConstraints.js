"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flattenWhereConstraints = (query) => {
    if (!query.where && !query.and && !query.or) {
        return Object.keys(query).map((key) => query[key]);
    }
    if (query.where) {
        const whereResult = flattenWhereConstraints(query.where);
        return Object.keys(whereResult).map((key) => whereResult[key]);
    }
    const nested = [...query.or || [], ...query.and || []];
    if (nested.length > 0) {
        return nested.flatMap((nest) => flattenWhereConstraints(nest));
    }
    return query;
};
exports.default = flattenWhereConstraints;
//# sourceMappingURL=flattenWhereConstraints.js.map