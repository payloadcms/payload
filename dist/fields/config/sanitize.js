"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const formatLabels_1 = require("../../utilities/formatLabels");
const errors_1 = require("../../errors");
const baseBlockFields_1 = require("../baseFields/baseBlockFields");
const validations_1 = __importDefault(require("../validations"));
const baseIDField_1 = require("../baseFields/baseIDField");
const types_1 = require("./types");
const withCondition_1 = __importDefault(require("../../admin/components/forms/withCondition"));
const sanitizeFields = (fields, validRelationships) => {
    if (!fields)
        return [];
    return fields.map((unsanitizedField) => {
        var _a, _b;
        const field = { ...unsanitizedField };
        if (!field.type)
            throw new errors_1.MissingFieldType(field);
        // assert that field names do not contain forbidden characters
        if ((0, types_1.fieldAffectsData)(field) && field.name.includes('.')) {
            throw new errors_1.InvalidFieldName(field, field.name);
        }
        // Auto-label
        if ('name' in field && field.name && typeof field.label !== 'object' && typeof field.label !== 'string' && field.label !== false) {
            field.label = (0, formatLabels_1.toWords)(field.name);
        }
        if (field.type === 'checkbox' && typeof field.defaultValue === 'undefined' && field.required === true) {
            field.defaultValue = false;
        }
        if (field.type === 'relationship' || field.type === 'upload') {
            const relationships = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo];
            relationships.forEach((relationship) => {
                if (!validRelationships.includes(relationship)) {
                    throw new errors_1.InvalidFieldRelationship(field, relationship);
                }
            });
        }
        if (field.type === 'blocks' && field.blocks) {
            field.blocks = field.blocks.map((block) => ({ ...block, fields: block.fields.concat(baseBlockFields_1.baseBlockFields) }));
        }
        if (field.type === 'array' && field.fields) {
            field.fields.push(baseIDField_1.baseIDField);
        }
        if ((field.type === 'blocks' || field.type === 'array') && field.label) {
            field.labels = field.labels || (0, formatLabels_1.formatLabels)(field.name);
        }
        if ((0, types_1.fieldAffectsData)(field)) {
            if (typeof field.validate === 'undefined') {
                const defaultValidate = validations_1.default[field.type];
                if (defaultValidate) {
                    field.validate = (val, options) => defaultValidate(val, { ...field, ...options });
                }
                else {
                    field.validate = () => true;
                }
            }
            if (!field.hooks)
                field.hooks = {};
            if (!field.access)
                field.access = {};
        }
        if (field.admin) {
            if (field.admin.condition && ((_a = field.admin.components) === null || _a === void 0 ? void 0 : _a.Field)) {
                field.admin.components.Field = (0, withCondition_1.default)((_b = field.admin.components) === null || _b === void 0 ? void 0 : _b.Field);
            }
        }
        else {
            field.admin = {};
        }
        if ('fields' in field && field.fields)
            field.fields = sanitizeFields(field.fields, validRelationships);
        if (field.type === 'tabs') {
            field.tabs = field.tabs.map((tab) => {
                const unsanitizedTab = { ...tab };
                unsanitizedTab.fields = sanitizeFields(tab.fields, validRelationships);
                return unsanitizedTab;
            });
        }
        if ('blocks' in field && field.blocks) {
            field.blocks = field.blocks.map((block) => {
                const unsanitizedBlock = { ...block };
                unsanitizedBlock.labels = !unsanitizedBlock.labels ? (0, formatLabels_1.formatLabels)(unsanitizedBlock.slug) : unsanitizedBlock.labels;
                unsanitizedBlock.fields = sanitizeFields(block.fields, validRelationships);
                return unsanitizedBlock;
            });
        }
        return field;
    });
};
exports.default = sanitizeFields;
//# sourceMappingURL=sanitize.js.map