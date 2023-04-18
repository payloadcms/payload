"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initHTTP = void 0;
/* eslint-disable no-param-reassign */
const express_1 = __importDefault(require("express"));
const authenticate_1 = __importDefault(require("./express/middleware/authenticate"));
const middleware_1 = __importDefault(require("./express/middleware"));
const admin_1 = __importDefault(require("./express/admin"));
const init_1 = __importDefault(require("./auth/init"));
const access_1 = __importDefault(require("./auth/requestHandlers/access"));
const initHTTP_1 = __importDefault(require("./collections/initHTTP"));
const init_2 = __importDefault(require("./preferences/init"));
const initHTTP_2 = __importDefault(require("./globals/initHTTP"));
const initPlayground_1 = __importDefault(require("./graphql/initPlayground"));
const static_1 = __importDefault(require("./express/static"));
const graphQLHandler_1 = __importDefault(require("./graphql/graphQLHandler"));
const identifyAPI_1 = __importDefault(require("./express/middleware/identifyAPI"));
const errorHandler_1 = __importDefault(require("./express/middleware/errorHandler"));
const dataloader_1 = require("./collections/dataloader");
const mountEndpoints_1 = __importDefault(require("./express/mountEndpoints"));
const payload_1 = require("./payload");
const initHTTP = async (options) => {
    if (typeof options.local === 'undefined')
        options.local = false;
    const payload = await (0, payload_1.getPayload)(options);
    if (!options.local) {
        payload.router = express_1.default.Router();
        payload.router.use(...(0, middleware_1.default)(payload));
        (0, init_1.default)(payload);
        (0, initHTTP_1.default)(payload);
        (0, initHTTP_2.default)(payload);
        options.express.use((req, res, next) => {
            req.payload = payload;
            next();
        });
        options.express.use((req, res, next) => {
            req.payloadDataLoader = (0, dataloader_1.getDataLoader)(req);
            return next();
        });
        payload.express = options.express;
        if (payload.config.rateLimit.trustProxy) {
            payload.express.set('trust proxy', 1);
        }
        (0, admin_1.default)(payload);
        (0, init_2.default)(payload);
        payload.router.get('/access', access_1.default);
        if (!payload.config.graphQL.disable) {
            payload.router.use(payload.config.routes.graphQL, (req, res, next) => {
                if (req.method === 'OPTIONS') {
                    res.sendStatus(204);
                }
                else {
                    next();
                }
            }, (0, identifyAPI_1.default)('GraphQL'), (req, res, next) => (0, graphQLHandler_1.default)(req, res)(req, res, next));
            (0, initPlayground_1.default)(payload);
        }
        (0, mountEndpoints_1.default)(options.express, payload.router, payload.config.endpoints);
        // Bind router to API
        payload.express.use(payload.config.routes.api, payload.router);
        // Enable static routes for all collections permitting upload
        (0, static_1.default)(payload);
        payload.errorHandler = (0, errorHandler_1.default)(payload.config, payload.logger);
        payload.router.use(payload.errorHandler);
        payload.authenticate = (0, authenticate_1.default)(payload.config);
    }
    return payload;
};
exports.initHTTP = initHTTP;
//# sourceMappingURL=initHTTP.js.map