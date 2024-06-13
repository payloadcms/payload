import joi from 'joi'

import { adminViewSchema } from './shared/adminViewSchema.js'
import { componentSchema, livePreviewSchema } from './shared/componentSchema.js'
import { openGraphSchema } from './shared/openGraphSchema.js'

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
    custom: joi.object().pattern(joi.string(), joi.any()),
    dateFormat: joi.string(),
    disable: joi.bool(),
    livePreview: joi.object({
      ...livePreviewSchema,
      collections: joi.array().items(joi.string()),
      globals: joi.array().items(joi.string()),
    }),
    meta: joi.object().keys({
      defaultOGImageType: joi.string().valid('off', 'dynamic', 'static'),
      description: joi.string(),
      icons: joi.array().items(
        joi.object().keys({
          type: joi.string(),
          color: joi.string(),
          fetchPriority: joi.string().valid('auto', 'high', 'low'),
          media: joi.string(),
          rel: joi.string(),
          sizes: joi.string(),
          url: joi.string(),
        }),
      ),
      openGraph: openGraphSchema,
      titleSuffix: joi.string(),
    }),
    routes: joi.object({
      account: joi.string(),
      createFirstUser: joi.string(),
      forgot: joi.string(),
      inactivity: joi.string(),
      login: joi.string(),
      logout: joi.string(),
      unauthorized: joi.string(),
    }),
    user: joi.string(),
  }),
  bin: joi.array().items(
    joi.object().keys({
      key: joi.string(),
      scriptPath: joi.string(),
    }),
  ),
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
    .optional()
    .keys({
      CellComponent: componentSchema.optional(),
      FieldComponent: componentSchema.optional(),
      afterReadPromise: joi.func().optional(),
      outputSchema: joi.func().optional(),
      populationPromise: joi.func().optional(),
      validate: joi.func().required(),
    })
    .unknown(),
  email: joi.alternatives().try(joi.object(), joi.func()),
  endpoints: endpointsSchema,
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
  routes: joi.object({
    admin: joi.string(),
    api: joi.string(),
    graphQL: joi.string(),
    graphQLPlayground: joi.string(),
  }),
  secret: joi.string(),
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
  sharp: joi.any(),
  telemetry: joi.boolean(),
  typescript: joi.object({
    autoGenerate: joi.boolean(),
    declare: joi.alternatives().try(joi.boolean(), joi.object({ ignoreTSError: joi.boolean() })),
    outputFile: joi.string(),
  }),
  upload: joi.object(),
})
