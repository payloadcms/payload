import joi from 'joi';
import { componentSchema } from '../../utilities/componentSchema';

export const baseAdminComponentFields = joi.object().keys({
  Cell: componentSchema,
  Field: componentSchema,
  Filter: componentSchema,
}).default({});

export const baseAdminFields = joi.object().keys({
  description: joi.alternatives().try(
    joi.string(),
    joi.object().pattern(joi.string(), [joi.string()]),
    componentSchema,
  ),
  position: joi.string().valid('sidebar'),
  width: joi.string(),
  style: joi.object().unknown(),
  className: joi.string(),
  readOnly: joi.boolean().default(false),
  initCollapsed: joi.boolean().default(false),
  hidden: joi.boolean().default(false),
  disabled: joi.boolean().default(false),
  disableBulkEdit: joi.boolean().default(false),
  condition: joi.func(),
  components: baseAdminComponentFields,
});

export const baseField = joi.object().keys({
  label: joi.alternatives().try(
    joi.object().pattern(joi.string(), [joi.string()]),
    joi.string(),
    joi.valid(false),
  ),
  required: joi.boolean().default(false),
  saveToJWT: joi.boolean().default(false),
  unique: joi.boolean().default(false),
  localized: joi.boolean().default(false),
  index: joi.boolean().default(false),
  hidden: joi.boolean().default(false),
  validate: joi.func(),
  access: joi.object().keys({
    create: joi.func(),
    read: joi.func(),
    update: joi.func(),
  }),
  hooks: joi.object()
    .keys({
      beforeValidate: joi.array().items(joi.func()).default([]),
      beforeChange: joi.array().items(joi.func()).default([]),
      afterChange: joi.array().items(joi.func()).default([]),
      afterRead: joi.array().items(joi.func()).default([]),
    }).default(),
  admin: baseAdminFields.default(),
  custom: joi.object().pattern(joi.string(), joi.any()),
}).default();

export const idField = baseField.keys({
  name: joi.string().valid('id'),
  type: joi.string().valid('text', 'number'),
  required: joi.not(false, 0).default(true),
  localized: joi.invalid(true),
});

export const text = baseField.keys({
  type: joi.string().valid('text').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.string(),
    joi.func(),
  ),
  minLength: joi.number(),
  maxLength: joi.number(),
  admin: baseAdminFields.keys({
    placeholder: joi.alternatives().try(
      joi.object().pattern(joi.string(), [joi.string()]),
      joi.string(),
    ),
    autoComplete: joi.string(),
  }),
});

export const number = baseField.keys({
  type: joi.string().valid('number').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.number(),
    joi.func(),
  ),
  min: joi.number(),
  max: joi.number(),
  admin: baseAdminFields.keys({
    placeholder: joi.string(),
    autoComplete: joi.string(),
    step: joi.number(),
  }),
});

export const textarea = baseField.keys({
  type: joi.string().valid('textarea').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.string(),
    joi.func(),
  ),
  minLength: joi.number(),
  maxLength: joi.number(),
  admin: baseAdminFields.keys({
    placeholder: joi.string(),
    rows: joi.number(),
  }),
});

export const email = baseField.keys({
  type: joi.string().valid('email').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.string(),
    joi.func(),
  ),
  minLength: joi.number(),
  maxLength: joi.number(),
  admin: baseAdminFields.keys({
    placeholder: joi.string(),
    autoComplete: joi.string(),
  }),
});

export const code = baseField.keys({
  type: joi.string().valid('code').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.string(),
    joi.func(),
  ),
  admin: baseAdminFields.keys({
    language: joi.string(),
  }),
});

export const json = baseField.keys({
  type: joi.string().valid('json').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.array(),
    joi.object(),
  ),
});

export const select = baseField.keys({
  type: joi.string().valid('select').required(),
  name: joi.string().required(),
  options: joi.array().min(1).items(
    joi.alternatives().try(
      joi.string(),
      joi.object({
        value: joi.string().required().allow(''),
        label: joi.alternatives().try(
          joi.string(),
          joi.object().pattern(joi.string(), [joi.string()]),
        ),
      }),
    ),
  ).required(),
  hasMany: joi.boolean().default(false),
  defaultValue: joi.alternatives().try(
    joi.string().allow(''),
    joi.array().items(joi.string().allow('')),
    joi.func(),
  ),
  admin: baseAdminFields.keys({
    isClearable: joi.boolean().default(false),
    isSortable: joi.boolean().default(false),
  }),
});

