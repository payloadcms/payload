"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validateWhereQuery = (whereQuery) => {
    var _a, _b, _c, _d, _e, _f;
    if (((_a = whereQuery === null || whereQuery === void 0 ? void 0 : whereQuery.or) === null || _a === void 0 ? void 0 : _a.length) > 0 && ((_c = (_b = whereQuery === null || whereQuery === void 0 ? void 0 : whereQuery.or) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.and) && ((_f = (_e = (_d = whereQuery === null || whereQuery === void 0 ? void 0 : whereQuery.or) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.and) === null || _f === void 0 ? void 0 : _f.length) > 0) {
        return true;
    }
    return false;
};
exports.default = validateWhereQuery;
//# sourceMappingURL=validateWhereQuery.js.map