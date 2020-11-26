import Joi from 'joi';
import collectionSchema from '../collections/config/schema';
import globalSchema from '../globals/config/schema';

const schema = Joi.object().keys({
  serverURL: Joi.string().required(),
  routes: Joi.object()
    .keys({
      admin: Joi.string()
        .default('/admin'),
      api: Joi.string()
        .default('/api'),
      graphQL: Joi.string()
        .default('/graphql'),
      graphQLPlayground: Joi.string()
        .default('/graphql-playground'),
    }).default(),
  collections: Joi.array()
    .items(collectionSchema)
    .default([]),
  globals: Joi.array()
    .items(globalSchema)
    .default([]),
  admin: Joi.object()
    .keys({
      user: Joi.string()
        .default('users'),
      meta: Joi.object()
        .keys({
          titleSuffix: Joi.string()
            .default('- Payload'),
          ogImage: Joi.string()
            .default('/static/img/find-image-here.jpg'),
          favicon: Joi.string()
            .default('/static/img/whatever.png'),
        })
        .default(),
      disable: Joi.bool()
        .default(false),
      components: Joi.object()
        .keys({}),
    }).default(),
  defaultDepth: Joi.number()
    .min(0)
    .max(30)
    .default(3),
  maxDepth: Joi.number()
    .min(0)
    .max(100)
    .default(11),
}).unknown();

export default schema;
