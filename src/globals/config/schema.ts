import joi from 'joi';
import fieldSchema from '../../fields/config/schema';

const schema = joi.object().keys({
  slug: joi.string().required(),
  label: joi.string(),
  access: joi.object({
    read: joi.func(),
    update: joi.func(),
  }),
  fields: joi.array().items(fieldSchema),
}).unknown();

export default schema;
