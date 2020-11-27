import joi from 'joi';

const schema = joi.object().keys({
  slug: joi.string().required(),
  labels: joi.object().keys({
    singular: joi.string(),
    plural: joi.string(),
  }),
  access: joi.object().keys({
    create: joi.func(),
    read: joi.func(),
    update: joi.func(),
    delete: joi.func(),
  }),
  timestamps: joi.boolean()
    .default(true),
}).unknown();

export default schema;
