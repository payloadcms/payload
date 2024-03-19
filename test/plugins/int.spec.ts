import type { Payload } from 'payload'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise, { pagesSlug } from './config.js'

let payload: Payload

describe('Collections - Plugins', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(configPromise))
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
