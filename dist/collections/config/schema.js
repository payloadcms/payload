"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const componentSchema_1 = require("../../utilities/componentSchema");
const schema_1 = require("../../config/schema");
const strategyBaseSchema = joi_1.default.object().keys({
    refresh: joi_1.default.boolean(),
    logout: joi_1.default.boolean(),
});
const collectionSchema = joi_1.default.object().keys({
    slug: joi_1.default.string().required(),
    labels: joi_1.default.object({
        singular: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
        plural: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
    }),
    access: joi_1.default.object({
        create: joi_1.default.func(),
        read: joi_1.default.func(),
        readVersions: joi_1.default.func(),
        update: joi_1.default.func(),
        delete: joi_1.default.func(),
        unlock: joi_1.default.func(),
        admin: joi_1.default.func(),
    }),
    defaultSort: joi_1.default.string(),
    graphQL: joi_1.default.object().keys({
        singularName: joi_1.default.string(),
        pluralName: joi_1.default.string(),
    }),
    typescript: joi_1.default.object().keys({
        interface: joi_1.default.string(),
    }),
    timestamps: joi_1.default.boolean(),
    admin: joi_1.default.object({
        hidden: joi_1.default.alternatives().try(joi_1.default.boolean(), joi_1.default.func()),
        useAsTitle: joi_1.default.string(),
        defaultColumns: joi_1.default.array().items(joi_1.default.string()),
        listSearchableFields: joi_1.default.array().items(joi_1.default.string()),
        group: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
        description: joi_1.default.alternatives().try(joi_1.default.string(), componentSchema_1.componentSchema),
        hooks: joi_1.default.object({
            beforeDuplicate: joi_1.default.func(),
        }),
        enableRichTextRelationship: joi_1.default.boolean(),
        components: joi_1.default.object({
            views: joi_1.default.object({
                List: componentSchema_1.componentSchema,
                Edit: componentSchema_1.componentSchema,
            }),
        }),
        pagination: joi_1.default.object({
            defaultLimit: joi_1.default.number(),
            limits: joi_1.default.array().items(joi_1.default.number()),
        }),
        preview: joi_1.default.func(),
        disableDuplicate: joi_1.default.bool(),
        hideAPIURL: joi_1.default.bool(),
    }),
    fields: joi_1.default.array(),
    indexes: joi_1.default.array().items(joi_1.default.object().keys({
        fields: joi_1.default.object().required(),
        options: joi_1.default.object(),
    })),
    hooks: joi_1.default.object({
        beforeOperation: joi_1.default.array().items(joi_1.default.func()),
        beforeValidate: joi_1.default.array().items(joi_1.default.func()),
        beforeChange: joi_1.default.array().items(joi_1.default.func()),
        afterChange: joi_1.default.array().items(joi_1.default.func()),
        beforeRead: joi_1.default.array().items(joi_1.default.func()),
        afterRead: joi_1.default.array().items(joi_1.default.func()),
        beforeDelete: joi_1.default.array().items(joi_1.default.func()),
        afterDelete: joi_1.default.array().items(joi_1.default.func()),
        beforeLogin: joi_1.default.array().items(joi_1.default.func()),
        afterLogin: joi_1.default.array().items(joi_1.default.func()),
        afterLogout: joi_1.default.array().items(joi_1.default.func()),
        afterMe: joi_1.default.array().items(joi_1.default.func()),
        afterRefresh: joi_1.default.array().items(joi_1.default.func()),
        afterForgotPassword: joi_1.default.array().items(joi_1.default.func()),
    }),
    endpoints: schema_1.endpointsSchema,
    auth: joi_1.default.alternatives().try(joi_1.default.object({
        tokenExpiration: joi_1.default.number(),
        depth: joi_1.default.number(),
        verify: joi_1.default.alternatives().try(joi_1.default.boolean(), joi_1.default.object().keys({
            generateEmailHTML: joi_1.default.func(),
            generateEmailSubject: joi_1.default.func(),
        })),
        lockTime: joi_1.default.number(),
        useAPIKey: joi_1.default.boolean(),
        cookies: joi_1.default.object().keys({
            secure: joi_1.default.boolean(),
            sameSite: joi_1.default.string(),
            domain: joi_1.default.string(),
        }),
        forgotPassword: joi_1.default.object().keys({
            generateEmailHTML: joi_1.default.func(),
            generateEmailSubject: joi_1.default.func(),
        }),
        maxLoginAttempts: joi_1.default.number(),
        disableLocalStrategy: joi_1.default.boolean().valid(true),
        strategies: joi_1.default.array().items(joi_1.default.alternatives().try(strategyBaseSchema.keys({
            name: joi_1.default.string().required(),
            strategy: joi_1.default.func()
                .maxArity(1)
                .required(),
        }), strategyBaseSchema.keys({
            name: joi_1.default.string(),
            strategy: joi_1.default.object().required(),
        }))),
    }), joi_1.default.boolean()),
    versions: joi_1.default.alternatives().try(joi_1.default.object({
        maxPerDoc: joi_1.default.number(),
        drafts: joi_1.default.alternatives().try(joi_1.default.object({
            autosave: joi_1.default.alternatives().try(joi_1.default.boolean(), joi_1.default.object({
                interval: joi_1.default.number(),
            })),
        }), joi_1.default.boolean()),
    }), joi_1.default.boolean()),
    upload: joi_1.default.alternatives().try(joi_1.default.object({
        staticURL: joi_1.default.string(),
        staticDir: joi_1.default.string(),
        disableLocalStorage: joi_1.default.bool(),
        useTempFiles: joi_1.default.bool(),
        tempFileDir: joi_1.default.string(),
        adminThumbnail: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.func()),
        imageSizes: joi_1.default.array().items(joi_1.default.object().keys({
            name: joi_1.default.string(),
            width: joi_1.default.number().integer().allow(null),
            height: joi_1.default.number().integer().allow(null),
            crop: joi_1.default.string(), // TODO: add further specificity with joi.xor
        }).unknown()),
        mimeTypes: joi_1.default.array().items(joi_1.default.string()),
        staticOptions: joi_1.default.object(),
        handlers: joi_1.default.array().items(joi_1.default.func()),
        resizeOptions: joi_1.default.object().keys({
            width: joi_1.default.number().allow(null),
            height: joi_1.default.number().allow(null),
            fit: joi_1.default.string(),
            position: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.number()),
            background: joi_1.default.string(),
            kernel: joi_1.default.string(),
            withoutEnlargement: joi_1.default.bool(),
            fastShrinkOnLoad: joi_1.default.bool(),
        }).allow(null),
        formatOptions: joi_1.default.object().keys({
            format: joi_1.default.string(),
            options: joi_1.default.object(),
        }),
        trimOptions: joi_1.default.alternatives().try(joi_1.default.object().keys({
            format: joi_1.default.string(),
            options: joi_1.default.object(),
        }), joi_1.default.string(), joi_1.default.number()),
    }), joi_1.default.boolean()),
    custom: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.any()),
});
exports.default = collectionSchema;
//# sourceMappingURL=schema.js.map