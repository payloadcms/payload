"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPolicyType = exports.buildEntityPolicy = void 0;
const graphql_type_json_1 = require("graphql-type-json");
const graphql_1 = require("graphql");
const formatName_1 = __importDefault(require("../utilities/formatName"));
const formatLabels_1 = require("../../utilities/formatLabels");
const buildFields = (label, fieldsToBuild) => fieldsToBuild.reduce((builtFields, field) => {
    if (!field.hidden) {
        if (field.name) {
            const fieldName = (0, formatName_1.default)(field.name);
            const objectTypeFields = ['create', 'read', 'update', 'delete'].reduce((operations, operation) => {
                const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1);
                return {
                    ...operations,
                    [operation]: {
                        type: new graphql_1.GraphQLObjectType({
                            name: `${label}_${fieldName}_${capitalizedOperation}`,
                            fields: {
                                permission: {
                                    type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean),
                                },
                            },
                        }),
                    },
                };
            }, {});
            if (field.fields) {
                objectTypeFields.fields = {
                    type: new graphql_1.GraphQLObjectType({
                        name: `${label}_${fieldName}_Fields`,
                        fields: buildFields(`${label}_${fieldName}`, field.fields),
                    }),
                };
            }
            return {
                ...builtFields,
                [field.name]: {
                    type: new graphql_1.GraphQLObjectType({
                        name: `${label}_${fieldName}`,
                        fields: objectTypeFields,
                    }),
                },
            };
        }
        if (!field.name && field.fields) {
            const subFields = buildFields(label, field.fields);
            return {
                ...builtFields,
                ...subFields,
            };
        }
        if (field.type === 'tabs') {
            return field.tabs.reduce((fieldsWithTabFields, tab) => {
                return {
                    ...fieldsWithTabFields,
                    ...buildFields(label, tab.fields),
                };
            }, { ...builtFields });
        }
    }
    return builtFields;
}, {});
const buildEntityPolicy = (args) => {
    const { name, entityFields, operations, scope } = args;
    const fieldsTypeName = (0, formatLabels_1.toWords)(`${name}-${scope || ''}-Fields`, true);
    const fields = {
        fields: {
            type: new graphql_1.GraphQLObjectType({
                name: fieldsTypeName,
                fields: buildFields(fieldsTypeName, entityFields),
            }),
        },
    };
    operations.forEach((operation) => {
        const operationTypeName = (0, formatLabels_1.toWords)(`${name}-${operation}-${scope || 'Access'}`, true);
        fields[operation] = {
            type: new graphql_1.GraphQLObjectType({
                name: operationTypeName,
                fields: {
                    permission: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean) },
                    where: { type: graphql_type_json_1.GraphQLJSONObject },
                },
            }),
        };
    });
    return fields;
};
exports.buildEntityPolicy = buildEntityPolicy;
function buildPolicyType(args) {
    var _a, _b;
    const { typeSuffix, entity, type, scope } = args;
    const { slug } = entity;
    let operations = [];
    if (type === 'collection') {
        operations = ['create', 'read', 'update', 'delete'];
        if (entity.auth && (typeof entity.auth === 'object' && typeof entity.auth.maxLoginAttempts !== 'undefined' && entity.auth.maxLoginAttempts !== 0)) {
            operations.push('unlock');
        }
        if (entity.versions) {
            operations.push('readVersions');
        }
        const collectionTypeName = (0, formatName_1.default)(`${slug}${typeSuffix || ''}`);
        return new graphql_1.GraphQLObjectType({
            name: collectionTypeName,
            fields: (0, exports.buildEntityPolicy)({
                name: slug,
                entityFields: entity.fields,
                operations,
                scope,
            }),
        });
    }
    // else create global type
    operations = ['read', 'update'];
    if (entity.versions) {
        operations.push('readVersions');
    }
    const globalTypeName = (0, formatName_1.default)(`${((_a = global === null || global === void 0 ? void 0 : global.graphQL) === null || _a === void 0 ? void 0 : _a.name) || slug}${typeSuffix || ''}`);
    return new graphql_1.GraphQLObjectType({
        name: globalTypeName,
        fields: (0, exports.buildEntityPolicy)({
            name: ((_b = entity === null || entity === void 0 ? void 0 : entity.graphQL) === null || _b === void 0 ? void 0 : _b.name) || slug,
            entityFields: entity.fields,
            operations,
            scope,
        }),
    });
}
exports.buildPolicyType = buildPolicyType;
function buildPoliciesType(payload) {
    const fields = {
        canAccessAdmin: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean),
        },
    };
    Object.values(payload.config.collections).forEach((collection) => {
        const collectionPolicyType = buildPolicyType({
            typeSuffix: 'Access',
            entity: collection,
            type: 'collection',
        });
        fields[(0, formatName_1.default)(collection.slug)] = {
            type: collectionPolicyType,
        };
    });
    Object.values(payload.config.globals).forEach((global) => {
        const globalPolicyType = buildPolicyType({
            typeSuffix: 'Access',
            entity: global,
            type: 'global',
        });
        fields[(0, formatName_1.default)(global.slug)] = {
            type: globalPolicyType,
        };
    });
    return new graphql_1.GraphQLObjectType({
        name: 'Access',
        fields,
    });
}
exports.default = buildPoliciesType;
//# sourceMappingURL=buildPoliciesType.js.map