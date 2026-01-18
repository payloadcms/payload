/** Remove a leading '-' from a sort value (e.g. "-title" -> "title") */ export const stripSortDash = (v)=>v ? v.replace(/^-/, '') : '';
/** Apply order to a base field (("title","desc") -> "-title") */ export const applySortOrder = (field, order)=>order === 'desc' ? `-${field}` : field;
// Safely coerce query.sort / query.groupBy to a string (ignore arrays)
export const normalizeQueryParam = (v)=>{
    if (typeof v === 'string') {
        return v;
    }
    if (Array.isArray(v) && typeof v[0] === 'string') {
        return v[0];
    }
    return undefined;
};

//# sourceMappingURL=sortHelpers.js.map