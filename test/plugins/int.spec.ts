import type { Payload } from '../../packages/payload/src/index.js'
import { getPayload } from '../../packages/payload/src/index.js'
import { startMemoryDB } from '../startMemoryDB.js'
import configPromise, { pagesSlug } from './config.js'

let payload: Payload

describe('Collections - Plugins', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('created pages collection', async () => {
    const { id } = await payload.create({
      collection: pagesSlug,
      data: {
        title: 'Test Page',
      },
    })

    expect(id).toBeDefined()
  })
})
