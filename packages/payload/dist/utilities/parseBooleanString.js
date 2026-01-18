/**
 * Useful when parsing query parameters where booleans are represented as strings.
 * Falls back to `undefined` to allow default handling elsewhere.
 */ export const parseBooleanString = (value)=>{
    if (typeof value === 'boolean') {
        return value;
    }
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    return undefined;
};

//# sourceMappingURL=parseBooleanString.js.map