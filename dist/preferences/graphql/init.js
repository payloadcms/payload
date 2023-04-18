"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-param-reassign */
const graphql_type_json_1 = require("graphql-type-json");
const graphql_1 = require("graphql");
const graphql_scalars_1 = require("graphql-scalars");
const findOne_1 = __importDefault(require("../operations/findOne"));
const update_1 = __importDefault(require("../operations/update"));
const delete_1 = __importDefault(require("../operations/delete"));
function initCollectionsGraphQL(payload) {
    const valueType = graphql_type_json_1.GraphQLJSON;
    const preferenceType = new graphql_1.GraphQLObjectType({
        name: 'Preference',
        fields: {
            key: {
                type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
            },
            value: { type: valueType },
            createdAt: { type: new graphql_1.GraphQLNonNull(graphql_scalars_1.DateTimeResolver) },
            updatedAt: { type: new graphql_1.GraphQLNonNull(graphql_scalars_1.DateTimeResolver) },
        },
    });
    payload.Query.fields.Preference = {
        type: preferenceType,
        args: {
            key: { type: graphql_1.GraphQLString },
        },
        resolve: (_, { key }, context) => {
            const { user } = context.req;
            return (0, findOne_1.default)({ key, user, req: context.req });
        },
    };
    payload.Mutation.fields.updatePreference = {
        type: preferenceType,
        args: {
            key: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
            value: { type: valueType },
        },
        resolve: (_, { key, value }, context) => {
            const { user } = context.req;
            return (0, update_1.default)({ key, user, req: context.req, value });
        },
    };
    payload.Mutation.fields.deletePreference = {
        type: preferenceType,
        args: {
            key: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        },
        resolve: (_, { key }, context) => {
            const { user } = context.req;
            return (0, delete_1.default)({ key, user, req: context.req });
        },
    };
}
exports.default = initCollectionsGraphQL;
//# sourceMappingURL=init.js.map