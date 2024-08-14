import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { Page } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { pagesSlug } from './shared.js'

let payload: Payload
let page: Page

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-redirects', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))

    page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Test',
      },
    })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
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
        type: '301',
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
        type: '301',
      },
    })

    expect(redirect).toBeTruthy()
    expect(redirect.from).toBe('/test2')
    expect(redirect.to.url).toBe('/test')
  })
})
