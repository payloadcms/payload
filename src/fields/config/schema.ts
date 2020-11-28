import joi from 'joi';

export const adminFields = joi.object().keys({
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
}).default();

export const baseField = joi.object().keys({
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
  }),
  hooks: joi.object()
    .keys({
      beforeValidate: joi.array().items(joi.func()).default([]),
      beforeChange: joi.array().items(joi.func()).default([]),
      afterChange: joi.array().items(joi.func()).default([]),
      afterRead: joi.array().items(joi.func()).default([]),
    }).default(),
  admin: adminFields,
}).default();

const textProps = {
  type: joi.string().valid('text').required(),
  name: joi.string().required(),
  defaultValue: joi.string(),
};

export const text = joi.object().keys(textProps);

const numberProps = {
  type: joi.string().valid('number').required(),
  name: joi.string().required(),
  defaultValue: joi.number(),
};

export const number = joi.object().keys(numberProps);

const textareaProps = {
  type: joi.string().valid('textarea').required(),
  name: joi.string().required(),
  defaultValue: joi.string(),
};

export const textarea = joi.object().keys(textareaProps);

const emailProps = {
  type: joi.string().valid('email').required(),
  name: joi.string().required(),
  defaultValue: joi.string(),
};

export const email = joi.object().keys(emailProps);

const codeProps = {
  type: joi.string().valid('code').required(),
  name: joi.string().required(),
  defaultValue: joi.string(),
};

export const code = joi.object().keys(codeProps);

const selectProps = {
  type: joi.string().valid('select').required(),
  name: joi.string().required(),
  options: joi.array().items(joi.string()).required(),
  hasMany: joi.boolean().default(false),
  defaultValue: joi.string(),
};

export const select = joi.object().keys(selectProps);

const rowProps = {
  type: joi.string().valid('row').required(),
  fields: joi.array().items(joi.link('#field')),
};

export const row = joi.object().keys(rowProps);

const radioProps = {
  type: joi.string().valid('radio').required(),
  fields: joi.array().items(joi.link('#field')),
};

export const radio = joi.object().keys(radioProps);

const fieldSchema = joi.alternatives()
  .try(
    baseField.keys(textProps),
    baseField.keys(numberProps),
    baseField.keys(textareaProps),
    baseField.keys(emailProps),
    baseField.keys(codeProps),
    baseField.keys(selectProps),
    baseField.keys(rowProps),
    baseField.keys(radioProps),
  )
  .id('field');

export default fieldSchema;
