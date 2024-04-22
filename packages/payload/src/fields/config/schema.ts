import joi from 'joi'

import { componentSchema } from '../../config/shared/componentSchema'

export const baseAdminComponentFields = joi
  .object()
  .keys({
    Cell: componentSchema,
    Field: componentSchema,
    Filter: componentSchema,
  })
  .default({})

export const baseAdminFields = joi.object().keys({
  className: joi.string(),
  components: baseAdminComponentFields,
  condition: joi.func(),
  description: joi
    .alternatives()
    .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()]), componentSchema),
  disableBulkEdit: joi.boolean().default(false),
  disabled: joi.boolean().default(false),
  hidden: joi.boolean().default(false),
  initCollapsed: joi.boolean().default(false),
  position: joi.string().valid('sidebar'),
  readOnly: joi.boolean().default(false),
  style: joi.object().unknown(),
  width: joi.string(),
})

export const baseField = joi
  .object()
  .keys({
    access: joi.object().keys({
      create: joi.func(),
      read: joi.func(),
      update: joi.func(),
    }),
    admin: baseAdminFields.default(),
    custom: joi.object().pattern(joi.string(), joi.any()),
    hidden: joi.boolean().default(false),
    hooks: joi
      .object()
      .keys({
        afterChange: joi.array().items(joi.func()).default([]),
        afterRead: joi.array().items(joi.func()).default([]),
        beforeChange: joi.array().items(joi.func()).default([]),
        beforeValidate: joi.array().items(joi.func()).default([]),
      })
      .default(),
    index: joi.boolean().default(false),
    label: joi
      .alternatives()
      .try(joi.object().pattern(joi.string(), [joi.string()]), joi.string(), joi.valid(false)),
    localized: joi.boolean().default(false),
    required: joi.boolean().default(false),
    saveToJWT: joi.alternatives().try(joi.boolean(), joi.string()).default(false),
    unique: joi.boolean().default(false),
    validate: joi.func(),
  })
  .default()

export const idField = baseField.keys({
  name: joi.string().valid('id'),
  type: joi.string().valid('text', 'number'),
  localized: joi.invalid(true),
  required: joi.not(false, 0).default(true),
})

export const text = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('text').required(),
  admin: baseAdminFields.keys({
    autoComplete: joi.string(),
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
      afterInput: joi.array().items(componentSchema),
      beforeInput: joi.array().items(componentSchema),
    }),
    placeholder: joi
      .alternatives()
      .try(joi.object().pattern(joi.string(), [joi.string()]), joi.string()),
    rtl: joi.boolean(),
  }),
  defaultValue: joi.alternatives().try(joi.string(), joi.func()),
  hasMany: joi.boolean().default(false),
  maxLength: joi.number(),
  maxRows: joi.number().when('hasMany', { is: joi.not(true), then: joi.forbidden() }),
  minLength: joi.number(),
  minRows: joi.number().when('hasMany', { is: joi.not(true), then: joi.forbidden() }),
})

export const number = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('number').required(),
  admin: baseAdminFields.keys({
    autoComplete: joi.string(),
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
      afterInput: joi
        .array()
        .items(componentSchema)
        .when('hasMany', { not: true, otherwise: joi.forbidden() }),
      beforeInput: joi
        .array()
        .items(componentSchema)
        .when('hasMany', { not: true, otherwise: joi.forbidden() }),
    }),
    placeholder: joi.string(),
    step: joi.number(),
  }),
  defaultValue: joi
    .alternatives()
    .try(
      joi.number(),
      joi.func(),
      joi.array().when('hasMany', { not: true, then: joi.forbidden() }),
    ),
  hasMany: joi.boolean().default(false),
  max: joi.number(),
  maxRows: joi.number().when('hasMany', { is: joi.not(true), then: joi.forbidden() }),
  min: joi.number(),
  minRows: joi.number().when('hasMany', { is: joi.not(true), then: joi.forbidden() }),
})

export const textarea = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('textarea').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
      afterInput: joi.array().items(componentSchema),
      beforeInput: joi.array().items(componentSchema),
    }),
    placeholder: joi.string(),
    rows: joi.number(),
    rtl: joi.boolean(),
  }),
  defaultValue: joi.alternatives().try(joi.string(), joi.func()),
  maxLength: joi.number(),
  minLength: joi.number(),
})

export const email = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('email').required(),
  admin: baseAdminFields.keys({
    autoComplete: joi.string(),
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
      afterInput: joi.array().items(componentSchema),
      beforeInput: joi.array().items(componentSchema),
    }),
    placeholder: joi.string(),
  }),
  defaultValue: joi.alternatives().try(joi.string(), joi.func()),
  maxLength: joi.number(),
  minLength: joi.number(),
})

