import type { Payload } from '../../packages/payload/src'

import { getPayload } from '../../packages/payload/src'
import { startMemoryDB } from '../startMemoryDB'
import configPromise, { pagesSlug } from './config'

let payload: Payload

describe('Collections - Plugins', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
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
