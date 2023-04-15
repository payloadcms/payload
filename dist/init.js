"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSync = exports.initAsync = exports.init = void 0;
/* eslint-disable no-param-reassign */
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const authenticate_1 = __importDefault(require("./express/middleware/authenticate"));
const connect_1 = __importDefault(require("./mongoose/connect"));
const middleware_1 = __importDefault(require("./express/middleware"));
const admin_1 = __importDefault(require("./express/admin"));
const init_1 = __importDefault(require("./auth/init"));
const access_1 = __importDefault(require("./auth/requestHandlers/access"));
const init_2 = __importDefault(require("./collections/init"));
const init_3 = __importDefault(require("./preferences/init"));
const init_4 = __importDefault(require("./globals/init"));
const initPlayground_1 = __importDefault(require("./graphql/initPlayground"));
const static_1 = __importDefault(require("./express/static"));
const registerSchema_1 = __importDefault(require("./graphql/registerSchema"));
const graphQLHandler_1 = __importDefault(require("./graphql/graphQLHandler"));
const build_1 = __importDefault(require("./email/build"));
const identifyAPI_1 = __importDefault(require("./express/middleware/identifyAPI"));
const errorHandler_1 = __importDefault(require("./express/middleware/errorHandler"));
const sendEmail_1 = __importDefault(require("./email/sendEmail"));
const serverInit_1 = require("./utilities/telemetry/events/serverInit");
const load_1 = __importDefault(require("./config/load"));
const logger_1 = __importDefault(require("./utilities/logger"));
const dataloader_1 = require("./collections/dataloader");
const mountEndpoints_1 = __importDefault(require("./express/mountEndpoints"));
const model_1 = __importDefault(require("./preferences/model"));
const find_1 = __importDefault(require("./config/find"));
const init = (payload, options) => {
    payload.logger.info('Starting Payload...');
    if (!options.secret) {
        throw new Error('Error: missing secret key. A secret key is needed to secure Payload.');
    }
    if (options.mongoURL !== false && typeof options.mongoURL !== 'string') {
        throw new Error('Error: missing MongoDB connection URL.');
    }
    payload.emailOptions = { ...(options.email) };
    payload.secret = crypto_1.default
        .createHash('sha256')
        .update(options.secret)
        .digest('hex')
        .slice(0, 32);
    payload.local = options.local;
    if (options.config) {
        payload.config = options.config;
        const configPath = (0, find_1.default)();
        payload.config = {
            ...options.config,
            paths: {
                configDir: path_1.default.dirname(configPath),
                config: configPath,
                rawConfig: configPath,
            },
        };
    }
    else {
        payload.config = (0, load_1.default)(payload.logger);
    }
    // If not initializing locally, scaffold router
    if (!payload.local) {
        payload.router = express_1.default.Router();
        payload.router.use(...(0, middleware_1.default)(payload));
        (0, init_1.default)(payload);
    }
    // Configure email service
    payload.email = (0, build_1.default)(payload.emailOptions, payload.logger);
    payload.sendEmail = sendEmail_1.default.bind(payload);
    // Initialize collections & globals
    (0, init_2.default)(payload);
    (0, init_4.default)(payload);
    if (!payload.config.graphQL.disable) {
        (0, registerSchema_1.default)(payload);
    }
    payload.preferences = { Model: model_1.default };
    // If not initializing locally, set up HTTP routing
    if (!payload.local) {
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
        (0, init_3.default)(payload);
        payload.router.get('/access', access_1.default);
        if (!payload.config.graphQL.disable) {
            payload.router.use(payload.config.routes.graphQL, (req, res, next) => {
                if (req.method === 'OPTIONS') {
                    res.sendStatus(204);
                }
                else {
                    next();
                }
            }, (0, identifyAPI_1.default)('GraphQL'), (req, res) => (0, graphQLHandler_1.default)(req, res)(req, res));
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
    (0, serverInit_1.serverInit)(payload);
};
exports.init = init;
const initAsync = async (payload, options) => {
    payload.logger = (0, logger_1.default)('payload', options.loggerOptions);
    payload.mongoURL = options.mongoURL;
    if (payload.mongoURL) {
        mongoose_1.default.set('strictQuery', false);
        payload.mongoMemoryServer = await (0, connect_1.default)(payload.mongoURL, options.mongoOptions, payload.logger);
    }
    (0, exports.init)(payload, options);
    if (typeof options.onInit === 'function')
        await options.onInit(payload);
    if (typeof payload.config.onInit === 'function')
        await payload.config.onInit(payload);
};
exports.initAsync = initAsync;
const initSync = (payload, options) => {
    payload.logger = (0, logger_1.default)('payload', options.loggerOptions);
    payload.mongoURL = options.mongoURL;
    if (payload.mongoURL) {
        mongoose_1.default.set('strictQuery', false);
        (0, connect_1.default)(payload.mongoURL, options.mongoOptions, payload.logger);
    }
    (0, exports.init)(payload, options);
    if (typeof options.onInit === 'function')
        options.onInit(payload);
    if (typeof payload.config.onInit === 'function')
        payload.config.onInit(payload);
};
exports.initSync = initSync;
//# sourceMappingURL=init.js.map