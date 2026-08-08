import type { CLICommands, Config } from './types.js'

import { defaultAccess } from '../auth/defaultAccess.js'
import { databaseKVAdapter } from '../kv/adapters/DatabaseKVAdapter.js'

const defaultCLICommands: CLICommands = {
  build: 'payload/cli/builtin#createBuildCommand',
  countDocuments: 'payload/cli/builtin#createCountDocumentsCommand',
  countGlobalVersions: 'payload/cli/builtin#createCountGlobalVersionsCommand',
  countVersions: 'payload/cli/builtin#createCountVersionsCommand',
  createDocuments: 'payload/cli/builtin#createCreateDocumentsCommand',
  deleteDocuments: 'payload/cli/builtin#createDeleteDocumentsCommand',
  duplicateDocument: 'payload/cli/builtin#createDuplicateDocumentCommand',
  findDistinct: 'payload/cli/builtin#createFindDistinctCommand',
  findDocuments: 'payload/cli/builtin#createFindDocumentsCommand',
  findGlobal: 'payload/cli/builtin#createFindGlobalCommand',
  findGlobalVersionByID: 'payload/cli/builtin#createFindGlobalVersionByIDCommand',
  findGlobalVersions: 'payload/cli/builtin#createFindGlobalVersionsCommand',
  findVersionByID: 'payload/cli/builtin#createFindVersionByIDCommand',
  findVersions: 'payload/cli/builtin#createFindVersionsCommand',
  'generate:db-schema': 'payload/cli/builtin#createGenerateDBSchemaCommand',
  'generate:importmap': 'payload/cli/builtin#createGenerateImportMapCommand',
  'generate:types': 'payload/cli/builtin#createGenerateTypesCommand',
  getCollectionSchema: 'payload/cli/builtin#createGetCollectionSchemaCommand',
  getConfigInfo: 'payload/cli/builtin#createGetConfigInfoCommand',
  getGlobalSchema: 'payload/cli/builtin#createGetGlobalSchemaCommand',
  help: 'payload/cli/builtin#createHelpCommand',
  info: 'payload/cli/builtin#createInfoCommand',
  'jobs:handle-schedules': 'payload/cli/builtin#createJobsHandleSchedulesCommand',
  'jobs:run': 'payload/cli/builtin#createJobsRunCommand',
  migrate: 'payload/cli/builtin#createMigrateCommand',
  'migrate:create': 'payload/cli/builtin#createMigrateCreateCommand',
  'migrate:down': 'payload/cli/builtin#createMigrateDownCommand',
  'migrate:fresh': 'payload/cli/builtin#createMigrateFreshCommand',
  'migrate:refresh': 'payload/cli/builtin#createMigrateRefreshCommand',
  'migrate:reset': 'payload/cli/builtin#createMigrateResetCommand',
  'migrate:status': 'payload/cli/builtin#createMigrateStatusCommand',
  restoreGlobalVersion: 'payload/cli/builtin#createRestoreGlobalVersionCommand',
  restoreVersion: 'payload/cli/builtin#createRestoreVersionCommand',
  run: 'payload/cli/builtin#createRunCommand',
  updateDocument: 'payload/cli/builtin#createUpdateDocumentCommand',
  updateGlobal: 'payload/cli/builtin#createUpdateGlobalCommand',
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

  if (config.cli !== false) {
    config.cli = {
      ...config.cli,
      commands: {
        ...defaultCLICommands,
        ...config.cli?.commands,
      },
    }
  }
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
    disableIntrospectionInProduction: true,
    disablePlaygroundInProduction: true,
    maxComplexity: 1000,
    schemaOutputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/schema.graphql`,
    ...(config.graphQL || {}),
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
    admin: '/admin',
    api: '/api',
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

  config.kv = config.kv ?? databaseKVAdapter()

  if (config.kv?.kvCollection) {
    config.collections.push(config.kv.kvCollection)
  }

  return config
}
