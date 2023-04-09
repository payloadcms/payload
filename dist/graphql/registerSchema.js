"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-param-reassign */
const GraphQL = __importStar(require("graphql"));
const graphql_1 = require("graphql");
const graphql_query_complexity_1 = __importStar(require("graphql-query-complexity"));
const buildLocaleInputType_1 = __importDefault(require("./schema/buildLocaleInputType"));
const buildFallbackLocaleInputType_1 = __importDefault(require("./schema/buildFallbackLocaleInputType"));
const init_1 = __importDefault(require("../collections/graphql/init"));
const init_2 = __importDefault(require("../globals/graphql/init"));
const init_3 = __importDefault(require("../preferences/graphql/init"));
const buildPoliciesType_1 = __importDefault(require("./schema/buildPoliciesType"));
const access_1 = __importDefault(require("../auth/graphql/resolvers/access"));
const errorHandler_1 = __importDefault(require("./errorHandler"));
function registerSchema(payload) {
    payload.types = {
        blockTypes: {},
        blockInputTypes: {},
    };
    if (payload.config.localization) {
        payload.types.localeInputType = (0, buildLocaleInputType_1.default)(payload.config.localization);
        payload.types.fallbackLocaleInputType = (0, buildFallbackLocaleInputType_1.default)(payload.config.localization);
    }
    payload.Query = {
        name: 'Query',
        fields: {},
    };
    payload.Mutation = {
        name: 'Mutation',
        fields: {},
    };
    (0, init_1.default)(payload);
    (0, init_2.default)(payload);
    (0, init_3.default)(payload);
    payload.Query.fields.Access = {
        type: (0, buildPoliciesType_1.default)(payload),
        resolve: (0, access_1.default)(payload),
    };
    if (typeof payload.config.graphQL.queries === 'function') {
        const customQueries = payload.config.graphQL.queries(GraphQL, payload);
        payload.Query = {
            ...payload.Query,
            fields: {
                ...payload.Query.fields,
                ...(customQueries || {}),
            },
        };
    }
    if (typeof payload.config.graphQL.mutations === 'function') {
        const customMutations = payload.config.graphQL.mutations(GraphQL, payload);
        payload.Mutation = {
            ...payload.Mutation,
            fields: {
                ...payload.Mutation.fields,
                ...(customMutations || {}),
            },
        };
    }
    const query = new graphql_1.GraphQLObjectType(payload.Query);
    const mutation = new graphql_1.GraphQLObjectType(payload.Mutation);
    const schema = {
        query,
        mutation,
    };
    payload.schema = new graphql_1.GraphQLSchema(schema);
    payload.extensions = async (info) => {
        const { result } = info;
        if (result.errors) {
            payload.errorIndex = 0;
            const afterErrorHook = typeof payload.config.hooks.afterError === 'function' ? payload.config.hooks.afterError : null;
            payload.errorResponses = await (0, errorHandler_1.default)(payload, info, payload.config.debug, afterErrorHook);
        }
        return null;
    };
    payload.customFormatErrorFn = (error) => {
        if (payload.errorResponses && payload.errorResponses[payload.errorIndex]) {
            const response = payload.errorResponses[payload.errorIndex];
            payload.errorIndex += 1;
            return response;
        }
        return error;
    };
    payload.validationRules = (variables) => ([
        (0, graphql_query_complexity_1.default)({
            estimators: [
                (0, graphql_query_complexity_1.fieldExtensionsEstimator)(),
                (0, graphql_query_complexity_1.simpleEstimator)({ defaultComplexity: 1 }), // Fallback if complexity not set
            ],
            maximumComplexity: payload.config.graphQL.maxComplexity,
            variables,
            // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
        }),
    ]);
}
exports.default = registerSchema;
//# sourceMappingURL=registerSchema.js.map