export const code = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('code').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
    }),
    editorOptions: joi.object().unknown(), // Editor['options'] @monaco-editor/react
    language: joi.string(),
  }),
  defaultValue: joi.alternatives().try(joi.string(), joi.func()),
})

export const json = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('json').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
    }),
    editorOptions: joi.object().unknown(), // Editor['options'] @monaco-editor/react
  }),
  defaultValue: joi.alternatives().try(joi.array(), joi.object()),
  jsonSchema: joi.object().unknown(),
})

export const select = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('select').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
    }),
    isClearable: joi.boolean().default(false),
    isSortable: joi.boolean().default(false),
  }),
  dbName: joi.alternatives().try(joi.string(), joi.func()),
  defaultValue: joi
    .alternatives()
    .try(joi.string().allow(''), joi.array().items(joi.string().allow('')), joi.func()),
  enumName: joi.alternatives().try(joi.string(), joi.func()),
  hasMany: joi.boolean().default(false),
  options: joi
    .array()
    .min(1)
    .items(
      joi.alternatives().try(
        joi.string(),
        joi.object({
          label: joi
            .alternatives()
            .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
          value: joi.string().required().allow(''),
        }),
      ),
    )
    .required(),
})

export const radio = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('radio').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
    }),
    layout: joi.string().valid('vertical', 'horizontal'),
  }),
  defaultValue: joi.alternatives().try(joi.string().allow(''), joi.func()),
  enumName: joi.alternatives().try(joi.string(), joi.func()),
  options: joi
    .array()
    .min(1)
    .items(
      joi.alternatives().try(
        joi.string(),
        joi.object({
          label: joi
            .alternatives()
            .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()]))
            .required(),
          value: joi.string().required().allow(''),
        }),
      ),
    )
    .required(),
})

export const row = baseField.keys({
  type: joi.string().valid('row').required(),
  admin: baseAdminFields.default(),
  fields: joi.array().items(joi.link('#field')),
})

export const collapsible = baseField.keys({
  type: joi.string().valid('collapsible').required(),
  admin: baseAdminFields.default(),
  fields: joi.array().items(joi.link('#field')),
  label: joi.alternatives().try(joi.string(), componentSchema),
})

const tab = baseField.keys({
  name: joi.string().when('localized', { is: joi.exist(), then: joi.required() }),
  description: joi.alternatives().try(joi.string(), componentSchema),
  fields: joi.array().items(joi.link('#field')).required(),
  interfaceName: joi.string().when('name', { not: joi.exist(), then: joi.forbidden() }),
  label: joi
    .alternatives()
    .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()]))
    .when('name', { is: joi.not(), then: joi.required() }),
  localized: joi.boolean(),
  saveToJWT: joi.alternatives().try(joi.boolean(), joi.string()),
})

export const tabs = baseField.keys({
  type: joi.string().valid('tabs').required(),
  admin: baseAdminFields.keys({
    description: joi.forbidden(),
  }),
  fields: joi.forbidden(),
  localized: joi.forbidden(),
  tabs: joi.array().items(tab).required(),
})

export const group = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('group').required(),
  admin: baseAdminFields.keys({
    hideGutter: joi.boolean().default(true),
  }),
  defaultValue: joi.alternatives().try(joi.object(), joi.func()),
  fields: joi.array().items(joi.link('#field')),
  interfaceName: joi.string(),
})

export const array = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('array').required(),
  admin: baseAdminFields
    .keys({
      components: baseAdminComponentFields
        .keys({
          RowLabel: componentSchema,
        })
        .default({}),
      disableSortable: joi.boolean(),
    })
    .default({}),
  dbName: joi.alternatives().try(joi.string(), joi.func()),
  defaultValue: joi.alternatives().try(joi.array().items(joi.object()), joi.func()),
  fields: joi.array().items(joi.link('#field')).required(),
  interfaceName: joi.string(),
  labels: joi.object({
    plural: joi
      .alternatives()
      .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
    singular: joi
      .alternatives()
      .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
  }),
  maxRows: joi.number(),
  minRows: joi.number(),
})

export const upload = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('upload').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
    }),
  }),
  defaultValue: joi.alternatives().try(joi.object(), joi.func()),
  filterOptions: joi.alternatives().try(joi.object(), joi.func()),
  maxDepth: joi.number(),
  relationTo: joi.string().required(),
})

export const checkbox = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('checkbox').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
      afterInput: joi.array().items(componentSchema),
      beforeInput: joi.array().items(componentSchema),
    }),
  }),
  defaultValue: joi.alternatives().try(joi.boolean(), joi.func()),
})

