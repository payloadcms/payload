"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepmerge_1 = __importDefault(require("deepmerge"));
const is_plain_object_1 = require("is-plain-object");
const sanitize_1 = __importDefault(require("../../fields/config/sanitize"));
const auth_1 = __importDefault(require("../../auth/baseFields/auth"));
const apiKey_1 = __importDefault(require("../../auth/baseFields/apiKey"));
const verification_1 = __importDefault(require("../../auth/baseFields/verification"));
const accountLock_1 = __importDefault(require("../../auth/baseFields/accountLock"));
const getBaseFields_1 = __importDefault(require("../../uploads/getBaseFields"));
const formatLabels_1 = require("../../utilities/formatLabels");
const defaults_1 = require("./defaults");
const defaults_2 = require("../../versions/defaults");
const baseFields_1 = __importDefault(require("../../versions/baseFields"));
const TimestampsRequired_1 = __importDefault(require("../../errors/TimestampsRequired"));
const mergeBaseFields_1 = __importDefault(require("../../fields/mergeBaseFields"));
const sanitizeCollection = (config, collection) => {
    // /////////////////////////////////
    // Make copy of collection config
    // /////////////////////////////////
    const sanitized = (0, deepmerge_1.default)(defaults_1.defaults, collection, {
        isMergeableObject: is_plain_object_1.isPlainObject,
    });
    sanitized.labels = sanitized.labels || (0, formatLabels_1.formatLabels)(sanitized.slug);
    if (sanitized.versions) {
        if (sanitized.versions === true)
            sanitized.versions = { drafts: false };
        if (sanitized.timestamps === false) {
            throw new TimestampsRequired_1.default(collection);
        }
        if (sanitized.versions.drafts) {
            if (sanitized.versions.drafts === true) {
                sanitized.versions.drafts = {
                    autosave: false,
                };
            }
            if (sanitized.versions.drafts.autosave === true)
                sanitized.versions.drafts.autosave = {};
            sanitized.fields = (0, mergeBaseFields_1.default)(sanitized.fields, baseFields_1.default);
        }
        sanitized.versions = (0, deepmerge_1.default)(defaults_2.versionCollectionDefaults, sanitized.versions);
    }
    if (sanitized.upload) {
        if (sanitized.upload === true)
            sanitized.upload = {};
        sanitized.upload.staticDir = sanitized.upload.staticDir || sanitized.slug;
        sanitized.upload.staticURL = sanitized.upload.staticURL || `/${sanitized.slug}`;
        sanitized.admin.useAsTitle = (sanitized.admin.useAsTitle && sanitized.admin.useAsTitle !== 'id') ? sanitized.admin.useAsTitle : 'filename';
        const uploadFields = (0, getBaseFields_1.default)({
            config,
            collection: sanitized,
        });
        sanitized.fields = (0, mergeBaseFields_1.default)(sanitized.fields, uploadFields);
    }
    if (sanitized.auth) {
        sanitized.auth = (0, deepmerge_1.default)(defaults_1.authDefaults, typeof sanitized.auth === 'object' ? sanitized.auth : {}, {
            isMergeableObject: is_plain_object_1.isPlainObject,
        });
        let authFields = [];
        if (sanitized.auth.useAPIKey) {
            authFields = authFields.concat(apiKey_1.default);
        }
        if (!sanitized.auth.disableLocalStrategy) {
            authFields = authFields.concat(auth_1.default);
            if (sanitized.auth.verify) {
                if (sanitized.auth.verify === true)
                    sanitized.auth.verify = {};
                authFields = authFields.concat(verification_1.default);
            }
            if (sanitized.auth.maxLoginAttempts > 0) {
                authFields = authFields.concat(accountLock_1.default);
            }
        }
        sanitized.fields = (0, mergeBaseFields_1.default)(sanitized.fields, authFields);
    }
    // /////////////////////////////////
    // Sanitize fields
    // /////////////////////////////////
    const validRelationships = config.collections.map((c) => c.slug);
    sanitized.fields = (0, sanitize_1.default)(sanitized.fields, validRelationships);
    return sanitized;
};
exports.default = sanitizeCollection;
//# sourceMappingURL=sanitize.js.map