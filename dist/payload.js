"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayload = exports.BasePayload = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const local_1 = __importDefault(require("./collections/operations/local"));
const local_2 = __importDefault(require("./globals/operations/local"));
const crypto_2 = require("./auth/crypto");
const connect_1 = __importDefault(require("./mongoose/connect"));
const initLocal_1 = __importDefault(require("./collections/initLocal"));
const initLocal_2 = __importDefault(require("./globals/initLocal"));
const registerSchema_1 = __importDefault(require("./graphql/registerSchema"));
const build_1 = __importDefault(require("./email/build"));
const sendEmail_1 = __importDefault(require("./email/sendEmail"));
const serverInit_1 = require("./utilities/telemetry/events/serverInit");
const logger_1 = __importDefault(require("./utilities/logger"));
const model_1 = __importDefault(require("./preferences/model"));
const find_1 = __importDefault(require("./config/find"));
/**
 * @description Payload
 */
class BasePayload {
    constructor() {
        this.collections = {};
        this.versions = {};
        this.encrypt = crypto_2.encrypt;
        this.decrypt = crypto_2.decrypt;
        this.Query = { name: 'Query', fields: {} };
        this.Mutation = { name: 'Mutation', fields: {} };
        this.errorResponses = [];
        this.getAdminURL = () => `${this.config.serverURL}${this.config.routes.admin}`;
        this.getAPIURL = () => `${this.config.serverURL}${this.config.routes.api}`;
        /**
         * @description Performs create operation
         * @param options
         * @returns created document
         */
        this.create = async (options) => {
            const { create } = local_1.default;
            return create(this, options);
        };
        /**
         * @description Find documents with criteria
         * @param options
         * @returns documents satisfying query
         */
        this.find = async (options) => {
            const { find } = local_1.default;
            return find(this, options);
        };
        /**
         * @description Find document by ID
         * @param options
         * @returns document with specified ID
         */
        this.findByID = async (options) => {
            const { findByID } = local_1.default;
            return findByID(this, options);
        };
        /**
         * @description Find versions with criteria
         * @param options
         * @returns versions satisfying query
         */
        this.findVersions = async (options) => {
            const { findVersions } = local_1.default;
            return findVersions(this, options);
        };
        /**
         * @description Find version by ID
         * @param options
         * @returns version with specified ID
         */
        this.findVersionByID = async (options) => {
            const { findVersionByID } = local_1.default;
            return findVersionByID(this, options);
        };
        /**
         * @description Restore version by ID
         * @param options
         * @returns version with specified ID
         */
        this.restoreVersion = async (options) => {
            const { restoreVersion } = local_1.default;
            return restoreVersion(this, options);
        };
        this.login = async (options) => {
            const { login } = local_1.default.auth;
            return login(this, options);
        };
        this.forgotPassword = async (options) => {
            const { forgotPassword } = local_1.default.auth;
            return forgotPassword(this, options);
        };
        this.resetPassword = async (options) => {
            const { resetPassword } = local_1.default.auth;
            return resetPassword(this, options);
        };
        this.unlock = async (options) => {
            const { unlock } = local_1.default.auth;
            return unlock(this, options);
        };
        this.verifyEmail = async (options) => {
            const { verifyEmail } = local_1.default.auth;
            return verifyEmail(this, options);
        };
        this.findGlobal = async (options) => {
            const { findOne } = local_2.default;
            return findOne(this, options);
        };
        this.updateGlobal = async (options) => {
            const { update } = local_2.default;
            return update(this, options);
        };
        /**
         * @description Find global versions with criteria
         * @param options
         * @returns versions satisfying query
         */
        this.findGlobalVersions = async (options) => {
            const { findVersions } = local_2.default;
            return findVersions(this, options);
        };
        /**
         * @description Find global version by ID
         * @param options
         * @returns global version with specified ID
         */
        this.findGlobalVersionByID = async (options) => {
            const { findVersionByID } = local_2.default;
            return findVersionByID(this, options);
        };
        /**
         * @description Restore global version by ID
         * @param options
         * @returns version with specified ID
         */
        this.restoreGlobalVersion = async (options) => {
            const { restoreVersion } = local_2.default;
            return restoreVersion(this, options);
        };
    }
    /**
     * @description Initializes Payload
     * @param options
     */
    async init(options) {
        this.logger = (0, logger_1.default)('payload', options.loggerOptions);
        this.mongoURL = options.mongoURL;
        this.mongoOptions = options.mongoOptions;
        if (this.mongoURL) {
            mongoose_1.default.set('strictQuery', false);
            this.mongoMemoryServer = await (0, connect_1.default)(this.mongoURL, options.mongoOptions, this.logger);
        }
        this.logger.info('Starting Payload...');
        if (!options.secret) {
            throw new Error('Error: missing secret key. A secret key is needed to secure Payload.');
        }
        if (options.mongoURL !== false && typeof options.mongoURL !== 'string') {
            throw new Error('Error: missing MongoDB connection URL.');
        }
        this.emailOptions = { ...(options.email) };
        this.secret = crypto_1.default
            .createHash('sha256')
            .update(options.secret)
            .digest('hex')
            .slice(0, 32);
        this.local = options.local;
        if (options.config) {
            this.config = await options.config;
            const configPath = (0, find_1.default)();
            this.config = {
                ...this.config,
                paths: {
                    configDir: path_1.default.dirname(configPath),
                    config: configPath,
                    rawConfig: configPath,
                },
            };
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
            const loadConfig = require('./config/load').default;
            this.config = await loadConfig(this.logger);
        }
        // Configure email service
        this.email = (0, build_1.default)(this.emailOptions, this.logger);
        this.sendEmail = sendEmail_1.default.bind(this);
        // Initialize collections & globals
        (0, initLocal_1.default)(this);
        (0, initLocal_2.default)(this);
        if (!this.config.graphQL.disable) {
            (0, registerSchema_1.default)(this);
        }
        this.preferences = { Model: model_1.default };
        (0, serverInit_1.serverInit)(this);
        if (options.local !== false) {
            if (typeof options.onInit === 'function')
                await options.onInit(this);
            if (typeof this.config.onInit === 'function')
                await this.config.onInit(this);
        }
        return this;
    }
    update(options) {
        const { update } = local_1.default;
        return update(this, options);
    }
    delete(options) {
        const { deleteLocal } = local_1.default;
        return deleteLocal(this, options);
    }
}
exports.BasePayload = BasePayload;
let cached = global._payload;
if (!cached) {
    // eslint-disable-next-line no-multi-assign
    cached = global._payload = { payload: null, promise: null };
}
const getPayload = async (options) => {
    if (cached.payload) {
        return cached.payload;
    }
    if (!cached.promise) {
        cached.promise = new BasePayload().init(options);
    }
    try {
        cached.payload = await cached.promise;
    }
    catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.payload;
};
exports.getPayload = getPayload;
//# sourceMappingURL=payload.js.map