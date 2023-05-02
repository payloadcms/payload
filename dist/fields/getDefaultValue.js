"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getValueWithDefault = async ({ value, defaultValue, locale, user }) => {
    if (typeof value !== 'undefined') {
        return value;
    }
    if (defaultValue && typeof defaultValue === 'function') {
        return defaultValue({ locale, user });
    }
    return defaultValue;
};
exports.default = getValueWithDefault;
//# sourceMappingURL=getDefaultValue.js.map