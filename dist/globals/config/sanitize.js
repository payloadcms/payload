"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepmerge_1 = __importDefault(require("deepmerge"));
const formatLabels_1 = require("../../utilities/formatLabels");
const sanitize_1 = __importDefault(require("../../fields/config/sanitize"));
const defaultAccess_1 = __importDefault(require("../../auth/defaultAccess"));
const baseFields_1 = __importDefault(require("../../versions/baseFields"));
const mergeBaseFields_1 = __importDefault(require("../../fields/mergeBaseFields"));
const defaults_1 = require("../../versions/defaults");
const sanitizeGlobals = (collections, globals) => {
    const sanitizedGlobals = globals.map((global) => {
        const sanitizedGlobal = { ...global };
        sanitizedGlobal.label = sanitizedGlobal.label || (0, formatLabels_1.toWords)(sanitizedGlobal.slug);
        // /////////////////////////////////
        // Ensure that collection has required object structure
        // /////////////////////////////////
        if (!sanitizedGlobal.hooks)
            sanitizedGlobal.hooks = {};
        if (!sanitizedGlobal.endpoints)
            sanitizedGlobal.endpoints = [];
        if (!sanitizedGlobal.access)
            sanitizedGlobal.access = {};
        if (!sanitizedGlobal.admin)
            sanitizedGlobal.admin = {};
        if (!sanitizedGlobal.access.read)
            sanitizedGlobal.access.read = defaultAccess_1.default;
        if (!sanitizedGlobal.access.update)
            sanitizedGlobal.access.update = defaultAccess_1.default;
        if (!sanitizedGlobal.hooks.beforeValidate)
            sanitizedGlobal.hooks.beforeValidate = [];
        if (!sanitizedGlobal.hooks.beforeChange)
            sanitizedGlobal.hooks.beforeChange = [];
        if (!sanitizedGlobal.hooks.afterChange)
            sanitizedGlobal.hooks.afterChange = [];
        if (!sanitizedGlobal.hooks.beforeRead)
            sanitizedGlobal.hooks.beforeRead = [];
        if (!sanitizedGlobal.hooks.afterRead)
            sanitizedGlobal.hooks.afterRead = [];
        if (sanitizedGlobal.versions) {
            if (sanitizedGlobal.versions === true)
                sanitizedGlobal.versions = { drafts: false };
            if (sanitizedGlobal.versions.drafts) {
                if (sanitizedGlobal.versions.drafts === true) {
                    sanitizedGlobal.versions.drafts = {
                        autosave: false,
                    };
                }
                if (sanitizedGlobal.versions.drafts.autosave === true)
                    sanitizedGlobal.versions.drafts.autosave = {};
                sanitizedGlobal.fields = (0, mergeBaseFields_1.default)(sanitizedGlobal.fields, baseFields_1.default);
            }
            sanitizedGlobal.versions = (0, deepmerge_1.default)(defaults_1.versionGlobalDefaults, sanitizedGlobal.versions);
        }
        // /////////////////////////////////
        // Sanitize fields
        // /////////////////////////////////
        const validRelationships = collections.map((c) => c.slug);
        sanitizedGlobal.fields = (0, sanitize_1.default)(sanitizedGlobal.fields, validRelationships);
        return sanitizedGlobal;
    });
    return sanitizedGlobals;
};
exports.default = sanitizeGlobals;
//# sourceMappingURL=sanitize.js.map