export const radio = baseField.keys({
  type: joi.string().valid('radio').required(),
  name: joi.string().required(),
  options: joi.array().min(1).items(
    joi.alternatives().try(
      joi.string(),
      joi.object({
        value: joi.string().required().allow(''),
        label: joi.alternatives().try(
          joi.string(),
          joi.object().pattern(joi.string(), [joi.string()]),
        ).required(),
      }),
    ),
  ).required(),
  defaultValue: joi.alternatives().try(
    joi.string().allow(''),
    joi.func(),
  ),
  admin: baseAdminFields.keys({
    layout: joi.string().valid('vertical', 'horizontal'),
  }),
});

export const row = baseField.keys({
  type: joi.string().valid('row').required(),
  fields: joi.array().items(joi.link('#field')),
  admin: baseAdminFields.default(),
});

export const collapsible = baseField.keys({
  label: joi.alternatives().try(
    joi.string(),
    componentSchema,
  ),
  type: joi.string().valid('collapsible').required(),
  fields: joi.array().items(joi.link('#field')),
  admin: baseAdminFields.default(),
});

const tab = baseField.keys({
  name: joi.string().when('localized', { is: joi.exist(), then: joi.required() }),
  localized: joi.boolean(),
  label: joi.alternatives().try(
    joi.string(),
    joi.object().pattern(joi.string(), [joi.string()]),
  ).required(),
  fields: joi.array().items(joi.link('#field')).required(),
  description: joi.alternatives().try(
    joi.string(),
    componentSchema,
  ),
});

export const tabs = baseField.keys({
  type: joi.string().valid('tabs').required(),
  fields: joi.forbidden(),
  localized: joi.forbidden(),
  tabs: joi.array().items(tab).required(),
  admin: baseAdminFields.keys({
    description: joi.forbidden(),
  }),
});

export const group = baseField.keys({
  type: joi.string().valid('group').required(),
  name: joi.string().required(),
  fields: joi.array().items(joi.link('#field')),
  defaultValue: joi.alternatives().try(
    joi.object(),
    joi.func(),
  ),
  admin: baseAdminFields.keys({
    hideGutter: joi.boolean().default(true),
  }),
});

export const array = baseField.keys({
  type: joi.string().valid('array').required(),
  name: joi.string().required(),
  minRows: joi.number(),
  maxRows: joi.number(),
  fields: joi.array().items(joi.link('#field')).required(),
  labels: joi.object({
    singular: joi.alternatives().try(
      joi.string(),
      joi.object().pattern(joi.string(), [joi.string()]),
    ),
    plural: joi.alternatives().try(
      joi.string(),
      joi.object().pattern(joi.string(), [joi.string()]),
    ),
  }),
  defaultValue: joi.alternatives().try(
    joi.array().items(joi.object()),
    joi.func(),
  ),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      RowLabel: componentSchema,
    }).default({}),
  }).default({}),
});

export const upload = baseField.keys({
  type: joi.string().valid('upload').required(),
  relationTo: joi.string().required(),
  name: joi.string().required(),
  maxDepth: joi.number(),
  filterOptions: joi.alternatives().try(
    joi.object(),
    joi.func(),
  ),
});

export const checkbox = baseField.keys({
  type: joi.string().valid('checkbox').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.boolean(),
    joi.func(),
  ),
});

export const point = baseField.keys({
  type: joi.string().valid('point').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.array().items(joi.number()).max(2).min(2),
    joi.func(),
  ),
});

