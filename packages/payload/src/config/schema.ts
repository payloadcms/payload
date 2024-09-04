import joi from 'joi'

import { adminViewSchema } from './shared/adminViewSchema'
import { componentSchema, livePreviewSchema } from './shared/componentSchema'

const component = joi.alternatives().try(joi.object().unknown(), joi.func())

export const endpointsSchema = joi.alternatives().try(
  joi.array().items(
    joi.object({
      custom: joi.object().pattern(joi.string(), joi.any()),
      handler: joi.alternatives().try(joi.array().items(joi.func()), joi.func()),
      method: joi
        .string()
        .valid('get', 'head', 'post', 'put', 'patch', 'delete', 'connect', 'options'),
      path: joi.string(),
      root: joi.bool(),
    }),
  ),
  joi.boolean(),
)

export default joi.object({
  admin: joi.object({
    autoLogin: joi.alternatives().try(
      joi.object().keys({
        email: joi.string(),
        password: joi.string(),
        prefillOnly: joi.boolean(),
      }),
      joi.boolean(),
    ),
    avatar: joi.alternatives().try(joi.string(), component),
    buildPath: joi.string(),
    bundler: {
      build: joi.func(),
      dev: joi.func(),
      serve: joi.func(),
    },
    components: joi.object().keys({
      Nav: component,
      actions: joi.array().items(component),
      afterDashboard: joi.array().items(component),
      afterLogin: joi.array().items(component),
      afterNavLinks: joi.array().items(component),
      beforeDashboard: joi.array().items(component),
      beforeLogin: joi.array().items(component),
      beforeNavLinks: joi.array().items(component),
      graphics: joi.object({
        Icon: component,
        Logo: component,
      }),
      logout: joi.object({
        Button: component,
      }),
      providers: joi.array().items(component),
      views: joi.alternatives().try(
        joi.object({
          Account: joi.alternatives().try(component, adminViewSchema),
          Dashboard: joi.alternatives().try(component, adminViewSchema),
        }),
        joi.object().pattern(joi.string(), component),
      ),
    }),
    css: joi.string(),
    dateFormat: joi.string(),
    disable: joi.bool(),
    inactivityRoute: joi.string(),
    indexHTML: joi.string(),
    livePreview: joi.object({
      ...livePreviewSchema,
      collections: joi.array().items(joi.string()),
      globals: joi.array().items(joi.string()),
    }),
    logoutRoute: joi.string(),
    meta: joi.object().keys({
      favicon: joi.string(),
      ogImage: joi.string(),
      titleSuffix: joi.string(),
    }),
    user: joi.string(),
    vite: joi.func(),
    webpack: joi.func(),
  }),
  collections: joi.array(),
  cookiePrefix: joi.string(),
  cors: [joi.string().valid('*'), joi.array().items(joi.string())],
  csrf: joi.array().items(joi.string().allow('')).sparse(),
  custom: joi.object().pattern(joi.string(), joi.any()),
  db: joi.any(),
  debug: joi.boolean(),
  defaultDepth: joi.number().min(0).max(30),
  defaultMaxTextLength: joi.number(),
  editor: joi
    .object()
    .required()
    .keys({
      CellComponent: componentSchema.optional(),
      FieldComponent: componentSchema.optional(),
      LazyCellComponent: joi.func().optional(),
      LazyFieldComponent: joi.func().optional(),
      afterReadPromise: joi.func().optional(),
      outputSchema: joi.func().optional(),
      populationPromise: joi.func().optional(),
      validate: joi.func().required(),
    })
    .unknown(),
  email: joi.object(),
  endpoints: endpointsSchema,
  express: joi.object().keys({
    compression: joi.object(),
    json: joi.object(),
    middleware: joi.array().items(joi.func()),
    postMiddleware: joi.array().items(joi.func()),
    preMiddleware: joi.array().items(joi.func()),
  }),
  globals: joi.array(),
  graphQL: joi.object().keys({
    disable: joi.boolean(),
    disablePlaygroundInProduction: joi.boolean(),
    maxComplexity: joi.number(),
    mutations: joi.function(),
    queries: joi.function(),
    schemaOutputFile: joi.string(),
  }),
  hooks: joi.object().keys({
    afterError: joi.func(),
  }),
  i18n: joi.object(),
  indexSortableFields: joi.boolean(),
  joiValidation: joi.boolean(),
  local: joi.boolean(),
  localization: joi.alternatives().try(
    joi.object().keys({
      defaultLocale: joi.string(),
      fallback: joi.boolean(),
      localeCodes: joi.array().items(joi.string()),
      locales: joi.alternatives().try(
        joi.array().items(
          joi.object().keys({
            code: joi.string(),
            fallbackLocale: joi.string(),
            label: joi
              .alternatives()
              .try(
                joi.object().pattern(joi.string(), [joi.string()]),
                joi.string(),
                joi.valid(false),
              ),
            rtl: joi.boolean(),
            toString: joi.func(),
          }),
        ),
        joi.array().items(joi.string()),
      ),
    }),
    joi.boolean(),
  ),
  maxDepth: joi.number().min(0).max(100),
  onInit: joi.func(),
  plugins: joi.array().items(joi.func()),
  rateLimit: joi.object().keys({
    max: joi.number(),
    skip: joi.func(),
    trustProxy: joi.boolean(),
    window: joi.number(),
  }),
  routes: joi.object({
    admin: joi.string(),
    api: joi.string(),
    graphQL: joi.string(),
    graphQLPlayground: joi.string(),
  }),
  serverURL: joi
    .string()
    .uri()
    .allow('')
    .custom((value, helper) => {
      const urlWithoutProtocol = value.split('//')[1]

      if (!urlWithoutProtocol) {
        return helper.message({
          custom: 'You need to include either "https://" or "http://" in your serverURL.',
        })
      }

      if (urlWithoutProtocol.indexOf('/') > -1) {
        return helper.message({
          custom:
            'Your serverURL cannot have a path. It can only contain a protocol, a domain, and an optional port.',
        })
      }

      return value
    }),
  telemetry: joi.boolean(),
  typescript: joi.object({
    declare: joi.boolean(),
    outputFile: joi.string(),
  }),
  upload: joi.object(),
})
