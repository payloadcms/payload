"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAsync = void 0;
async function mapAsync(arr, callbackfn) {
    return Promise.all(arr.map(callbackfn));
}
exports.mapAsync = mapAsync;
//# sourceMappingURL=mapAsync.js.map