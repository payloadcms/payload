"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ui = exports.date = exports.richText = exports.blocks = exports.relationship = exports.point = exports.checkbox = exports.upload = exports.array = exports.group = exports.tabs = exports.collapsible = exports.row = exports.radio = exports.select = exports.json = exports.code = exports.email = exports.textarea = exports.number = exports.text = exports.idField = exports.baseField = exports.baseAdminFields = exports.baseAdminComponentFields = void 0;
const joi_1 = __importDefault(require("joi"));
const componentSchema_1 = require("../../utilities/componentSchema");
exports.baseAdminComponentFields = joi_1.default.object().keys({
    Cell: componentSchema_1.componentSchema,
    Field: componentSchema_1.componentSchema,
    Filter: componentSchema_1.componentSchema,
}).default({});
exports.baseAdminFields = joi_1.default.object().keys({
    description: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()]), componentSchema_1.componentSchema),
    position: joi_1.default.string().valid('sidebar'),
    width: joi_1.default.string(),
    style: joi_1.default.object().unknown(),
    className: joi_1.default.string(),
    readOnly: joi_1.default.boolean().default(false),
    initCollapsed: joi_1.default.boolean().default(false),
    hidden: joi_1.default.boolean().default(false),
    disabled: joi_1.default.boolean().default(false),
    disableBulkEdit: joi_1.default.boolean().default(false),
    condition: joi_1.default.func(),
    components: exports.baseAdminComponentFields,
});
exports.baseField = joi_1.default.object().keys({
    label: joi_1.default.alternatives().try(joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()]), joi_1.default.string(), joi_1.default.valid(false)),
    required: joi_1.default.boolean().default(false),
    saveToJWT: joi_1.default.boolean().default(false),
    unique: joi_1.default.boolean().default(false),
    localized: joi_1.default.boolean().default(false),
    index: joi_1.default.boolean().default(false),
    hidden: joi_1.default.boolean().default(false),
    validate: joi_1.default.func(),
    access: joi_1.default.object().keys({
        create: joi_1.default.func(),
        read: joi_1.default.func(),
        update: joi_1.default.func(),
    }),
    hooks: joi_1.default.object()
        .keys({
        beforeValidate: joi_1.default.array().items(joi_1.default.func()).default([]),
        beforeChange: joi_1.default.array().items(joi_1.default.func()).default([]),
        afterChange: joi_1.default.array().items(joi_1.default.func()).default([]),
        afterRead: joi_1.default.array().items(joi_1.default.func()).default([]),
    }).default(),
    admin: exports.baseAdminFields.default(),
    custom: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.any()),
}).default();
exports.idField = exports.baseField.keys({
    name: joi_1.default.string().valid('id'),
    type: joi_1.default.string().valid('text', 'number'),
    required: joi_1.default.not(false, 0).default(true),
    localized: joi_1.default.invalid(true),
});
exports.text = exports.baseField.keys({
    type: joi_1.default.string().valid('text').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.func()),
    minLength: joi_1.default.number(),
    maxLength: joi_1.default.number(),
    admin: exports.baseAdminFields.keys({
        placeholder: joi_1.default.alternatives().try(joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()]), joi_1.default.string()),
        autoComplete: joi_1.default.string(),
    }),
});
exports.number = exports.baseField.keys({
    type: joi_1.default.string().valid('number').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.number(), joi_1.default.func()),
    min: joi_1.default.number(),
    max: joi_1.default.number(),
    admin: exports.baseAdminFields.keys({
        placeholder: joi_1.default.string(),
        autoComplete: joi_1.default.string(),
        step: joi_1.default.number(),
    }),
});
exports.textarea = exports.baseField.keys({
    type: joi_1.default.string().valid('textarea').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.func()),
    minLength: joi_1.default.number(),
    maxLength: joi_1.default.number(),
    admin: exports.baseAdminFields.keys({
        placeholder: joi_1.default.string(),
        rows: joi_1.default.number(),
    }),
});
exports.email = exports.baseField.keys({
    type: joi_1.default.string().valid('email').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.func()),
    minLength: joi_1.default.number(),
    maxLength: joi_1.default.number(),
    admin: exports.baseAdminFields.keys({
        placeholder: joi_1.default.string(),
        autoComplete: joi_1.default.string(),
    }),
});
exports.code = exports.baseField.keys({
    type: joi_1.default.string().valid('code').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.func()),
    admin: exports.baseAdminFields.keys({
        language: joi_1.default.string(),
    }),
});
exports.json = exports.baseField.keys({
    type: joi_1.default.string().valid('json').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.array(), joi_1.default.object()),
});
exports.select = exports.baseField.keys({
    type: joi_1.default.string().valid('select').required(),
    name: joi_1.default.string().required(),
    options: joi_1.default.array().min(1).items(joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object({
        value: joi_1.default.string().required().allow(''),
        label: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
    }))).required(),
    hasMany: joi_1.default.boolean().default(false),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.string().allow(''), joi_1.default.array().items(joi_1.default.string().allow('')), joi_1.default.func()),
    admin: exports.baseAdminFields.keys({
        isClearable: joi_1.default.boolean().default(false),
        isSortable: joi_1.default.boolean().default(false),
    }),
});
exports.radio = exports.baseField.keys({
    type: joi_1.default.string().valid('radio').required(),
    name: joi_1.default.string().required(),
    options: joi_1.default.array().min(1).items(joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object({
        value: joi_1.default.string().required().allow(''),
        label: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])).required(),
    }))).required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.string().allow(''), joi_1.default.func()),
    admin: exports.baseAdminFields.keys({
        layout: joi_1.default.string().valid('vertical', 'horizontal'),
    }),
});
exports.row = exports.baseField.keys({
    type: joi_1.default.string().valid('row').required(),
    fields: joi_1.default.array().items(joi_1.default.link('#field')),
    admin: exports.baseAdminFields.default(),
});
exports.collapsible = exports.baseField.keys({
    label: joi_1.default.alternatives().try(joi_1.default.string(), componentSchema_1.componentSchema),
    type: joi_1.default.string().valid('collapsible').required(),
    fields: joi_1.default.array().items(joi_1.default.link('#field')),
    admin: exports.baseAdminFields.default(),
});
const tab = exports.baseField.keys({
    name: joi_1.default.string().when('localized', { is: joi_1.default.exist(), then: joi_1.default.required() }),
    localized: joi_1.default.boolean(),
    label: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])).required(),
    fields: joi_1.default.array().items(joi_1.default.link('#field')).required(),
    description: joi_1.default.alternatives().try(joi_1.default.string(), componentSchema_1.componentSchema),
});
exports.tabs = exports.baseField.keys({
    type: joi_1.default.string().valid('tabs').required(),
    fields: joi_1.default.forbidden(),
    localized: joi_1.default.forbidden(),
    tabs: joi_1.default.array().items(tab).required(),
    admin: exports.baseAdminFields.keys({
        description: joi_1.default.forbidden(),
    }),
});
exports.group = exports.baseField.keys({
    type: joi_1.default.string().valid('group').required(),
    name: joi_1.default.string().required(),
    fields: joi_1.default.array().items(joi_1.default.link('#field')),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.object(), joi_1.default.func()),
    admin: exports.baseAdminFields.keys({
        hideGutter: joi_1.default.boolean().default(true),
    }),
});
exports.array = exports.baseField.keys({
    type: joi_1.default.string().valid('array').required(),
    name: joi_1.default.string().required(),
    minRows: joi_1.default.number(),
    maxRows: joi_1.default.number(),
    fields: joi_1.default.array().items(joi_1.default.link('#field')).required(),
    labels: joi_1.default.object({
        singular: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
        plural: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
    }),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.array().items(joi_1.default.object()), joi_1.default.func()),
    admin: exports.baseAdminFields.keys({
        components: exports.baseAdminComponentFields.keys({
            RowLabel: componentSchema_1.componentSchema,
        }).default({}),
    }).default({}),
});
exports.upload = exports.baseField.keys({
    type: joi_1.default.string().valid('upload').required(),
    relationTo: joi_1.default.string().required(),
    name: joi_1.default.string().required(),
    maxDepth: joi_1.default.number(),
    filterOptions: joi_1.default.alternatives().try(joi_1.default.object(), joi_1.default.func()),
});
exports.checkbox = exports.baseField.keys({
    type: joi_1.default.string().valid('checkbox').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.boolean(), joi_1.default.func()),
});
exports.point = exports.baseField.keys({
    type: joi_1.default.string().valid('point').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.array().items(joi_1.default.number()).max(2).min(2), joi_1.default.func()),
});
exports.relationship = exports.baseField.keys({
    type: joi_1.default.string().valid('relationship').required(),
    hasMany: joi_1.default.boolean().default(false),
    relationTo: joi_1.default.alternatives().try(joi_1.default.string().required(), joi_1.default.array().items(joi_1.default.string())),
    name: joi_1.default.string().required(),
    maxDepth: joi_1.default.number(),
    filterOptions: joi_1.default.alternatives().try(joi_1.default.object(), joi_1.default.func()),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.func()),
    admin: exports.baseAdminFields.keys({
        isSortable: joi_1.default.boolean().default(false),
        allowCreate: joi_1.default.boolean().default(true),
    }),
    min: joi_1.default.number()
        .when('hasMany', { is: joi_1.default.not(true), then: joi_1.default.forbidden() }),
    max: joi_1.default.number()
        .when('hasMany', { is: joi_1.default.not(true), then: joi_1.default.forbidden() }),
});
exports.blocks = exports.baseField.keys({
    type: joi_1.default.string().valid('blocks').required(),
    minRows: joi_1.default.number(),
    maxRows: joi_1.default.number(),
    name: joi_1.default.string().required(),
    labels: joi_1.default.object({
        singular: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
        plural: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
    }),
    blocks: joi_1.default.array().items(joi_1.default.object({
        slug: joi_1.default.string().required(),
        imageURL: joi_1.default.string(),
        imageAltText: joi_1.default.string(),
        graphQL: joi_1.default.object().keys({
            singularName: joi_1.default.string(),
        }),
        labels: joi_1.default.object({
            singular: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
            plural: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), [joi_1.default.string()])),
        }),
        fields: joi_1.default.array().items(joi_1.default.link('#field')),
    })).required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.array().items(joi_1.default.object()), joi_1.default.func()),
});
exports.richText = exports.baseField.keys({
    type: joi_1.default.string().valid('richText').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.array().items(joi_1.default.object()), joi_1.default.func()),
    admin: exports.baseAdminFields.keys({
        placeholder: joi_1.default.string(),
        hideGutter: joi_1.default.boolean().default(true),
        elements: joi_1.default.array().items(joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object({
            name: joi_1.default.string().required(),
            Button: componentSchema_1.componentSchema,
            Element: componentSchema_1.componentSchema,
            plugins: joi_1.default.array().items(componentSchema_1.componentSchema),
        }))),
        leaves: joi_1.default.array().items(joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object({
            name: joi_1.default.string().required(),
            Button: componentSchema_1.componentSchema,
            Leaf: componentSchema_1.componentSchema,
            plugins: joi_1.default.array().items(componentSchema_1.componentSchema),
        }))),
        upload: joi_1.default.object({
            collections: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.object().keys({
                fields: joi_1.default.array().items(joi_1.default.link('#field')),
            })),
        }),
        link: joi_1.default.object({
            fields: joi_1.default.array().items(joi_1.default.link('#field')),
        }),
    }),
});
exports.date = exports.baseField.keys({
    type: joi_1.default.string().valid('date').required(),
    name: joi_1.default.string().required(),
    defaultValue: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.func()),
    admin: exports.baseAdminFields.keys({
        placeholder: joi_1.default.string(),
        date: joi_1.default.object({
            displayFormat: joi_1.default.string(),
            pickerAppearance: joi_1.default.string(),
            minDate: joi_1.default.date(),
            maxDate: joi_1.default.date(),
            minTime: joi_1.default.date(),
            maxTime: joi_1.default.date(),
            timeIntervals: joi_1.default.number(),
            timeFormat: joi_1.default.string(),
            monthsToShow: joi_1.default.number(),
        }),
    }),
});
exports.ui = joi_1.default.object().keys({
    name: joi_1.default.string().required(),
    label: joi_1.default.string(),
    type: joi_1.default.string().valid('ui').required(),
    admin: joi_1.default.object().keys({
        position: joi_1.default.string().valid('sidebar'),
        width: joi_1.default.string(),
        condition: joi_1.default.func(),
        components: joi_1.default.object().keys({
            Cell: componentSchema_1.componentSchema,
            Field: componentSchema_1.componentSchema,
        }).default({}),
    }).default(),
});
const fieldSchema = joi_1.default.alternatives()
    .try(exports.text, exports.number, exports.textarea, exports.email, exports.code, exports.json, exports.select, exports.group, exports.array, exports.row, exports.collapsible, exports.tabs, exports.radio, exports.relationship, exports.checkbox, exports.upload, exports.richText, exports.blocks, exports.date, exports.point, exports.ui)
    .id('field');
exports.default = fieldSchema;
//# sourceMappingURL=schema.js.map