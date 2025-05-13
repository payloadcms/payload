import type { JobsConfig } from '../queues/config/types/index.js'
import type { Config } from './types.js'

import defaultAccess from '../auth/defaultAccess.js'

/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
export const defaults: Omit<Config, 'db' | 'editor' | 'secret'> = {
  admin: {
    avatar: 'gravatar',
    components: {},
    custom: {},
    dateFormat: 'MMMM do yyyy, h:mm a',
    dependencies: {},
    importMap: {
      baseDir: `${typeof process?.cwd === 'function' ? process.cwd() : ''}`,
    },
    meta: {
      defaultOGImageType: 'dynamic',
      robots: 'noindex, nofollow',
      titleSuffix: '- Payload',
    },
    routes: {
      account: '/account',
      createFirstUser: '/create-first-user',
      forgot: '/forgot',
      inactivity: '/logout-inactivity',
      login: '/login',
      logout: '/logout',
      reset: '/reset',
      unauthorized: '/unauthorized',
    },
    theme: 'all',
  },
  auth: {
    jwtOrder: ['JWT', 'Bearer', 'cookie'],
  },
  bin: [],
  collections: [],
  cookiePrefix: 'payload',
  cors: [],
  csrf: [],
  custom: {},
  defaultDepth: 2,
  defaultMaxTextLength: 40000,
  endpoints: [],
  globals: [],
  graphQL: {
    disablePlaygroundInProduction: true,
    maxComplexity: 1000,
    schemaOutputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/schema.graphql`,
  },
  hooks: {},
  i18n: {},
  jobs: {
    access: {
      run: defaultAccess,
    },
    deleteJobOnComplete: true,
    depth: 0,
  } as JobsConfig,
  localization: false,
  maxDepth: 10,
  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/graphql',
    graphQLPlayground: '/graphql-playground',
  },
  serverURL: '',
  telemetry: true,
  typescript: {
    autoGenerate: true,
    outputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/payload-types.ts`,
  },
  upload: {},
}

export const addDefaultsToConfig = (config: Config): Config => {
  config.admin = {
    avatar: 'gravatar',
    components: {},
    custom: {},
    dateFormat: 'MMMM do yyyy, h:mm a',
    dependencies: {},
    theme: 'all',
    ...(config.admin || {}),
    importMap: {
      baseDir: `${typeof process?.cwd === 'function' ? process.cwd() : ''}`,
      ...(config?.admin?.importMap || {}),
    },
    meta: {
      defaultOGImageType: 'dynamic',
      robots: 'noindex, nofollow',
      titleSuffix: '- Payload',
      ...(config?.admin?.meta || {}),
    },
    routes: {
      account: '/account',
      createFirstUser: '/create-first-user',
      forgot: '/forgot',
      inactivity: '/logout-inactivity',
      login: '/login',
      logout: '/logout',
      reset: '/reset',
      unauthorized: '/unauthorized',
      ...(config?.admin?.routes || {}),
    },
  }

  config.bin = config.bin ?? []
  config.collections = config.collections ?? []
  config.cookiePrefix = config.cookiePrefix ?? 'payload'
  config.cors = config.cors ?? []
  config.csrf = config.csrf ?? []
  config.custom = config.custom ?? {}
  config.defaultDepth = config.defaultDepth ?? 2
  config.defaultMaxTextLength = config.defaultMaxTextLength ?? 40000
  config.endpoints = config.endpoints ?? []
  config.globals = config.globals ?? []
  config.graphQL = {
    disablePlaygroundInProduction: true,
    maxComplexity: 1000,
    schemaOutputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/schema.graphql`,
    ...(config.graphQL || {}),
  }
  config.hooks = config.hooks ?? {}
  config.i18n = config.i18n ?? {}
  config.jobs = {
    deleteJobOnComplete: true,
    depth: 0,
    ...(config.jobs || {}),
    access: {
      run: defaultAccess,
      ...(config.jobs?.access || {}),
    },
  } as JobsConfig
  config.localization = config.localization ?? false
  config.maxDepth = config.maxDepth ?? 10
  config.routes = {
    admin: '/admin',
    api: (process.env.NEXT_BASE_PATH ?? '') + '/api',
    graphQL: '/graphql',
    graphQLPlayground: '/graphql-playground',
    ...(config.routes || {}),
  }
  config.serverURL = config.serverURL ?? ''
  config.telemetry = config.telemetry ?? true
  config.typescript = {
    autoGenerate: true,
    outputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/payload-types.ts`,
    ...(config.typescript || {}),
  }
  config.upload = config.upload ?? {}

  config.auth = {
    jwtOrder: ['JWT', 'Bearer', 'cookie'],
    ...(config.auth || {}),
  }

  return config
}
