import Joi from 'joi';
import fieldSchema from '../../fields/config/schema';

const schema = Joi.object().keys({
  slug: Joi.string().required(),
  label: Joi.string(),
  access: Joi.object({
    read: Joi.func(),
    update: Joi.func(),
  }),
  fields: Joi.array().items(fieldSchema),
}).unknown();

export default schema;
