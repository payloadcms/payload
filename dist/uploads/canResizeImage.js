"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function canResizeImage(mimeType) {
    return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].indexOf(mimeType) > -1;
}
exports.default = canResizeImage;
//# sourceMappingURL=canResizeImage.js.map