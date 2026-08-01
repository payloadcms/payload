import type { Config } from './types.js'

import { defaultAccess } from '../auth/defaultAccess.js'
import { databaseKVAdapter } from '../kv/adapters/DatabaseKVAdapter.js'

export const addDefaultsToConfig = (config: Config): Config => {
  config.admin = {
    ...(config.admin || {}),
    avatar: config.admin?.avatar ?? 'gravatar',
    components: config.admin?.components ?? {},
    custom: config.admin?.custom ?? {},
    dateFormat: config.admin?.dateFormat ?? 'MMMM do yyyy, h:mm a',
    dependencies: config.admin?.dependencies ?? {},
    importMap: {
      ...(config?.admin?.importMap || {}),
      baseDir:
        config.admin?.importMap?.baseDir ??
        `${typeof process?.cwd === 'function' ? process.cwd() : ''}`,
    },
    meta: {
      ...(config?.admin?.meta || {}),
      defaultOGImageType: config.admin?.meta?.defaultOGImageType ?? 'dynamic',
      robots:
        typeof config.admin?.meta?.robots === 'undefined'
          ? 'noindex, nofollow'
          : config.admin.meta.robots,
      titleSuffix: config.admin?.meta?.titleSuffix ?? '- Payload',
    },
    routes: {
      ...(config?.admin?.routes || {}),
      account: config.admin?.routes?.account ?? '/account',
      createFirstUser: config.admin?.routes?.createFirstUser ?? '/create-first-user',
      forgot: config.admin?.routes?.forgot ?? '/forgot',
      inactivity: config.admin?.routes?.inactivity ?? '/logout-inactivity',
      login: config.admin?.routes?.login ?? '/login',
      logout: config.admin?.routes?.logout ?? '/logout',
      reset: config.admin?.routes?.reset ?? '/reset',
      unauthorized: config.admin?.routes?.unauthorized ?? '/unauthorized',
    },
    theme: config.admin?.theme ?? 'all',
  }

  config.bin = config.bin ?? []
  config.collections = config.collections ?? []
  config.cookiePrefix = config.cookiePrefix ?? 'payload'
  config.cors = config.cors ?? []
  config.csrf = config.csrf ?? []
  config.custom = config.custom ?? {}
  config.defaultDepth = config.defaultDepth ?? 1
  config.defaultMaxTextLength = config.defaultMaxTextLength ?? 40000
  config.endpoints = config.endpoints ?? []
  config.globals = config.globals ?? []
  config.graphQL = {
    ...(config.graphQL || {}),
    disableIntrospectionInProduction: config.graphQL?.disableIntrospectionInProduction ?? true,
    disablePlaygroundInProduction: config.graphQL?.disablePlaygroundInProduction ?? true,
    maxComplexity: config.graphQL?.maxComplexity ?? 1000,
    schemaOutputFile:
      config.graphQL?.schemaOutputFile ??
      `${typeof process?.cwd === 'function' ? process.cwd() : ''}/schema.graphql`,
  }
  config.hooks = config.hooks ?? {}
  config.i18n = config.i18n ?? {}
  config.jobs = {
    deleteJobOnComplete: true,
    ...(config.jobs || {}),
    access: {
      cancel: defaultAccess,
      queue: defaultAccess,
      run: defaultAccess,
      ...(config.jobs?.access || {}),
    },
    processingLease: {
      duration: config.jobs?.processingLease?.duration ?? 20 * 60 * 1000,
      safetyBuffer: config.jobs?.processingLease?.safetyBuffer ?? 30 * 1000,
    },
  }
  config.localization = config.localization ?? false
  config.maxDepth = config.maxDepth ?? 10
  config.routes = {
    ...(config.routes || {}),
    admin: config.routes?.admin ?? '/admin',
    api: config.routes?.api ?? '/api',
    graphQL: config.routes?.graphQL ?? '/graphql',
    graphQLPlayground: config.routes?.graphQLPlayground ?? '/graphql-playground',
  }
  config.serverURL = config.serverURL ?? ''
  config.telemetry = config.telemetry ?? true
  config.typescript = {
    ...(config.typescript || {}),
    autoGenerate: config.typescript?.autoGenerate ?? true,
    outputFile:
      config.typescript?.outputFile ??
      `${typeof process?.cwd === 'function' ? process.cwd() : ''}/payload-types.ts`,
  }
  config.upload = config.upload ?? {}

  config.auth = {
    jwtOrder: ['JWT', 'Bearer', 'cookie'],
    ...(config.auth || {}),
  }

  config.kv = config.kv ?? databaseKVAdapter()

  if (config.kv?.kvCollection) {
    config.collections.push(config.kv.kvCollection)
  }

  return config
}
