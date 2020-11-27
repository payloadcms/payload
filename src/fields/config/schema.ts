import joi from 'joi';

const baseField = joi.object().keys({
  label: joi.string(),
  required: joi.boolean().default(false),
  saveToJWT: joi.boolean().default(false),
  unique: joi.boolean().default(false),
  localized: joi.boolean().default(false),
  index: joi.boolean().default(false),
  hidden: joi.boolean().default(false),
  access: joi.object().keys({
    create: joi.func(),
    read: joi.func(),
    update: joi.func(),
    delete: joi.func(),
    unlock: joi.func(),
  }),
  hooks: joi.object()
    .keys({
      beforeValidate: joi.array().items(joi.func()).default([]),
      beforeChange: joi.array().items(joi.func()).default([]),
      afterChange: joi.array().items(joi.func()).default([]),
      afterRead: joi.array().items(joi.func()).default([]),
    }).default(),
  admin: joi.object().keys({
    position: joi.string().valid('sidebar'),
    width: joi.string(),
    style: joi.object().unknown(),
    readOnly: joi.boolean().default(false),
    disabled: joi.boolean().default(false),
    condition: joi.func(),
    components: joi.object().keys({
      Cell: joi.func(),
      Field: joi.func(),
      Filter: joi.func(),
    }).default({}),
  }).default({}),
});

// Joi.object({
//   type: Joi.string().required().only(['pizza', 'salad'])
// })
// .when(Joi.object({ type: 'pizza' }).unknown(), {
//   then: Joi.object({ pepperoni: Joi.boolean() })
// })
// .when(Joi.object({ type: 'salad' }).unknown(), {
//   then: Joi.object({ croutons: Joi.boolean() })
// })

const types = {
  text: baseField.keys({
    name: joi.string().required(),
    defaultValue: joi.string(),
  }),
  number: baseField.keys({
    name: joi.string().required(),
    defaultValue: joi.string(),
  }),
  email: baseField.keys({
    name: joi.string().required(),
    defaultValue: joi.string(),
  }),
  row: baseField.keys({
    defaultValue: joi.object().unknown(),
    fields: joi.array().items(joi.link('#field')),
  }),
};

const allTypes = Object.keys(types);

const fieldSchema = allTypes.reduce((prev, type) => prev.when(joi.object({ type }).unknown(), {
  then: types[type],
}),
joi.object({
  type: joi.string().valid(...allTypes).required(),
})).id('field');

// const fieldSchema = joi.object({
//   type: joi.string()
//     .required()
//     .valid(
//       'text',
//       'number',
//       'email',
//       'textarea',
//       'code',
//       'select',
//       'row',
//     ).when(joi.object({ type: 'text' }).unknown(), {
//       then: ,
//     })
//     .when(joi.object({ type: 'number' }).unknown(), {
//       then: ,
//     })
//     .when(joi.object({ type: 'email' }).unknown(), {
//       then:
//     .when(joi.object({ type: 'row' }).unknown(), {
//       then: baseField.keys({
//         defaultValue: joi.object().unknown(),
//         fields: joi.array().items(joi.link('#field')),
//       }),
//     }),
// }).id('field');

// const fieldSchema = joi.alternatives()
//   .try(
// ,
//     baseField.keys({
//       type: joi.string().valid('number').required(),
//       name: joi.string().required(),
//       defaultValue: joi.number(),
//     }),
//     baseField.keys({
//       type: joi.string().valid('email').required(),
//       name: joi.string().required(),
//     }),
//     baseField.keys({
//       type: joi.string().valid('textarea').required(),
//       name: joi.string().required(),
//     }),
//     baseField.keys({
//       type: joi.string().valid('code').required(),
//       name: joi.string().required(),
//     }),
//     baseField.keys({
//       type: joi.string().valid('select').required(),
//       name: joi.string().required(),
//       options: joi.array().items(joi.string()).required(),
//       hasMany: joi.boolean().default(false),
//     }).default(),
//     baseField.keys({
//       type: joi.string().valid('row').required(),
//       fields: joi.array().items(joi.link('#field')),
//     }),
//   ).id('field');

export default fieldSchema;
