"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("graphql-http/lib/use/express");
const errorHandler_1 = __importDefault(require("./errorHandler"));
const graphQLHandler = (req, res) => {
    const { payload } = req;
    const afterErrorHook = typeof payload.config.hooks.afterError === 'function' ? payload.config.hooks.afterError : null;
    return (0, express_1.createHandler)({
        schema: payload.schema,
        onOperation: async (request, args, result) => {
            const response = typeof payload.extensions === 'function' ? await payload.extensions({
                req: request,
                args,
                result,
            }) : result;
            if (response.errors) {
                const errors = await Promise.all(result.errors.map((error) => {
                    return (0, errorHandler_1.default)(payload, error, payload.config.debug, afterErrorHook);
                }));
                // errors type should be FormattedGraphQLError[] but onOperation has a return type of ExecutionResult instead of FormattedExecutionResult
                return { ...response, errors };
            }
            return response;
        },
        context: { req, res },
        validationRules: (request, args, defaultRules) => defaultRules.concat(payload.validationRules(args)),
    });
};
exports.default = graphQLHandler;
//# sourceMappingURL=graphQLHandler.js.map