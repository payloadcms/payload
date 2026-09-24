import { randomBytes, randomUUID } from 'crypto'
import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { removeFiles } from '../__helpers/shared/removeFiles.js'
import { mediaSlug, pagesSlug, siteSettingsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const generationEndpoints = [
  {
    body: { title: 'Example page' },
    endpoint: '/plugin-seo/generate-title',
    expectedResult: 'Website.com — Example page',
  },
  {
    body: { excerpt: 'Example summary' },
    endpoint: '/plugin-seo/generate-description',
    expectedResult: 'Example summary',
  },
  {
    body: { slug: 'example-page' },
    endpoint: '/plugin-seo/generate-url',
    expectedResult: 'https://yoursite.com/example-page',
  },
  {
    body: { title: 'Example page' },
    endpoint: '/plugin-seo/generate-image',
    expectedResult: 'generated-image',
  },
] as const

test.suite('@payloadcms/plugin-seo', { config: './config.ts' }, () => {
  let page = null
  let mediaDoc = null
  let mediaDoc2 = null
  let readablePage = null
  let trashedPage = null

  test.beforeEach(async ({ payload }) => {
    const uploadsDir = path.resolve(dirname, './media')
    removeFiles(path.normalize(uploadsDir))

    // Create image
    const filePath = path.resolve(dirname, './image-1.jpg')
    const file = await getFileByPath(filePath)

    mediaDoc = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
      overrideAccess: true,
    })

    page = await payload.create({
      collection: 'pages',
      data: {
        slug: 'test-page',
        featuredMedia: mediaDoc.id,
        meta: {
          title: 'Test page',
        },
        title: 'Test page',
      },
      depth: 0,
      overrideAccess: true,
    })

    readablePage = await payload.create({
      collection: pagesSlug,
      data: {
        slug: 'readable-page',
        meta: {
          title: 'Readable page',
        },
        title: 'Readable page',
      },
      depth: 0,
      overrideAccess: true,
    })

    trashedPage = await payload.create({
      collection: pagesSlug,
      data: {
        slug: 'trashed-page',
        deletedAt: new Date().toISOString(),
        meta: {
          title: 'Trashed page',
        },
        title: 'Trashed page',
      },
      depth: 0,
      overrideAccess: true,
    })

    mediaDoc2 = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
      overrideAccess: true,
    })
  })

  test('should require authentication for generation endpoints', async ({ restClient }) => {
    const statuses: number[] = []

    for (const { body, endpoint } of generationEndpoints) {
      const response = await restClient.POST(endpoint, {
        auth: false,
        body: JSON.stringify({
          collectionSlug: pagesSlug,
          doc: body,
        }),
      })

      statuses.push(response.status)
    }

    expect(statuses).toEqual([401, 401, 401, 401])
  })

  test('should require admin access for generation endpoints', async ({ restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'non-admin@example.com',
        password: 'test',
      },
    })

    const statuses: number[] = []

    for (const { body, endpoint } of generationEndpoints) {
      const response = await restClient.POST(endpoint, {
        body: JSON.stringify({
          collectionSlug: pagesSlug,
          doc: body,
        }),
      })

      statuses.push(response.status)
    }

    expect(statuses).toEqual([401, 401, 401, 401])
  })

  test('should generate metadata for an authenticated admin user', async ({ restClient }) => {
    await restClient.login({ slug: 'users' })

    const results: unknown[] = []

    for (const { body, endpoint } of generationEndpoints) {
      const response = await restClient.POST(endpoint, {
        body: JSON.stringify({
          collectionSlug: pagesSlug,
          doc: body,
        }),
      })

      expect(response.status).toBe(200)
      results.push(await response.json())
    }

    expect(results).toEqual(
      generationEndpoints.map(({ expectedResult }) => ({ result: expectedResult })),
    )
  })

  test('should respect collection read access for generation endpoints', async ({ restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const statuses: number[] = []

    for (const { endpoint } of generationEndpoints) {
      const response = await restClient.POST(endpoint, {
        body: JSON.stringify({
          id: page.id,
          collectionSlug: pagesSlug,
          doc: {
            id: page.id,
            title: 'Updated page',
          },
        }),
      })

      statuses.push(response.status)
    }

    expect(statuses).toEqual([403, 403, 403, 403])
  })

  test('should not generate stored metadata from unreadable collection documents', async ({
    restClient,
  }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const response = await restClient.POST('/plugin-seo/generate-title', {
      body: JSON.stringify({
        id: page.id,
        collectionSlug: pagesSlug,
        doc: {
          id: page.id,
          title: 'Updated page',
        },
      }),
    })

    expect(response.status).toBe(403)
  })

  test('should require matching collection document IDs', async ({ restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const response = await restClient.POST('/plugin-seo/generate-title', {
      body: JSON.stringify({
        id: readablePage.id,
        collectionSlug: pagesSlug,
        doc: {
          id: page.id,
          title: 'Updated page',
        },
      }),
    })

    expect(response.status).toBe(403)
  })

  test('should respect collection read access for trashed documents', async ({ restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const response = await restClient.POST('/plugin-seo/generate-title', {
      body: JSON.stringify({
        id: trashedPage.id,
        collectionSlug: pagesSlug,
        doc: {
          id: trashedPage.id,
          title: 'Updated trashed page',
        },
      }),
    })

    expect(response.status).toBe(403)
  })

  test('should generate metadata for readable collection documents', async ({ restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const statuses: number[] = []

    for (const { endpoint } of generationEndpoints) {
      const response = await restClient.POST(endpoint, {
        body: JSON.stringify({
          id: readablePage.id,
          collectionSlug: pagesSlug,
          doc: {
            id: readablePage.id,
            title: 'Updated readable page',
          },
        }),
      })

      statuses.push(response.status)
    }

    expect(statuses).toEqual([200, 200, 200, 200])
  })

  test('should generate stored metadata from readable collection documents', async ({
    restClient,
  }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const response = await restClient.POST('/plugin-seo/generate-title', {
      body: JSON.stringify({
        id: readablePage.id,
        collectionSlug: pagesSlug,
        doc: {
          id: readablePage.id,
          title: 'Updated readable page',
        },
      }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ result: 'Website.com — Readable page' })
  })

  test('should generate metadata for unsaved collection documents', async ({ restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const statuses: number[] = []

    for (const { endpoint } of generationEndpoints) {
      const response = await restClient.POST(endpoint, {
        body: JSON.stringify({
          collectionSlug: pagesSlug,
          doc: {
            title: 'Unsaved page',
          },
        }),
      })

      statuses.push(response.status)
    }

    expect(statuses).toEqual([200, 200, 200, 200])
  })

  test('should generate metadata for unsaved collection documents with assigned IDs', async ({
    restClient,
  }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const id =
      typeof readablePage.id === 'number'
        ? 987654321
        : /^[0-9a-f]{24}$/i.test(readablePage.id)
          ? randomBytes(12).toString('hex')
          : randomUUID()

    const response = await restClient.POST('/plugin-seo/generate-description', {
      body: JSON.stringify({
        id,
        collectionSlug: pagesSlug,
        doc: {
          id,
          title: 'Unsaved page',
        },
      }),
    })

    expect(response.status).toBe(200)
  })

  test('should respect global read access for generation endpoints', async ({ restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const statuses: number[] = []

    for (const { endpoint } of generationEndpoints) {
      const response = await restClient.POST(endpoint, {
        body: JSON.stringify({
          doc: {
            title: 'Updated site settings',
          },
          globalSlug: siteSettingsSlug,
        }),
      })

      statuses.push(response.status)
    }

    expect(statuses).toEqual([403, 403, 403, 403])
  })

  test('should generate metadata for readable globals', async ({ restClient }) => {
    await restClient.login({ slug: 'users' })

    const statuses: number[] = []

    for (const { endpoint } of generationEndpoints) {
      const response = await restClient.POST(endpoint, {
        body: JSON.stringify({
          doc: {
            title: 'Updated site settings',
          },
          globalSlug: siteSettingsSlug,
        }),
      })

      statuses.push(response.status)
    }

    expect(statuses).toEqual([200, 200, 200, 200])
  })

  test('should return different previousValue and value in afterChange hooks when relationship changes', async ({
    payload,
  }) => {
    // The existing page has mediaDoc as featuredMedia
    // Update it to mediaDoc2 and we expect to see different previousValue and value in the hook
    const context: { identicalCount?: number } = {}
    await payload.update({
      id: page.id,
      collection: 'pages',
      context,
      data: {
        // this field has an afterChange hook that will increment req.context.identicalCount
        // when previousValue === value
        featuredMedia: mediaDoc2.id,
      },
      depth: 0,
      overrideAccess: true,
    })

    // If identicalCount was incremented, it means previousValue === value incorrectly
    // Since we updated the field, they should be different, so count should be undefined
    expect(context.identicalCount).toBeUndefined()
  })

  test('should add meta title', async ({ payload }) => {
    const pageWithTitle = await payload.update({
      id: page.id,
      collection: 'pages',
      data: {
        meta: {
          title: 'Hello, world!',
        },
      },
      depth: 0,
      overrideAccess: true,
    })

    expect(pageWithTitle).toHaveProperty('meta')
    expect(pageWithTitle.meta).toHaveProperty('title')
    expect(pageWithTitle.meta.title).toBe('Hello, world!')
  })

  test('should add meta description', async ({ payload }) => {
    const pageWithDescription = await payload.update({
      id: page.id,
      collection: 'pages',
      data: {
        meta: {
          description: 'This is a test page',
        },
      },
      depth: 0,
      overrideAccess: true,
    })

    expect(pageWithDescription).toHaveProperty('meta')
    expect(pageWithDescription.meta).toHaveProperty('description')
    expect(pageWithDescription.meta.description).toBe('This is a test page')
  })

  test('should add meta image', async ({ payload }) => {
    const pageWithImage = await payload.update({
      id: page.id,
      collection: 'pages',
      data: {
        meta: {
          image: mediaDoc.id,
        },
      },
      depth: 0,
      overrideAccess: true,
    })

    expect(pageWithImage).toHaveProperty('meta')
    expect(pageWithImage.meta).toHaveProperty('image')
    expect(pageWithImage.meta.image).toBe(mediaDoc.id)
  })

  test('should add custom meta field', async ({ payload }) => {
    const pageWithCustomField = await payload.update({
      id: page.id,
      collection: 'pages',
      data: {
        meta: {
          ogTitle: 'Hello, world!',
        },
      },
      depth: 0,
      overrideAccess: true,
    })

    expect(pageWithCustomField).toHaveProperty('meta')
    expect(pageWithCustomField.meta).toHaveProperty('ogTitle')
    expect(pageWithCustomField.meta.ogTitle).toBe('Hello, world!')
  })

  test('should localize meta fields', async ({ payload }) => {
    await payload.update({
      id: page.id,
      collection: 'pages',
      data: {
        meta: {
          description: 'This is a test page',
          title: 'Hello, world!',
        },
      },
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })

    const pageWithLocalizedMeta = await payload.update({
      id: page.id,
      collection: 'pages',
      data: {
        meta: {
          description: 'Esta es una página de prueba',
          title: 'Hola, mundo!',
        },
      },
      depth: 0,
      locale: 'es',
      overrideAccess: true,
    })

    expect(pageWithLocalizedMeta).toHaveProperty('meta')
    expect(pageWithLocalizedMeta.meta).toHaveProperty('title')
    expect(pageWithLocalizedMeta.meta.title).toBe('Hola, mundo!')
    expect(pageWithLocalizedMeta.meta).toHaveProperty('description')
    expect(pageWithLocalizedMeta.meta.description).toBe('Esta es una página de prueba')

    // query the page in the default locale
    const pageInDefaultLocale = await payload.findByID({
      id: page.id,
      collection: 'pages',
      depth: 0,
      overrideAccess: true,
    })

    expect(pageInDefaultLocale).toHaveProperty('meta')
    expect(pageInDefaultLocale.meta).toHaveProperty('title')
    expect(pageInDefaultLocale.meta.title).toBe('Hello, world!')
    expect(pageInDefaultLocale.meta).toHaveProperty('description')
    expect(pageInDefaultLocale.meta.description).toBe('This is a test page')
  })
})
