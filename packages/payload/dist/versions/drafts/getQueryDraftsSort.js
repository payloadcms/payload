/**
 * Takes the incoming sort argument and prefixes it with `versions.` and preserves any `-` prefixes for descending order
 * @param sort
 */ export const getQueryDraftsSort = ({ collectionConfig, sort })=>{
    if (!sort) {
        if (collectionConfig.defaultSort) {
            sort = collectionConfig.defaultSort;
        } else {
            sort = '-createdAt';
        }
    }
    if (typeof sort === 'string') {
        sort = [
            sort
        ];
    }
    return sort.map((field)=>{
        let orderBy;
        let direction = '';
        if (field[0] === '-') {
            orderBy = field.substring(1);
            direction = '-';
        } else {
            orderBy = field;
        }
        if (orderBy === 'id') {
            return `${direction}parent`;
        }
        return `${direction}version.${orderBy}`;
    });
};

//# sourceMappingURL=getQueryDraftsSort.js.map