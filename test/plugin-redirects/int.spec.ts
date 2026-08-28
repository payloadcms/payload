import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { Page } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import testConfig from './config.js'
import { pagesSlug } from './shared.js'

let page: Page

test.suite({ config: testConfig })('@payloadcms/plugin-redirects', () => {
  test.beforeEach(async ({ payload }) => {
    page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Test',
      },
    })
  })

  test('should add a redirects collection', async ({ payload }) => {
    const redirect = await payload.find({
      collection: 'redirects',
      depth: 0,
      limit: 1,
    })

    expect(redirect).toBeTruthy()
  })

  test('should add a redirect with to internal page', async ({ payload }) => {
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

  test('should add a redirect with to custom url', async ({ payload }) => {
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
