"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_graphql_1 = require("express-graphql");
const graphQLHandler = (req, res) => {
    const { payload } = req;
    payload.errorResponses = null;
    return (0, express_graphql_1.graphqlHTTP)(async (request, response, { variables }) => ({
        schema: payload.schema,
        customFormatErrorFn: payload.customFormatErrorFn,
        extensions: payload.extensions,
        context: { req, res },
        validationRules: payload.validationRules(variables),
    }));
};
exports.default = graphQLHandler;
//# sourceMappingURL=graphQLHandler.js.map