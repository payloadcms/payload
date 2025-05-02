/* eslint-disable jest/require-top-level-describe */
import { existsSync, rmdirSync, rmSync } from 'fs'
import path from 'path'
import { buildConfig, getPayload } from 'payload'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describe =
  process.env.PAYLOAD_DATABASE === 'postgres' ? global.describe : global.describe.skip

const clearMigrations = () => {
  if (existsSync(path.resolve(dirname, 'migrations'))) {
    rmSync(path.resolve(dirname, 'migrations'), { force: true, recursive: true })
  }
}

describe('SQL migrations', () => {
  // If something fails - an error will be thrown.
  // eslint-disable-next-line jest/expect-expect
  it('should up and down migration successfully', async () => {
    clearMigrations()

    const { databaseAdapter } = await import(path.resolve(dirname, '../../databaseAdapter.js'))

    const init = databaseAdapter.init

    // set options
    databaseAdapter.init = ({ payload }) => {
      const adapter = init({ payload })
      adapter.migrationDir = path.resolve(dirname, 'migrations')
      adapter.push = false
      return adapter
    }

    const config = await buildConfig({
      db: databaseAdapter,
      secret: 'secret',
      collections: [
        {
          slug: 'users',
          auth: true,
          fields: [],
        },
      ],
    })

    const payload = await getPayload({ config })

    await payload.db.createMigration({ payload })
    await payload.db.migrate()
    await payload.db.migrateDown()

    await payload.db.dropDatabase({ adapter: payload.db as any })
    await payload.db.destroy?.()
  })
})
