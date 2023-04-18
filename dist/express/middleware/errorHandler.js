"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const formatError_1 = __importDefault(require("../responses/formatError"));
// NextFunction must be passed for Express to use this middleware as error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (config, logger) => async (err, req, res, next) => {
    let response = (0, formatError_1.default)(err);
    let status = err.status || http_status_1.default.INTERNAL_SERVER_ERROR;
    logger.error(err.stack);
    if (config.debug && config.debug === true) {
        response.stack = err.stack;
    }
    if (req.collection && typeof req.collection.config.hooks.afterError === 'function') {
        ({ response, status } = await req.collection.config.hooks.afterError(err, response) || { response, status });
    }
    if (typeof config.hooks.afterError === 'function') {
        ({ response, status } = await config.hooks.afterError(err, response) || { response, status });
    }
    res.status(status).send(response);
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map