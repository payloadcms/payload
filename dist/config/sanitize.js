"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepmerge_1 = __importDefault(require("deepmerge"));
const is_plain_object_1 = require("is-plain-object");
const defaultUser_1 = __importDefault(require("../auth/defaultUser"));
const sanitize_1 = __importDefault(require("../collections/config/sanitize"));
const errors_1 = require("../errors");
const sanitize_2 = __importDefault(require("../globals/config/sanitize"));
const checkDuplicateCollections_1 = __importDefault(require("../utilities/checkDuplicateCollections"));
const defaults_1 = require("./defaults");
const sanitizeConfig = (config) => {
    const sanitizedConfig = (0, deepmerge_1.default)(defaults_1.defaults, config, {
        isMergeableObject: is_plain_object_1.isPlainObject,
    });
    if (!sanitizedConfig.admin.user) {
        const firstCollectionWithAuth = sanitizedConfig.collections.find((c) => c.auth);
        if (firstCollectionWithAuth) {
            sanitizedConfig.admin.user = firstCollectionWithAuth.slug;
        }
        else {
            sanitizedConfig.admin.user = 'users';
            const sanitizedDefaultUser = (0, sanitize_1.default)(sanitizedConfig, defaultUser_1.default);
            sanitizedConfig.collections.push(sanitizedDefaultUser);
        }
    }
    else if (!sanitizedConfig.collections.find((c) => c.slug === sanitizedConfig.admin.user)) {
        throw new errors_1.InvalidConfiguration(`${sanitizedConfig.admin.user} is not a valid admin user collection`);
    }
    sanitizedConfig.collections = sanitizedConfig.collections.map((collection) => (0, sanitize_1.default)(sanitizedConfig, collection));
    (0, checkDuplicateCollections_1.default)(sanitizedConfig.collections);
    if (sanitizedConfig.globals.length > 0) {
        sanitizedConfig.globals = (0, sanitize_2.default)(sanitizedConfig.collections, sanitizedConfig.globals);
    }
    if (typeof sanitizedConfig.serverURL === 'undefined') {
        sanitizedConfig.serverURL = '';
    }
    if (sanitizedConfig.serverURL !== '') {
        sanitizedConfig.csrf.push(sanitizedConfig.serverURL);
    }
    return sanitizedConfig;
};
exports.default = sanitizeConfig;
//# sourceMappingURL=sanitize.js.map