import type { JobsConfig } from '../queues/config/types/index.js'
import type { Config } from './types.js'

import defaultAccess from '../auth/defaultAccess.js'
import { databaseKVAdapter } from '../kv/adapters/DatabaseKVAdapter.js'

export const defaults: Omit<Config, 'db' | 'editor' | 'secret'> = {
  admin: {
    avatar: 'gravatar',
    components: {},
    custom: {},
    dateFormat: 'MMMM do yyyy, h:mm a',
    dependencies: {},
    disable: false,
    importMap: {
      baseDir: `${typeof process?.cwd === 'function' ? process.cwd() : ''}`,
    },
    meta: {
      defaultOGImageType: 'dynamic',
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
  kv: databaseKVAdapter(),
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