export const relationship = baseField.keys({
  type: joi.string().valid('relationship').required(),
  hasMany: joi.boolean().default(false),
  relationTo: joi.alternatives().try(
    joi.string().required(),
    joi.array().items(joi.string()),
  ),
  name: joi.string().required(),
  maxDepth: joi.number(),
  filterOptions: joi.alternatives().try(
    joi.object(),
    joi.func(),
  ),
  defaultValue: joi.alternatives().try(
    joi.func(),
  ),
  admin: baseAdminFields.keys({
    isSortable: joi.boolean().default(false),
    allowCreate: joi.boolean().default(true),
  }),
  min: joi.number()
    .when('hasMany', { is: joi.not(true), then: joi.forbidden() }),
  max: joi.number()
    .when('hasMany', { is: joi.not(true), then: joi.forbidden() }),
});

export const blocks = baseField.keys({
  type: joi.string().valid('blocks').required(),
  minRows: joi.number(),
  maxRows: joi.number(),
  name: joi.string().required(),
  labels: joi.object({
    singular: joi.alternatives().try(
      joi.string(),
      joi.object().pattern(joi.string(), [joi.string()]),
    ),
    plural: joi.alternatives().try(
      joi.string(),
      joi.object().pattern(joi.string(), [joi.string()]),
    ),
  }),
  blocks: joi.array().items(
    joi.object({
      slug: joi.string().required(),
      imageURL: joi.string(),
      imageAltText: joi.string(),
      graphQL: joi.object().keys({
        singularName: joi.string(),
      }),
      labels: joi.object({
        singular: joi.alternatives().try(
          joi.string(),
          joi.object().pattern(joi.string(), [joi.string()]),
        ),
        plural: joi.alternatives().try(
          joi.string(),
          joi.object().pattern(joi.string(), [joi.string()]),
        ),
      }),
      fields: joi.array().items(joi.link('#field')),
    }),
  ).required(),
  defaultValue: joi.alternatives().try(
    joi.array().items(joi.object()),
    joi.func(),
  ),
});

export const richText = baseField.keys({
  type: joi.string().valid('richText').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.array().items(joi.object()),
    joi.func(),
  ),
  admin: baseAdminFields.keys({
    placeholder: joi.string(),
    hideGutter: joi.boolean().default(true),
    elements: joi.array().items(
      joi.alternatives().try(
        joi.string(),
        joi.object({
          name: joi.string().required(),
          Button: componentSchema,
          Element: componentSchema,
          plugins: joi.array().items(componentSchema),
        }),
      ),
    ),
    leaves: joi.array().items(
      joi.alternatives().try(
        joi.string(),
        joi.object({
          name: joi.string().required(),
          Button: componentSchema,
          Leaf: componentSchema,
          plugins: joi.array().items(componentSchema),
        }),
      ),
    ),
    upload: joi.object({
      collections: joi.object().pattern(joi.string(), joi.object().keys({
        fields: joi.array().items(joi.link('#field')),
      })),
    }),
    link: joi.object({
      fields: joi.alternatives(
        joi.array().items(joi.link('#field')),
        joi.func(),
      ),
    }),
  }),
});

export const date = baseField.keys({
  type: joi.string().valid('date').required(),
  name: joi.string().required(),
  defaultValue: joi.alternatives().try(
    joi.string(),
    joi.func(),
  ),
  admin: baseAdminFields.keys({
    placeholder: joi.string(),
    date: joi.object({
      displayFormat: joi.string(),
      pickerAppearance: joi.string(),
      minDate: joi.date(),
      maxDate: joi.date(),
      minTime: joi.date(),
      maxTime: joi.date(),
      timeIntervals: joi.number(),
      timeFormat: joi.string(),
      monthsToShow: joi.number(),
    }),
  }),
});

export const ui = joi.object().keys({
  name: joi.string().required(),
  label: joi.string(),
  type: joi.string().valid('ui').required(),
  admin: joi.object().keys({
    position: joi.string().valid('sidebar'),
    width: joi.string(),
    condition: joi.func(),
    components: joi.object().keys({
      Cell: componentSchema,
      Field: componentSchema,
    }).default({}),
  }).default(),
});

const fieldSchema = joi.alternatives()
  .try(
    text,
    number,
    textarea,
    email,
    code,
    json,
    select,
    group,
    array,
    row,
    collapsible,
    tabs,
    radio,
    relationship,
    checkbox,
    upload,
    richText,
    blocks,
    date,
    point,
    ui,
  )
  .id('field');

export default fieldSchema;
