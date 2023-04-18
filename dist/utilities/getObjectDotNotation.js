"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectDotNotation = void 0;
const getObjectDotNotation = (obj, path, defaultValue) => {
    if (!path || !obj)
        return defaultValue;
    const result = path.split('.').reduce((o, i) => o === null || o === void 0 ? void 0 : o[i], obj);
    return result === undefined ? defaultValue : result;
};
exports.getObjectDotNotation = getObjectDotNotation;
//# sourceMappingURL=getObjectDotNotation.js.map