export const point = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('point').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
      afterInput: joi.array().items(componentSchema),
      beforeInput: joi.array().items(componentSchema),
    }),
  }),
  defaultValue: joi.alternatives().try(joi.array().items(joi.number()).max(2).min(2), joi.func()),
})

export const relationship = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('relationship').required(),
  admin: baseAdminFields.keys({
    allowCreate: joi.boolean().default(true),
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
    }),
    isSortable: joi.boolean().default(false),
    sortOptions: joi.alternatives().conditional(joi.ref('...relationTo'), {
      is: joi.string(),
      otherwise: joi.object().pattern(joi.string(), joi.string()),
      then: joi.string(),
    }),
  }),
  defaultValue: joi.alternatives().try(joi.func()),
  filterOptions: joi.alternatives().try(joi.object(), joi.func()),
  hasMany: joi.boolean().default(false),
  max: joi
    .number()
    .when('hasMany', { is: joi.not(true), then: joi.forbidden() })
    .warning('deprecated', { message: 'Use maxRows instead.' }),
  maxDepth: joi.number(),
  maxRows: joi.number().when('hasMany', { is: joi.not(true), then: joi.forbidden() }),
  min: joi
    .number()
    .when('hasMany', { is: joi.not(true), then: joi.forbidden() })
    .warning('deprecated', { message: 'Use minRows instead.' }),
  minRows: joi.number().when('hasMany', { is: joi.not(true), then: joi.forbidden() }),
  relationTo: joi.alternatives().try(joi.string().required(), joi.array().items(joi.string())),
})

export const blocks = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('blocks').required(),
  admin: baseAdminFields
    .keys({
      disableSortable: joi.boolean(),
    })
    .default({}),
  blocks: joi
    .array()
    .items(
      joi.object({
        slug: joi.string().required(),
        custom: joi.object().pattern(joi.string(), joi.any()),
        dbName: joi.alternatives().try(joi.string(), joi.func()),
        fields: joi.array().items(joi.link('#field')),
        graphQL: joi.object().keys({
          singularName: joi.string(),
        }),
        imageAltText: joi.string(),
        imageURL: joi.string(),
        interfaceName: joi.string(),
        labels: joi.object({
          plural: joi
            .alternatives()
            .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
          singular: joi
            .alternatives()
            .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
        }),
      }),
    )
    .required(),
  defaultValue: joi.alternatives().try(joi.array().items(joi.object()), joi.func()),
  labels: joi.object({
    plural: joi
      .alternatives()
      .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
    singular: joi
      .alternatives()
      .try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
  }),
  maxRows: joi.number(),
  minRows: joi.number(),
})

export const richText = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('richText').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
    }),
  }),
  defaultValue: joi.alternatives().try(joi.array().items(joi.object()), joi.func(), joi.object()),
  editor: joi
    .object()
    .keys({
      CellComponent: componentSchema.optional(),
      FieldComponent: componentSchema.optional(),
      LazyCellComponent: joi.func().optional(),
      LazyFieldComponent: joi.func().optional(),
      afterReadPromise: joi.func().optional(),
      outputSchema: joi.func().optional(),
      populationPromise: joi.func().optional(),
      validate: joi.func().required(),
    })
    .unknown(),
})

export const date = baseField.keys({
  name: joi.string().required(),
  type: joi.string().valid('date').required(),
  admin: baseAdminFields.keys({
    components: baseAdminComponentFields.keys({
      Error: componentSchema,
      Label: componentSchema,
      afterInput: joi.array().items(componentSchema),
      beforeInput: joi.array().items(componentSchema),
    }),
    date: joi.object({
      displayFormat: joi.string(),
      maxDate: joi.date(),
      maxTime: joi.date(),
      minDate: joi.date(),
      minTime: joi.date(),
      monthsToShow: joi.number(),
      overrides: joi.object().unknown(),
      pickerAppearance: joi.string(),
      timeFormat: joi.string(),
      timeIntervals: joi.number(),
    }),
    placeholder: joi.string(),
  }),
  defaultValue: joi.alternatives().try(joi.string(), joi.func()),
})

export const ui = joi.object().keys({
  name: joi.string().required(),
  type: joi.string().valid('ui').required(),
  admin: joi
    .object()
    .keys({
      components: joi
        .object()
        .keys({
          Cell: componentSchema,
          Field: componentSchema,
        })
        .default({}),
      condition: joi.func(),
      position: joi.string().valid('sidebar'),
      width: joi.string(),
    })
    .default(),
  custom: joi.object().pattern(joi.string(), joi.any()),
  label: joi.alternatives().try(joi.string(), joi.object().pattern(joi.string(), [joi.string()])),
})

const fieldSchema = joi
  .alternatives()
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
  .id('field')

export default fieldSchema
