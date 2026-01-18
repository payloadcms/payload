export const appendPrefixToObjectKeys = (obj, prefix)=>Object.entries(obj).reduce((res, [key, val])=>{
        res[`${prefix}_${key}`] = val;
        return res;
    }, {});

//# sourceMappingURL=appendPrefixToKeys.js.map