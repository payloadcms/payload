export const withDefault = (column, field)=>{
    if (typeof field.defaultValue === 'undefined' || typeof field.defaultValue === 'function') {
        return column;
    }
    return {
        ...column,
        default: field.defaultValue
    };
};

//# sourceMappingURL=withDefault.js.map