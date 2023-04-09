"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilterOptionsQuery = void 0;
const getFilterOptionsQuery = (filterOptions, options) => {
    const { relationTo } = options;
    const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
    const query = {};
    if (typeof filterOptions !== 'undefined') {
        relations.forEach((relation) => {
            query[relation] = typeof filterOptions === 'function' ? filterOptions({ ...options, relationTo: relation }) : filterOptions;
        });
    }
    return query;
};
exports.getFilterOptionsQuery = getFilterOptionsQuery;
//# sourceMappingURL=getFilterOptionsQuery.js.map