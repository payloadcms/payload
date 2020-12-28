import joi from 'joi';
import collectionSchema from '../collections/config/schema';
import globalSchema from '../globals/config/schema';

const component = joi.alternatives().try(
  joi.object().unknown(),
  joi.func(),
);

export default joi.object({
  serverURL: joi.string()
    .required(),
  cookiePrefix: joi.string(),
  routes: joi.object({
    admin: joi.string(),
    api: joi.string(),
    graphQL: joi.string(),
    graphQLPlayground: joi.string(),
  }),
  collections: joi.array()
    .items(collectionSchema),
  globals: joi.array()
    .items(globalSchema),
  admin: joi.object({
    user: joi.string(),
    meta: joi.object()
      .keys({
        titleSuffix: joi.string(),
        ogImage: joi.string(),
        favicon: joi.string(),
      }),
    disable: joi.bool(),
    indexHTML: joi.string(),
    components: joi.object()
      .keys({
        Nav: component,
        Dashboard: component,
        graphics: joi.object({
          Icon: component,
          Logo: component,
        }),
      }),
  }),
  defaultDepth: joi.number()
    .min(0)
    .max(30),
  maxDepth: joi.number()
    .min(0)
    .max(100),
  csrf: joi.array()
    .items(joi.string()),
  cors: joi.array()
    .items(joi.string()),
  publicENV: joi.object(),
  express: joi.object()
    .keys({
      json: joi.object(),
      compression: joi.object(),
      middleware: joi.array().items(joi.object()),
    }),
  local: joi.boolean(),
  upload: joi.object()
    .keys({
      limits: joi.object()
        .keys({
          fileSize: joi.number(),
        }),
    }),
  webpack: joi.func(),
  serverModules: joi.array()
    .items(joi.string()),
  rateLimit: joi.object()
    .keys({
      window: joi.number(),
      max: joi.number(),
      trustProxy: joi.boolean(),
      skip: joi.func(),
    }),
  graphQL: joi.object()
    .keys({
      mutations: joi.object(),
      queries: joi.object(),
      maxComplexity: joi.number(),
      disablePlaygroundInProduction: joi.boolean(),
    }),
  localization: joi.alternatives()
    .try(
      joi.object().keys({
        locales: joi.array().items(joi.string()),
        defaultLocale: joi.string(),
        fallback: joi.boolean(),
      }),
      joi.boolean(),
    ),
  email: joi.alternatives()
    .try(
      joi.object({
        transport: 'mock',
        fromName: joi.string(),
        fromAddress: joi.string(),
      }),
      joi.object({
        transport: joi.object(),
        transportOptions: joi.object(),
        fromName: joi.string(),
        fromAddress: joi.string(),
      }),
    ),
  hooks: joi.object().keys({
    afterError: joi.func(),
  }),
  paths: joi.object()
    .keys({
      configDir: joi.string(),
      config: joi.string(),
      scss: joi.string(),
    }),
});
