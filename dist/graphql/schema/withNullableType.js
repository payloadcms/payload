"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const withNullableType = (field, type, forceNullable = false) => {
    const hasReadAccessControl = field.access && field.access.read;
    const condition = field.admin && field.admin.condition;
    if (!forceNullable && 'required' in field && field.required && !field.localized && !condition && !hasReadAccessControl) {
        return new graphql_1.GraphQLNonNull(type);
    }
    return type;
};
exports.default = withNullableType;
//# sourceMappingURL=withNullableType.js.map