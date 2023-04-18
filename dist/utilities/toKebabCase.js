"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const toKebabCase = (string) => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
exports.default = toKebabCase;
//# sourceMappingURL=toKebabCase.js.map