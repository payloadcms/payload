import Joi from 'joi';

const schema = Joi.object().keys({
  slug: Joi.string().required(),
}).unknown();

export default schema;
