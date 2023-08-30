import * as url from 'node:url'

import payload from '../index.js'

export const migrate = async (args: string[]): Promise<void> => {
  // Barebones instance to access database adapter
  await payload.init({
    local: true,
    secret: '--unused--',
  })

  const adapter = payload.db

  if (!adapter) {
    throw new Error('No database adapter found')
  }

  switch (args[0]) {
    case 'migrate':
      await adapter.migrate()
      break
    case 'migrate:status':
      await adapter.migrateStatus()
      break
    case 'migrate:down':
      await adapter.migrateDown()
      break
    case 'migrate:refresh':
      await adapter.migrateRefresh()
      break
    case 'migrate:reset':
      await adapter.migrateReset()
      break
    case 'migrate:fresh':
      await adapter.migrateFresh()
      break
    case 'migrate:create':
      try {
        await adapter.createMigration(payload, '.migrations', args[1])
      } catch (err) {
        throw new Error(`Error creating migration: ${err.message}`)
      }
      break

    default:
      throw new Error(`Unknown migration command: ${args[0]}`)
  }
}

let isMainModule = false

if (typeof module !== 'undefined' && module) {
  //CJS
  if (module.id === require.main.id) {
    isMainModule = true
  }
} else {
  // ESM
  // This is an ESM translation from Rich Harris https://2ality.com/2022/07/nodejs-esm-main.html
  if (import.meta.url.startsWith('file:')) {
    // (A)
    const modulePath = url.fileURLToPath(import.meta.url)
    if (process.argv[1] === modulePath) {
      isMainModule = true
    }
  }
}
// When launched directly call migrate
if (isMainModule) {
  const args = process.argv.slice(2)
  migrate(args).then(() => {
    process.exit(0)
  })
}
