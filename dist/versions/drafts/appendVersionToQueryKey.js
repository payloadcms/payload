"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendVersionToQueryKey = void 0;
const appendVersionToQueryKey = (query) => {
    return Object.entries(query).reduce((res, [key, val]) => {
        if (['and', 'or'].includes(key) && Array.isArray(val)) {
            return {
                ...res,
                [key]: val.map((subQuery) => (0, exports.appendVersionToQueryKey)(subQuery)),
            };
        }
        if (key !== 'id') {
            return {
                ...res,
                [`version.${key}`]: val,
            };
        }
        return res;
    }, {});
};
exports.appendVersionToQueryKey = appendVersionToQueryKey;
//# sourceMappingURL=appendVersionToQueryKey.js.map