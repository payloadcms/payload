import joi from 'joi';
import path from 'path';
import collectionSchema from '../collections/config/schema';
import globalSchema from '../globals/config/schema';

const schema = joi.object().keys({
  serverURL: joi.string()
    .required(),
  cookiePrefix: joi.string()
    .default('payload'),
  routes: joi.object()
    .keys({
      admin: joi.string()
        .default('/admin'),
      api: joi.string()
        .default('/api'),
      graphQL: joi.string()
        .default('/graphql'),
      graphQLPlayground: joi.string()
        .default('/graphql-playground'),
    }).default(),
  collections: joi.array()
    .items(collectionSchema)
    .default([]),
  globals: joi.array()
    .items(globalSchema)
    .default([]),
  admin: joi.object()
    .keys({
      user: joi.string()
        .default('users'),
      meta: joi.object()
        .keys({
          titleSuffix: joi.string()
            .default('- Payload'),
          ogImage: joi.string()
            .default('/static/img/find-image-here.jpg'),
          favicon: joi.string()
            .default('/static/img/whatever.png'),
        })
        .default(),
      disable: joi.bool()
        .default(false),
      indexHTML: joi.string()
        .default(path.resolve(__dirname, '../admin/index.html')),
      components: joi.object()
        .keys({
          Nav: joi.func(),
          Dashboard: joi.func(),
          Icon: joi.func(),
          Logo: joi.func(),
        }),
    }).default(),
  defaultDepth: joi.number()
    .min(0)
    .max(30)
    .default(3),
  maxDepth: joi.number()
    .min(0)
    .max(100)
    .default(11),
  csrf: joi.array()
    .items(joi.string())
    .default([]),
  cors: joi.array()
    .items(joi.string())
    .default([]),
  publicENV: joi.object()
    .unknown(),
  express: joi.object()
    .keys({
      json: joi.object()
        .unknown()
        .default({}),
    }).default(),
  local: joi.boolean()
    .default(false),
  upload: joi.object()
    .keys({
      limits: joi.object()
        .keys({
          fileSize: joi.number(),
        }),
    }).default({}),
  webpack: joi.func(),
  serverModules: joi.object()
    .unknown(),
  rateLimit: joi.object()
    .keys({
      window: joi.number().default(15 * 60 * 100),
      max: joi.number().default(500),
    }).default(),
  graphQL: joi.object()
    .keys({
      mutations: joi.object().unknown().default({}),
      queries: joi.object().unknown().default({}),
      maxComplexity: joi.number().default(1000),
      disablePlaygroundInProduction: joi.boolean().default(true),
    }).default(),
  email: joi.alternatives()
    .try(
      joi.object()
        .keys({
          transport: 'mock',
          fromName: joi.string().default('Payload CMS'),
          fromAddress: joi.string().default('cms@payloadcms.com'),
        }),
      joi.object()
        .keys({
          transport: joi.object().unknown(),
          transportOptions: joi.object().unknown(),
          fromName: joi.string().default('Payload CMS'),
          fromAddress: joi.string().default('cms@payloadcms.com'),
        }),
    ).default({}),
  hooks: joi.object().keys({
    afterError: joi.func(),
  }).default({}),
  paths: joi.object()
    .keys({
      configDir: joi.string(),
      config: joi.string(),
      scss: joi.string().default(path.resolve(__dirname, '../admin/scss/overrides.scss')),
    }).default(),
}).unknown();

export default schema;
