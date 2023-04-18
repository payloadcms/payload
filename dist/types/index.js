"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docHasTimestamps = void 0;
function docHasTimestamps(doc) {
    return (doc === null || doc === void 0 ? void 0 : doc.createdAt) && (doc === null || doc === void 0 ? void 0 : doc.updatedAt);
}
exports.docHasTimestamps = docHasTimestamps;
//# sourceMappingURL=index.js.map