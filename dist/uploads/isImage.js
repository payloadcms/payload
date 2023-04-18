"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isImage(mimeType) {
    return ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'].indexOf(mimeType) > -1;
}
exports.default = isImage;
//# sourceMappingURL=isImage.js.map