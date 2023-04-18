"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getUniqueListBy(arr, key) {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
}
exports.default = getUniqueListBy;
//# sourceMappingURL=getUniqueListBy.js.map