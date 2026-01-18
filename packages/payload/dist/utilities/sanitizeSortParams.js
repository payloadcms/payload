export const sanitizeSortParams = (sort)=>{
    if (typeof sort === 'string') {
        return sort.split(',');
    }
    if (Array.isArray(sort) && sort.every((value)=>typeof value === 'string')) {
        return sort;
    }
    return undefined;
};

//# sourceMappingURL=sanitizeSortParams.js.map