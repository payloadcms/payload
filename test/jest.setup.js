import console from 'console'
global.console = console

import { generateDatabaseAdapter } from './generateDatabaseAdapter.js'

process.env.PAYLOAD_DISABLE_ADMIN = 'true'
process.env.PAYLOAD_DROP_DATABASE = 'true'

process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER = 's3'

process.env.NODE_OPTIONS = '--no-deprecation'
process.env.PAYLOAD_CI_DEPENDENCY_CHECKER = 'true'

const dbAdapter = process.env.PAYLOAD_DATABASE || 'postgres'

generateDatabaseAdapter(dbAdapter)
