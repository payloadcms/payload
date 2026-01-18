const isEmptyObject = (obj)=>Object.keys(obj).length === 0;
export const hoistQueryParamsToAnd = (currentWhere, incomingWhere)=>{
    if (isEmptyObject(incomingWhere)) {
        return currentWhere;
    }
    if (isEmptyObject(currentWhere)) {
        return incomingWhere;
    }
    if ('and' in currentWhere && currentWhere.and) {
        currentWhere.and.push(incomingWhere);
    } else if ('or' in currentWhere) {
        currentWhere = {
            and: [
                currentWhere,
                incomingWhere
            ]
        };
    } else {
        currentWhere = {
            and: [
                currentWhere,
                incomingWhere
            ]
        };
    }
    return currentWhere;
};
export const mergeListSearchAndWhere = ({ collectionConfig, search, where = {} })=>{
    if (search) {
        let copyOfWhere = {
            ...where || {}
        };
        const searchAsConditions = (collectionConfig.admin.listSearchableFields || [
            collectionConfig.admin?.useAsTitle || 'id'
        ]).map((fieldName)=>({
                [fieldName]: {
                    like: search
                }
            }));
        if (searchAsConditions.length > 0) {
            copyOfWhere = hoistQueryParamsToAnd(copyOfWhere, {
                or: searchAsConditions
            });
        }
        if (!isEmptyObject(copyOfWhere)) {
            where = copyOfWhere;
        }
    }
    return where;
};

//# sourceMappingURL=mergeListSearchAndWhere.js.map