"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const componentSchema_1 = require("../../utilities/componentSchema");
const schema_1 = require("../../config/schema");
const globalSchema = joi_1.default.object().keys({
    slug: joi_1.default.string().required(),
    label: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
    admin: joi_1.default.object({
        hidden: joi_1.default.alternatives().try(joi_1.default.boolean(), joi_1.default.func()),
        group: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
        hideAPIURL: joi_1.default.boolean(),
        description: joi_1.default.alternatives().try(joi_1.default.string(), componentSchema_1.componentSchema),
        components: joi_1.default.object({
            views: joi_1.default.object({
                Edit: componentSchema_1.componentSchema,
            }),
        }),
        preview: joi_1.default.func(),
    }),
    typescript: joi_1.default.object().keys({
        interface: joi_1.default.string(),
    }),
    graphQL: joi_1.default.object().keys({
        name: joi_1.default.string(),
    }),
    hooks: joi_1.default.object({
        beforeValidate: joi_1.default.array().items(joi_1.default.func()),
        beforeChange: joi_1.default.array().items(joi_1.default.func()),
        afterChange: joi_1.default.array().items(joi_1.default.func()),
        beforeRead: joi_1.default.array().items(joi_1.default.func()),
        afterRead: joi_1.default.array().items(joi_1.default.func()),
    }),
    endpoints: schema_1.endpointsSchema,
    access: joi_1.default.object({
        read: joi_1.default.func(),
        readVersions: joi_1.default.func(),
        update: joi_1.default.func(),
    }),
    fields: joi_1.default.array(),
    versions: joi_1.default.alternatives().try(joi_1.default.object({
        max: joi_1.default.number(),
        drafts: joi_1.default.alternatives().try(joi_1.default.object({
            autosave: joi_1.default.alternatives().try(joi_1.default.boolean(), joi_1.default.object({
                interval: joi_1.default.number(),
            })),
        }), joi_1.default.boolean()),
    }), joi_1.default.boolean()),
    custom: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.any()),
}).unknown();
exports.default = globalSchema;
//# sourceMappingURL=schema.js.map