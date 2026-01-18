import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js';
export const getDefaultValue = async ({ defaultValue, locale, req, user, value })=>{
    if (typeof value !== 'undefined') {
        return value;
    }
    if (defaultValue && typeof defaultValue === 'function') {
        return await defaultValue({
            locale,
            req,
            user
        });
    }
    if (typeof defaultValue === 'object') {
        return deepCopyObjectSimple(defaultValue);
    }
    return defaultValue;
};

//# sourceMappingURL=getDefaultValue.js.map