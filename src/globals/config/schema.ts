import joi from 'joi';
import { componentSchema } from '../../utilities/componentSchema';

const globalSchema = joi.object().keys({
  slug: joi.string().required(),
  label: joi.string(),
  admin: joi.object({
    description: joi.alternatives().try(
      joi.string(),
      componentSchema,
    ),
  }),
  hooks: joi.object({
    beforeValidate: joi.array().items(joi.func()),
    beforeChange: joi.array().items(joi.func()),
    afterChange: joi.array().items(joi.func()),
    beforeRead: joi.array().items(joi.func()),
    afterRead: joi.array().items(joi.func()),
  }),
  access: joi.object({
    read: joi.func(),
    readRevisions: joi.func(),
    update: joi.func(),
  }),
  fields: joi.array(),
  revisions: joi.alternatives().try(
    joi.object({
      max: joi.number(),
    }),
    joi.boolean(),
  ),
}).unknown();

export default globalSchema;
