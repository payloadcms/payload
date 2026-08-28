import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { removeFiles } from '../__helpers/shared/removeFiles.js'
import testConfig from './config.js'
import { mediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.suite({ config: testConfig })('@payloadcms/plugin-seo', () => {
  let page = null
  let mediaDoc = null
  let mediaDoc2 = null

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

    mediaDoc2 = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })
  })

  test('should return different previousValue and value in afterChange hooks when relationship changes', async ({
    payload,
  }) => {
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

  test('should add meta title', async ({ payload }) => {
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

  test('should add meta description', async ({ payload }) => {
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

  test('should add meta image', async ({ payload }) => {
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

  test('should add custom meta field', async ({ payload }) => {
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

  test('should localize meta fields', async ({ payload }) => {
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        meta: {
          title: 'Hello, world!',
          description: 'This is a test page',
        },
      },
      locale: 'en',
      depth: 0,
    })

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
