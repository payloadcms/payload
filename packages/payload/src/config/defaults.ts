import path from 'path'

import type { Config } from './types'

export const defaults: Omit<Config, 'db' | 'editor'> = {
  admin: {
    avatar: 'default',
    buildPath: path.resolve(process.cwd(), './build'),
    components: {},
    css: path.resolve(__dirname, '../admin/scss/custom.css'),
    dateFormat: 'MMMM do yyyy, h:mm a',
    disable: false,
    inactivityRoute: '/logout-inactivity',
    indexHTML: path.resolve(__dirname, '../admin/index.html'),
    logoutRoute: '/logout',
    meta: {
      titleSuffix: '- Payload',
    },
  },
  collections: [],
  cookiePrefix: 'payload',
  cors: [],
  csrf: [],
  custom: {},
  defaultDepth: 2,
  defaultMaxTextLength: 40000,
  endpoints: [],
  express: {
    compression: {},
    json: {},
    middleware: [],
    postMiddleware: [],
    preMiddleware: [],
  },
  globals: [],
  graphQL: {
    disablePlaygroundInProduction: true,
    maxComplexity: 1000,
    schemaOutputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/schema.graphql`,
  },
  hooks: {},
  joiValidation: true,
  localization: false,
  maxDepth: 10,
  rateLimit: {
    max: 500,
    window: 15 * 60 * 1000, // 15min default,
  },
  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/graphql',
    graphQLPlayground: '/graphql-playground',
  },
  serverURL: '',
  telemetry: true,
  typescript: {
    outputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/payload-types.ts`,
  },
  upload: {},
}
