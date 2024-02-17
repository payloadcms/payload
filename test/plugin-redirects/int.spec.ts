import type { Payload } from '../../packages/payload/src'
import type { Page } from './payload-types'

import { getPayload } from '../../packages/payload/src'
import { startMemoryDB } from '../startMemoryDB'
import configPromise from './config'
import { pagesSlug } from './shared'

let payload: Payload
let page: Page

describe('@payloadcms/plugin-redirects', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })

    page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Test',
      },
    })
  })

  it('should add a redirects collection', async () => {
    const redirect = await payload.find({
      collection: 'redirects',
      depth: 0,
      limit: 1,
    })

    expect(redirect).toBeTruthy()
  })

  it('should add a redirect with to internal page', async () => {
    const redirect = await payload.create({
      collection: 'redirects',
      data: {
        from: '/test',
        to: {
          type: 'reference',
          reference: {
            relationTo: pagesSlug,
            value: page.id,
          },
        },
      },
    })

    expect(redirect).toBeTruthy()
    expect(redirect.from).toBe('/test')
    expect(redirect.to.reference.value).toMatchObject(page)
  })

  it('should add a redirect with to custom url', async () => {
    const redirect = await payload.create({
      collection: 'redirects',
      data: {
        from: '/test2',
        to: {
          type: 'custom',
          url: '/test',
        },
      },
    })

    expect(redirect).toBeTruthy()
    expect(redirect.from).toBe('/test2')
    expect(redirect.to.url).toBe('/test')
  })
})
