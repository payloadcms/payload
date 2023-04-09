"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const schema_1 = __importDefault(require("./schema"));
const schema_2 = __importDefault(require("../collections/config/schema"));
const schema_3 = __importStar(require("../fields/config/schema"));
const schema_4 = __importDefault(require("../globals/config/schema"));
const types_1 = require("../fields/config/types");
const validateFields = (context, entity) => {
    const errors = [];
    entity.fields.forEach((field) => {
        let idResult = { error: null };
        if ((0, types_1.fieldAffectsData)(field) && field.name === 'id') {
            idResult = schema_3.idField.validate(field, { abortEarly: false });
        }
        const result = schema_3.default.validate(field, { abortEarly: false });
        if (idResult.error) {
            idResult.error.details.forEach(({ message }) => {
                errors.push(`${context} "${entity.slug}" > Field${(0, types_1.fieldAffectsData)(field) ? ` "${field.name}" >` : ''} ${message}`);
            });
        }
        if (result.error) {
            result.error.details.forEach(({ message }) => {
                errors.push(`${context} "${entity.slug}" > Field${(0, types_1.fieldAffectsData)(field) ? ` "${field.name}" >` : ''} ${message}`);
            });
        }
    });
    return errors;
};
const validateCollections = async (collections) => {
    const errors = [];
    collections.forEach((collection) => {
        const result = schema_2.default.validate(collection, { abortEarly: false });
        if (result.error) {
            result.error.details.forEach(({ message }) => {
                errors.push(`Collection "${collection.slug}" > ${message}`);
            });
        }
        errors.push(...validateFields('Collection', collection));
    });
    return errors;
};
const validateGlobals = (globals) => {
    const errors = [];
    globals.forEach((global) => {
        const result = schema_4.default.validate(global, { abortEarly: false });
        if (result.error) {
            result.error.details.forEach(({ message }) => {
                errors.push(`Globals "${global.slug}" > ${message}`);
            });
        }
        errors.push(...validateFields('Global', global));
    });
    return errors;
};
const validateSchema = async (config, logger) => {
    var _a, _b;
    const result = schema_1.default.validate(config, {
        abortEarly: false,
    });
    const nestedErrors = [
        ...await validateCollections(config.collections),
        ...validateGlobals(config.globals),
    ];
    if (result.error || nestedErrors.length > 0) {
        logger.error(`There were ${(((_b = (_a = result.error) === null || _a === void 0 ? void 0 : _a.details) === null || _b === void 0 ? void 0 : _b.length) || 0) + nestedErrors.length} errors validating your Payload config`);
        let i = 0;
        if (result.error) {
            result.error.details.forEach(({ message }) => {
                i += 1;
                logger.error(`${i}: ${message}`);
            });
        }
        nestedErrors.forEach((message) => {
            i += 1;
            logger.error(`${i}: ${message}`);
        });
        process.exit(1);
    }
    return result.value;
};
exports.default = validateSchema;
//# sourceMappingURL=validate.js.map