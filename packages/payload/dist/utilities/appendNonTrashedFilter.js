export const appendNonTrashedFilter = ({ deletedAtPath = 'deletedAt', enableTrash, trash, where })=>{
    if (!enableTrash || trash) {
        return where;
    }
    const notTrashedFilter = {
        [deletedAtPath]: {
            exists: false
        }
    };
    if (where?.and) {
        return {
            ...where,
            and: [
                ...where.and,
                notTrashedFilter
            ]
        };
    }
    return {
        and: [
            notTrashedFilter,
            ...where ? [
                where
            ] : []
        ]
    };
};

//# sourceMappingURL=appendNonTrashedFilter.js.map