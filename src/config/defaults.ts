import path from 'path';
import { Config } from './types';

export const defaults: Config = {
  serverURL: '',
  defaultDepth: 2,
  maxDepth: 10,
  defaultMaxTextLength: 40000,
  collections: [],
  globals: [],
  endpoints: [],
  cookiePrefix: 'payload',
  csrf: [],
  cors: [],
  admin: {
    buildPath: path.resolve(process.cwd(), './build'),
    meta: {
      titleSuffix: '- Payload',
    },
    disable: false,
    indexHTML: path.resolve(__dirname, '../admin/index.html'),
    avatar: 'default',
    components: {},
    logoutRoute: '/logout',
    inactivityRoute: '/logout-inactivity',
    css: path.resolve(__dirname, '../admin/scss/custom.css'),
    dateFormat: 'MMMM do yyyy, h:mm a',
  },
  typescript: {
    outputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/payload-types.ts`,
  },
  upload: {},
  graphQL: {
    maxComplexity: 1000,
    disablePlaygroundInProduction: true,
    schemaOutputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/schema.graphql`,
  },
  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/graphql',
    graphQLPlayground: '/graphql-playground',
  },
  rateLimit: {
    window: 15 * 60 * 100, // 15min default,
    max: 500,
  },
  express: {
    json: {},
    compression: {},
    middleware: [],
    preMiddleware: [],
    postMiddleware: [],
  },
  hooks: {},
  localization: false,
  telemetry: true,
};
