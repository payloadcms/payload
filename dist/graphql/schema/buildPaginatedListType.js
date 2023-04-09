"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const buildPaginatedListType = (name, docType) => new graphql_1.GraphQLObjectType({
    name,
    fields: {
        docs: {
            type: new graphql_1.GraphQLList(docType),
        },
        totalDocs: { type: graphql_1.GraphQLInt },
        offset: { type: graphql_1.GraphQLInt },
        limit: { type: graphql_1.GraphQLInt },
        totalPages: { type: graphql_1.GraphQLInt },
        page: { type: graphql_1.GraphQLInt },
        pagingCounter: { type: graphql_1.GraphQLInt },
        hasPrevPage: { type: graphql_1.GraphQLBoolean },
        hasNextPage: { type: graphql_1.GraphQLBoolean },
        prevPage: { type: graphql_1.GraphQLInt },
        nextPage: { type: graphql_1.GraphQLInt },
    },
});
exports.default = buildPaginatedListType;
//# sourceMappingURL=buildPaginatedListType.js.map