import { JSONDefinition } from 'graphql-scalars';
import joi from 'joi';

const component = joi.alternatives().try(
  joi.object().unknown(),
  joi.func(),
);

export const endpointsSchema = joi.array().items(joi.object({
  path: joi.string(),
  method: joi.string().valid('get', 'head', 'post', 'put', 'patch', 'delete', 'connect', 'options'),
  root: joi.bool(),
  handler: joi.alternatives().try(
    joi.array().items(joi.func()),
    joi.func(),
  ),
}));

export default joi.object({
  serverURL: joi.string()
    .uri()
    .allow('')
    .custom((value, helper) => {
      const urlWithoutProtocol = value.split('//')[1];

      if (!urlWithoutProtocol) {
        return helper.message({ custom: 'You need to include either "https://" or "http://" in your serverURL.' });
      }

      if (urlWithoutProtocol.indexOf('/') > -1) {
        return helper.message({ custom: 'Your serverURL cannot have a path. It can only contain a protocol, a domain, and an optional port.' });
      }

      return value;
    }),
  cookiePrefix: joi.string(),
  routes: joi.object({
    admin: joi.string(),
    api: joi.string(),
    graphQL: joi.string(),
    graphQLPlayground: joi.string(),
  }),
  typescript: joi.object({
    outputFile: joi.string(),
  }),
  collections: joi.array(),
  endpoints: endpointsSchema,
  globals: joi.array(),
  admin: joi.object({
    user: joi.string(),
    buildPath: joi.string(),
    meta: joi.object()
      .keys({
        titleSuffix: joi.string(),
        ogImage: joi.string(),
        favicon: joi.string(),
      }),
    disable: joi.bool(),
    indexHTML: joi.string(),
    css: joi.string(),
    dateFormat: joi.string(),
    avatar: joi.alternatives()
      .try(
        joi.string(),
        component,
      ),
    logoutRoute: joi.string(),
    inactivityRoute: joi.string(),
    components: joi.object()
      .keys({
        routes: joi.array()
          .items(
            joi.object().keys({
              Component: component.required(),
              path: joi.string().required(),
              exact: joi.bool(),
              strict: joi.bool(),
              sensitive: joi.bool(),
            }),
          ),
        providers: joi.array().items(component),
        beforeDashboard: joi.array().items(component),
        afterDashboard: joi.array().items(component),
        beforeLogin: joi.array().items(component),
        afterLogin: joi.array().items(component),
        beforeNavLinks: joi.array().items(component),
        afterNavLinks: joi.array().items(component),
        Nav: component,
        logout: joi.object({
          Button: component,
        }),
        views: joi.object({
          Dashboard: component,
          Account: component,
        }),
        graphics: joi.object({
          Icon: component,
          Logo: component,
        }),
      }),
    webpack: joi.func(),
  }),
  i18n: joi.object(),
  defaultDepth: joi.number()
    .min(0)
    .max(30),
  maxDepth: joi.number()
    .min(0)
    .max(100),
  defaultMaxTextLength: joi.number(),
  csrf: joi.array()
    .items(joi.string().allow(''))
    .sparse(),
  cors: [
    joi.string()
      .valid('*'),
    joi.array()
      .items(joi.string()),
  ],
  express: joi.object()
    .keys({
      json: joi.object(),
      compression: joi.object(),
      middleware: joi.array().items(joi.func()),
      preMiddleware: joi.array().items(joi.func()),
      postMiddleware: joi.array().items(joi.func()),
    }),
  local: joi.boolean(),
  upload: joi.object(),
  indexSortableFields: joi.boolean(),
  rateLimit: joi.object()
    .keys({
      window: joi.number(),
      max: joi.number(),
      trustProxy: joi.boolean(),
      skip: joi.func(),
    }),
  graphQL: joi.object()
    .keys({
      mutations: joi.function(),
      queries: joi.function(),
      maxComplexity: joi.number(),
      disablePlaygroundInProduction: joi.boolean(),
      disable: joi.boolean(),
      schemaOutputFile: joi.string(),
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
  hooks: joi.object().keys({
    afterError: joi.func(),
  }),
  telemetry: joi.boolean(),
  plugins: joi.array().items(
    joi.func(),
  ),
  onInit: joi.func(),
  debug: joi.boolean(),
});
