import { existsSync, rmSync } from 'fs'
import path from 'path'
import { buildConfig, getPayload } from 'payload'
import { fileURLToPath } from 'url'
import { describe, it } from 'vitest'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describeToUse = process.env.PAYLOAD_DATABASE === 'postgres' ? describe : describe.skip

const clearMigrations = () => {
  if (existsSync(path.resolve(dirname, 'migrations'))) {
    rmSync(path.resolve(dirname, 'migrations'), { force: true, recursive: true })
  }
}

describeToUse('SQL migrations', () => {
  // If something fails - an error will be thrown.
  it('should up and down migration successfully', async () => {
    clearMigrations()

    const { databaseAdapter } = await import(path.resolve(dirname, '../../databaseAdapter.js'))

    const init = databaseAdapter.init

    // set options
    databaseAdapter.init = ({ payload }) => {
      const adapter = init({ payload })
      adapter.findMigrationDir = () => path.resolve(dirname, 'migrations')
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
    await payload.destroy()
  })
})
