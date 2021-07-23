import joi from 'joi';

const component = joi.alternatives().try(
  joi.object().unknown(),
  joi.func(),
);

export const baseAdminFields = joi.object().keys({
  position: joi.string().valid('sidebar'),
  width: joi.string(),
  style: joi.object().unknown(),
  readOnly: joi.boolean().default(false),
  hidden: joi.boolean().default(false),
  disabled: joi.boolean().default(false),
  condition: joi.func(),
  components: joi.object().keys({
    Cell: component,
    Field: component,
    Filter: component,
  }).default({}),
});

export const baseField = joi.object().keys({
  label: joi.alternatives().try(
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
}).default();

export const text = baseField.keys({
  type: joi.string().valid('text').required(),
  name: joi.string().required(),
  defaultValue: joi.string(),
  minLength: joi.number(),
  maxLength: joi.number(),
  admin: baseAdminFields.keys({
    placeholder: joi.string(),
    autoComplete: joi.string(),
  }),
});

export const number = baseField.keys({
  type: joi.string().valid('number').required(),
  name: joi.string().required(),
  defaultValue: joi.number(),
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
  defaultValue: joi.string(),
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
  defaultValue: joi.string(),
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
  defaultValue: joi.string(),
  admin: baseAdminFields.keys({
    language: joi.string(),
  }),
});

export const select = baseField.keys({
  type: joi.string().valid('select').required(),
  name: joi.string().required(),
  options: joi.array().items(joi.alternatives().try(
    joi.string(),
    joi.object({
      value: joi.string().allow('').required(),
      label: joi.string().required(),
    }),
  )).required(),
  hasMany: joi.boolean().default(false),
  defaultValue: joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string()),
  ),
});

export const radio = baseField.keys({
  type: joi.string().valid('radio').required(),
  name: joi.string().required(),
  options: joi.array().items(joi.alternatives().try(
    joi.string(),
    joi.object({
      value: joi.string().allow('').required(),
      label: joi.string().required(),
    }),
  )).required(),
  defaultValue: joi.string(),
  admin: baseAdminFields.keys({
    layout: joi.string().valid('vertical', 'horizontal'),
  }),
});

export const row = baseField.keys({
  type: joi.string().valid('row').required(),
  fields: joi.array().items(joi.link('#field')),
});

export const group = baseField.keys({
  type: joi.string().valid('group').required(),
  name: joi.string().required(),
  fields: joi.array().items(joi.link('#field')),
  defaultValue: joi.object(),
  admin: baseAdminFields.keys({
    hideGutter: joi.boolean().default(false),
  }),
});

export const array = baseField.keys({
  type: joi.string().valid('array').required(),
  name: joi.string().required(),
  minRows: joi.number(),
  maxRows: joi.number(),
  fields: joi.array().items(joi.link('#field')),
  labels: joi.object({
    singular: joi.string(),
    plural: joi.string(),
  }),
  defaultValue: joi.array().items(joi.object()),
});

export const upload = baseField.keys({
  type: joi.string().valid('upload').required(),
  relationTo: joi.string().required(),
  name: joi.string().required(),
  maxDepth: joi.number(),
});

export const checkbox = baseField.keys({
  type: joi.string().valid('checkbox').required(),
  name: joi.string().required(),
  defaultValue: joi.boolean(),
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
});

export const blocks = baseField.keys({
  type: joi.string().valid('blocks').required(),
  minRows: joi.number(),
  maxRows: joi.number(),
  name: joi.string().required(),
  labels: joi.object({
    singular: joi.string(),
    plural: joi.string(),
  }),
  blocks: joi.array().items(
    joi.object({
      slug: joi.string().required(),
      imageURL: joi.string(),
      imageAltText: joi.string(),
      labels: joi.object({
        singular: joi.string(),
        plural: joi.string(),
      }),
      fields: joi.array().items(joi.link('#field')),
    }),
  ),
  defaultValue: joi.array().items(joi.object()),
});

export const richText = baseField.keys({
  type: joi.string().valid('richText').required(),
  name: joi.string().required(),
  defaultValue: joi.array().items(joi.object()),
  admin: baseAdminFields.keys({
    placeholder: joi.string(),
    elements: joi.array().items(
      joi.alternatives().try(
        joi.string(),
        joi.object({
          name: joi.string().required(),
          Button: component,
          Element: component,
          plugins: joi.array().items(component),
        }),
      ),
    ),
    leaves: joi.array().items(
      joi.alternatives().try(
        joi.string(),
        joi.object({
          name: joi.string().required(),
          Button: component,
          Leaf: component,
          plugins: joi.array().items(component),
        }),
      ),
    ),
    hideGutter: joi.boolean().default(false),
  }),
});

export const date = baseField.keys({
  type: joi.string().valid('date').required(),
  name: joi.string().required(),
  defaultValue: joi.string(),
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

const fieldSchema = joi.alternatives()
  .try(
    text,
    number,
    textarea,
    email,
    code,
    select,
    group,
    array,
    row,
    radio,
    relationship,
    checkbox,
    upload,
    richText,
    blocks,
    date,
  )
  .id('field');

export default fieldSchema;
