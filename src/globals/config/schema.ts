import joi from 'joi';

const globalSchema = joi.object().keys({
  slug: joi.string().required(),
  label: joi.string(),
  hooks: joi.object({
    beforeValidate: joi.array().items(joi.func()),
    beforeChange: joi.array().items(joi.func()),
    afterChange: joi.array().items(joi.func()),
    beforeRead: joi.array().items(joi.func()),
    afterRead: joi.array().items(joi.func()),
  }),
  access: joi.object({
    read: joi.func(),
    update: joi.func(),
  }),
  fields: joi.array(),
}).unknown();

export default globalSchema;
