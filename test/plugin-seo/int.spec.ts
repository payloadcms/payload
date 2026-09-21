import type { Payload } from 'payload'

import { randomBytes, randomUUID } from 'crypto'
import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import { removeFiles } from '../__helpers/shared/removeFiles.js'
import { mediaSlug, pagesSlug, siteSettingsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let editorUserID: number | string
let editorRestClient: NextRESTClient
let nonAdminUserID: number | string
let nonAdminRestClient: NextRESTClient
let restClient: NextRESTClient

describe('@payloadcms/plugin-seo', () => {
  let page = null
  let mediaDoc = null
  let mediaDoc2 = null
  let readablePage = null
  let trashedPage = null

  beforeAll(async () => {
    const uploadsDir = path.resolve(dirname, './media')
    removeFiles(path.normalize(uploadsDir))
    ;({ payload, restClient } = await initPayloadInt(dirname))

    // Create image
    const filePath = path.resolve(dirname, './image-1.jpg')
    const file = await getFileByPath(filePath)

    mediaDoc = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })

    page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Test page',
        slug: 'test-page',
        featuredMedia: mediaDoc.id,
        meta: {
          title: 'Test page',
        },
      },
      depth: 0,
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
    })

    trashedPage = await payload.create({
      collection: pagesSlug,
      data: {
        deletedAt: new Date().toISOString(),
        meta: {
          title: 'Trashed page',
        },
        slug: 'trashed-page',
        title: 'Trashed page',
      },
      depth: 0,
    })

    mediaDoc2 = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })

    const editorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'editor@example.com',
        password: 'test',
      },
    })
    editorUserID = editorUser.id

    editorRestClient = new NextRESTClient(payload.config)
    await editorRestClient.login({
      slug: 'users',
      credentials: {
        email: 'editor@example.com',
        password: 'test',
      },
    })

    const nonAdminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'non-admin@example.com',
        password: 'test',
      },
    })
    nonAdminUserID = nonAdminUser.id

    nonAdminRestClient = new NextRESTClient(payload.config)
    await nonAdminRestClient.login({
      slug: 'users',
      credentials: {
        email: 'non-admin@example.com',
        password: 'test',
      },
    })

    await payload.updateGlobal({
      slug: siteSettingsSlug,
      data: {
        meta: {
          title: 'Site settings',
        },
        title: 'Site settings',
      },
    })
    await restClient.login({ slug: 'users' })
  })

  afterAll(async () => {
    await payload.delete({ id: readablePage.id, collection: pagesSlug })
    await payload.delete({ id: trashedPage.id, collection: pagesSlug, trash: true })
    await payload.delete({ id: editorUserID, collection: 'users' })
    await payload.delete({ id: nonAdminUserID, collection: 'users' })
    await payload.destroy()
  })

  it.each([
    ['title', '/plugin-seo/generate-title'],
    ['description', '/plugin-seo/generate-description'],
    ['URL', '/plugin-seo/generate-url'],
    ['image', '/plugin-seo/generate-image'],
  ] as const)('should require authentication for %s generation', async (_, endpoint) => {
    const response = await restClient.POST(endpoint, {
      auth: false,
      body: JSON.stringify({
        collectionSlug: pagesSlug,
        doc: {
          title: 'Example page',
        },
      }),
    })

    expect(response.status).toBe(401)
  })

  it.each([
    ['title', '/plugin-seo/generate-title'],
    ['description', '/plugin-seo/generate-description'],
    ['URL', '/plugin-seo/generate-url'],
    ['image', '/plugin-seo/generate-image'],
  ] as const)('should require admin access for %s generation', async (_, endpoint) => {
    const response = await nonAdminRestClient.POST(endpoint, {
      body: JSON.stringify({
        collectionSlug: pagesSlug,
        doc: {
          title: 'Example page',
        },
      }),
    })

    expect(response.status).toBe(401)
  })

  it.each([
    ['title', '/plugin-seo/generate-title'],
    ['description', '/plugin-seo/generate-description'],
    ['URL', '/plugin-seo/generate-url'],
    ['image', '/plugin-seo/generate-image'],
  ] as const)('should respect collection read access for %s generation', async (_, endpoint) => {
    const response = await editorRestClient.POST(endpoint, {
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

  it('should not generate stored metadata from unreadable collection documents', async () => {
    const response = await editorRestClient.POST('/plugin-seo/generate-title', {
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

  it('should require matching collection document IDs', async () => {
    const response = await editorRestClient.POST('/plugin-seo/generate-title', {
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

  it('should respect collection read access for trashed documents', async () => {
    const response = await editorRestClient.POST('/plugin-seo/generate-title', {
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

  it.each([
    ['title', '/plugin-seo/generate-title'],
    ['description', '/plugin-seo/generate-description'],
    ['URL', '/plugin-seo/generate-url'],
    ['image', '/plugin-seo/generate-image'],
  ] as const)('should generate metadata for readable collection documents', async (_, endpoint) => {
    const response = await editorRestClient.POST(endpoint, {
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
  })

  it('should generate stored metadata from readable collection documents', async () => {
    const response = await editorRestClient.POST('/plugin-seo/generate-title', {
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

  it.each([
    ['title', '/plugin-seo/generate-title'],
    ['description', '/plugin-seo/generate-description'],
    ['URL', '/plugin-seo/generate-url'],
    ['image', '/plugin-seo/generate-image'],
  ] as const)('should generate metadata for unsaved collection documents', async (_, endpoint) => {
    const response = await editorRestClient.POST(endpoint, {
      body: JSON.stringify({
        collectionSlug: pagesSlug,
        doc: {
          title: 'Unsaved page',
        },
      }),
    })

    expect(response.status).toBe(200)
  })

  it('should generate metadata for unsaved collection documents with assigned IDs', async () => {
    const id =
      typeof readablePage.id === 'number'
        ? 987654321
        : /^[0-9a-f]{24}$/i.test(readablePage.id)
          ? randomBytes(12).toString('hex')
          : randomUUID()
    const response = await editorRestClient.POST('/plugin-seo/generate-description', {
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

  it.each([
    ['title', '/plugin-seo/generate-title'],
    ['description', '/plugin-seo/generate-description'],
    ['URL', '/plugin-seo/generate-url'],
    ['image', '/plugin-seo/generate-image'],
  ] as const)('should respect global read access for %s generation', async (_, endpoint) => {
    const response = await editorRestClient.POST(endpoint, {
      body: JSON.stringify({
        doc: {
          title: 'Updated site settings',
        },
        globalSlug: siteSettingsSlug,
      }),
    })

    expect(response.status).toBe(403)
  })

  it.each([
    ['title', '/plugin-seo/generate-title'],
    ['description', '/plugin-seo/generate-description'],
    ['URL', '/plugin-seo/generate-url'],
    ['image', '/plugin-seo/generate-image'],
  ] as const)('should generate metadata for readable globals', async (_, endpoint) => {
    const response = await restClient.POST(endpoint, {
      body: JSON.stringify({
        doc: {
          title: 'Updated site settings',
        },
        globalSlug: siteSettingsSlug,
      }),
    })

    expect(response.status).toBe(200)
  })

  it('should generate metadata for an authenticated admin user', async () => {
    const response = await restClient.POST('/plugin-seo/generate-title', {
      body: JSON.stringify({
        collectionSlug: pagesSlug,
        doc: {
          title: 'Example page',
        },
      }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ result: 'Website.com — Example page' })
  })

  it('should return different previousValue and value in afterChange hooks when relationship changes', async () => {
    // The existing page has mediaDoc as featuredMedia
    // Update it to mediaDoc2 and we expect to see different previousValue and value in the hook
    const context: { identicalCount?: number } = {}
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        // this field has an afterChange hook that will increment req.context.identicalCount
        // when previousValue === value
        featuredMedia: mediaDoc2.id,
      },
      depth: 0,
      context,
    })

    // If identicalCount was incremented, it means previousValue === value incorrectly
    // Since we updated the field, they should be different, so count should be undefined
    expect(context.identicalCount).toBeUndefined()
  })

  it('should add meta title', async () => {
    const pageWithTitle = await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        meta: {
          title: 'Hello, world!',
        },
      },
      depth: 0,
    })

    expect(pageWithTitle).toHaveProperty('meta')
    expect(pageWithTitle.meta).toHaveProperty('title')
    expect(pageWithTitle.meta.title).toBe('Hello, world!')
  })

  it('should add meta description', async () => {
    const pageWithDescription = await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        meta: {
          description: 'This is a test page',
        },
      },
      depth: 0,
    })

    expect(pageWithDescription).toHaveProperty('meta')
    expect(pageWithDescription.meta).toHaveProperty('description')
    expect(pageWithDescription.meta.description).toBe('This is a test page')
  })

  it('should add meta image', async () => {
    const pageWithImage = await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        meta: {
          image: mediaDoc.id,
        },
      },
      depth: 0,
    })

    expect(pageWithImage).toHaveProperty('meta')
    expect(pageWithImage.meta).toHaveProperty('image')
    expect(pageWithImage.meta.image).toBe(mediaDoc.id)
  })

  it('should add custom meta field', async () => {
    const pageWithCustomField = await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        meta: {
          ogTitle: 'Hello, world!',
        },
      },
      depth: 0,
    })

    expect(pageWithCustomField).toHaveProperty('meta')
    expect(pageWithCustomField.meta).toHaveProperty('ogTitle')
    expect(pageWithCustomField.meta.ogTitle).toBe('Hello, world!')
  })

  it('should localize meta fields', async () => {
    const pageWithLocalizedMeta = await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        meta: {
          title: 'Hola, mundo!',
          description: 'Esta es una página de prueba',
        },
      },
      locale: 'es',
      depth: 0,
    })

    expect(pageWithLocalizedMeta).toHaveProperty('meta')
    expect(pageWithLocalizedMeta.meta).toHaveProperty('title')
    expect(pageWithLocalizedMeta.meta.title).toBe('Hola, mundo!')
    expect(pageWithLocalizedMeta.meta).toHaveProperty('description')
    expect(pageWithLocalizedMeta.meta.description).toBe('Esta es una página de prueba')

    // query the page in the default locale
    const pageInDefaultLocale = await payload.findByID({
      collection: 'pages',
      id: page.id,
      depth: 0,
    })

    expect(pageInDefaultLocale).toHaveProperty('meta')
    expect(pageInDefaultLocale.meta).toHaveProperty('title')
    expect(pageInDefaultLocale.meta.title).toBe('Hello, world!')
    expect(pageInDefaultLocale.meta).toHaveProperty('description')
    expect(pageInDefaultLocale.meta.description).toBe('This is a test page')
  })
})
