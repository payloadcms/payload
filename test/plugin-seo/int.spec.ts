import path from 'path'

import payload from '../../packages/payload/src'
import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { initPayloadTest } from '../helpers/configHelpers'
import removeFiles from '../helpers/removeFiles'
import { mediaSlug } from './shared'

describe('SEO Plugin', () => {
  let page = null
  let mediaDoc = null

  beforeAll(async () => {
    const uploadsDir = path.resolve(__dirname, './media')
    removeFiles(path.normalize(uploadsDir))

    await initPayloadTest({ __dirname, init: { local: true } })

    // Create image
    const filePath = path.resolve(__dirname, './image-1.jpg')
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
        meta: {
          title: 'Test page',
        },
      },
      depth: 0,
    })
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
