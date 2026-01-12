import path from 'path'
import { buildConfig, getPayload } from 'payload'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describeToUse = process.env.PAYLOAD_DATABASE === 'postgres' ? describe : describe.skip

describeToUse('Postgres relationships v2-v3 migration', () => {
  it('should execute relationships v2-v3 migration', async () => {
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

    let hasErr = false

    await payload.db.migrate().catch(() => {
      hasErr = true
    })

    expect(hasErr).toBeFalsy()

    await payload.db.dropDatabase({ adapter: payload.db as any })
    await payload.destroy()
  })
})
