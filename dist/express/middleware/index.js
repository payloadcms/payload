"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const compression_1 = __importDefault(require("compression"));
const body_parser_1 = __importDefault(require("body-parser"));
const method_override_1 = __importDefault(require("method-override"));
const qs_middleware_1 = __importDefault(require("qs-middleware"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const middleware_1 = __importDefault(require("../../localization/middleware"));
const authenticate_1 = __importDefault(require("./authenticate"));
const identifyAPI_1 = __importDefault(require("./identifyAPI"));
const corsHeaders_1 = __importDefault(require("./corsHeaders"));
const convertPayload_1 = __importDefault(require("./convertPayload"));
const i18n_1 = require("./i18n");
const middleware = (payload) => {
    var _a;
    const rateLimitOptions = {
        windowMs: payload.config.rateLimit.window,
        max: payload.config.rateLimit.max,
    };
    if (typeof payload.config.rateLimit.skip === 'function')
        rateLimitOptions.skip = payload.config.rateLimit.skip;
    if ((_a = payload.config.express.middleware) === null || _a === void 0 ? void 0 : _a.length) {
        payload.logger.warn('express.middleware is deprecated. Please migrate to express.postMiddleware.');
    }
    return [
        ...(payload.config.express.preMiddleware || []),
        (0, express_rate_limit_1.default)(rateLimitOptions),
        passport_1.default.initialize(),
        (0, i18n_1.i18nMiddleware)(payload.config.i18n),
        (0, identifyAPI_1.default)('REST'),
        (0, method_override_1.default)('X-HTTP-Method-Override'),
        (0, qs_middleware_1.default)({ depth: 10, arrayLimit: 1000 }),
        body_parser_1.default.urlencoded({ extended: true }),
        (0, compression_1.default)(payload.config.express.compression),
        (0, middleware_1.default)(payload.config.localization),
        express_1.default.json(payload.config.express.json),
        (0, express_fileupload_1.default)({
            parseNested: true,
            ...payload.config.upload,
        }),
        convertPayload_1.default,
        (0, corsHeaders_1.default)(payload.config),
        (0, authenticate_1.default)(payload.config),
        ...(payload.config.express.middleware || []),
        ...(payload.config.express.postMiddleware || []),
    ];
};
exports.default = middleware;
//# sourceMappingURL=index.js.map