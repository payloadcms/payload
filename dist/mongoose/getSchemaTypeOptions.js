"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemaTypeOptions = void 0;
const getSchemaTypeOptions = (schemaType) => {
    if ((schemaType === null || schemaType === void 0 ? void 0 : schemaType.instance) === 'Array') {
        return schemaType.options.type[0];
    }
    return schemaType === null || schemaType === void 0 ? void 0 : schemaType.options;
};
exports.getSchemaTypeOptions = getSchemaTypeOptions;
//# sourceMappingURL=getSchemaTypeOptions.js.map