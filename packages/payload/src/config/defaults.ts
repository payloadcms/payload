import type { CLICommands, Config } from './types.js'

import { defaultAccess } from '../auth/defaultAccess.js'
import { databaseKVAdapter } from '../kv/adapters/DatabaseKVAdapter.js'

const defaultCLICommands: CLICommands = {
  build: 'payload/cli/builtin#createBuildCommand',
  'generate:db-schema': 'payload/cli/builtin#createGenerateDBSchemaCommand',
  'generate:importmap': 'payload/cli/builtin#createGenerateImportMapCommand',
  'generate:types': 'payload/cli/builtin#createGenerateTypesCommand',
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
  run: 'payload/cli/builtin#createRunCommand',
}

export const addDefaultsToConfig = (config: Config): Config => {
  const admin = config.admin

  config.admin = {
    ...admin,
    avatar: admin?.avatar ?? 'gravatar',
    components: admin?.components ?? {},
    custom: admin?.custom ?? {},
    dateFormat: admin?.dateFormat ?? 'MMMM do yyyy, h:mm a',
    dependencies: admin?.dependencies ?? {},
    importMap: {
      ...admin?.importMap,
      baseDir:
        admin?.importMap?.baseDir ?? `${typeof process?.cwd === 'function' ? process.cwd() : ''}`,
    },
    meta: {
      ...admin?.meta,
      defaultOGImageType: admin?.meta?.defaultOGImageType ?? 'dynamic',
      robots: admin?.meta?.robots === undefined ? 'noindex, nofollow' : admin.meta.robots,
      titleSuffix: admin?.meta?.titleSuffix ?? '- Payload',
    },
    routes: {
      ...admin?.routes,
      account: admin?.routes?.account ?? '/account',
      createFirstUser: admin?.routes?.createFirstUser ?? '/create-first-user',
      forgot: admin?.routes?.forgot ?? '/forgot',
      inactivity: admin?.routes?.inactivity ?? '/logout-inactivity',
      login: admin?.routes?.login ?? '/login',
      logout: admin?.routes?.logout ?? '/logout',
      reset: admin?.routes?.reset ?? '/reset',
      unauthorized: admin?.routes?.unauthorized ?? '/unauthorized',
    },
    theme: admin?.theme ?? 'all',
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
  const graphQL = config.graphQL

  config.graphQL = {
    ...graphQL,
    disableIntrospectionInProduction: graphQL?.disableIntrospectionInProduction ?? true,
    disablePlaygroundInProduction: graphQL?.disablePlaygroundInProduction ?? true,
    maxComplexity: graphQL?.maxComplexity ?? 1000,
    schemaOutputFile:
      graphQL?.schemaOutputFile ??
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
  const routes = config.routes

  config.routes = {
    ...routes,
    admin: routes?.admin ?? '/admin',
    api: routes?.api ?? '/api',
    graphQL: routes?.graphQL ?? '/graphql',
    graphQLPlayground: routes?.graphQLPlayground ?? '/graphql-playground',
  }
  config.serverURL = config.serverURL ?? ''
  config.telemetry = config.telemetry ?? true
  const typescript = config.typescript

  config.typescript = {
    ...typescript,
    autoGenerate: typescript?.autoGenerate ?? true,
    outputFile:
      typescript?.outputFile ??
      `${typeof process?.cwd === 'function' ? process.cwd() : ''}/payload-types.ts`,
  }
  config.upload = config.upload ?? {}

  config.auth = {
    ...(config.auth || {}),
    jwtOrder: config.auth?.jwtOrder ?? ['JWT', 'Bearer', 'cookie'],
  }

  config.kv = config.kv ?? databaseKVAdapter()

  if (config.kv?.kvCollection) {
    config.collections.push(config.kv.kvCollection)
  }

  return config
}
