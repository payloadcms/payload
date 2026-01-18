export const appendVersionToQueryKey = (query = {})=>{
    return Object.entries(query).reduce((res, [key, val])=>{
        if ([
            'AND',
            'and',
            'OR',
            'or'
        ].includes(key) && Array.isArray(val)) {
            return {
                ...res,
                [key.toLowerCase()]: val.map((subQuery)=>appendVersionToQueryKey(subQuery))
            };
        }
        if (key !== 'id') {
            return {
                ...res,
                [`version.${key}`]: val
            };
        }
        return {
            ...res,
            parent: val
        };
    }, {});
};

//# sourceMappingURL=appendVersionToQueryKey.js.map