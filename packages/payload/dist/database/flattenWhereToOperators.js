/**
 * Take a where query and flatten it to all top-level operators
 */ export function flattenWhereToOperators(query) {
    const result = [];
    for (const [key, value] of Object.entries(query)){
        if ((key === 'and' || key === 'or') && Array.isArray(value)) {
            for (const subQuery of value){
                const flattenedSub = flattenWhereToOperators(subQuery);
                result.push(...flattenedSub);
            }
        } else {
            result.push(value);
        }
    }
    return result;
}

//# sourceMappingURL=flattenWhereToOperators.js.map