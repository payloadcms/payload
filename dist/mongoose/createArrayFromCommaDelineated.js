"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArrayFromCommaDelineated = void 0;
function createArrayFromCommaDelineated(input) {
    if (Array.isArray(input))
        return input;
    if (input.indexOf(',') > -1) {
        return input.split(',');
    }
    return [input];
}
exports.createArrayFromCommaDelineated = createArrayFromCommaDelineated;
//# sourceMappingURL=createArrayFromCommaDelineated.js.map