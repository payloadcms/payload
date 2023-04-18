"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const combineParentName_1 = __importDefault(require("../utilities/combineParentName"));
const withOperators = (field, type, parentName, operators) => {
    const name = `${(0, combineParentName_1.default)(parentName, field.name)}_operator`;
    const listOperators = ['in', 'not_in', 'all'];
    if (!('required' in field) || !field.required)
        operators.push('exists');
    return new graphql_1.GraphQLInputObjectType({
        name,
        fields: operators.reduce((fields, operator) => {
            let gqlType;
            if (listOperators.indexOf(operator) > -1) {
                gqlType = new graphql_1.GraphQLList(type);
            }
            else if (operator === 'exists') {
                gqlType = graphql_1.GraphQLBoolean;
            }
            else {
                gqlType = type;
            }
            return {
                ...fields,
                [operator]: {
                    type: gqlType,
                },
            };
        }, {}),
    });
};
exports.default = withOperators;
//# sourceMappingURL=withOperators.js.map