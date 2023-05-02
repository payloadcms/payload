"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sanitizeFallbackLocale = (fallbackLocale) => {
    if (fallbackLocale === 'null' || fallbackLocale === 'none' || fallbackLocale === 'false' || fallbackLocale === false || fallbackLocale === null) {
        return null;
    }
    return fallbackLocale;
};
exports.default = sanitizeFallbackLocale;
//# sourceMappingURL=sanitizeFallbackLocale.js.map