"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (localization) => (value) => typeof value === 'object'
    && Object.keys(value).some((key) => localization.locales.indexOf(key) > -1);
//# sourceMappingURL=getCheckIfLocaleObject.js.map