import type { LexicalRichTextAdapter } from '@payloadcms/richtext-lexical'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { postsSlug } from './collections/Posts/index.js'

let token: string

const { email, password } = devUser

test.suite({ config: './config.ts' })('_Community Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  test.beforeEach(async ({ restClient }) => {
    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())

    token = data.token
  })

  // --__--__--__--__--__--__--__--__--__
  // You can run tests against the local API or the REST API
  // use the tests below as a guide
  // --__--__--__--__--__--__--__--__--__

  test('local API example', async ({ payload }) => {
    const newPost = await payload.create({
      collection: postsSlug,
      context: {},
      data: {
        title: 'LOCAL API EXAMPLE',
      },
    })

    expect(newPost.title).toEqual('LOCAL API EXAMPLE')
  })

  test('rest API example', async ({ restClient }) => {
    const data = await restClient
      .POST(`/${postsSlug}`, {
        body: JSON.stringify({
          title: 'REST API EXAMPLE',
        }),
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      .then((res) => res.json())

    expect(data.doc.title).toEqual('REST API EXAMPLE')
  })

  test('should seed linked sample content across the demo collections', async ({ payload }) => {
    const [articles, authors, categories, events, media, pages, products] = await Promise.all([
      payload.find({ collection: 'articles', limit: 1 }),
      payload.count({ collection: 'authors' }),
      payload.count({ collection: 'categories' }),
      payload.count({ collection: 'events' }),
      payload.count({ collection: 'media' }),
      payload.count({ collection: 'pages' }),
      payload.count({ collection: 'products' }),
    ])

    expect(articles.totalDocs).toBe(10)
    expect(articles.docs[0]?.author).toBeTruthy()
    expect(authors.totalDocs).toBe(4)
    expect(categories.totalDocs).toBe(5)
    expect(events.totalDocs).toBe(8)
    expect(media.totalDocs).toBe(3)
    expect(pages.totalDocs).toBe(6)
    expect(products.totalDocs).toBe(8)
  })

  test('should enable the fixed toolbar for the article body', ({ payload }) => {
    const articles = payload.config.collections.find(({ slug }) => slug === 'articles')
    const tabs = articles?.fields.find((field) => field.type === 'tabs')
    const body =
      tabs?.type === 'tabs' && tabs.tabs[0]?.fields.find((field) => field.name === 'body')

    expect(body?.type).toBe('richText')
    expect(
      (body?.type === 'richText'
        ? (body.editor as LexicalRichTextAdapter)
        : undefined
      )?.editorConfig.resolvedFeatureMap.has('toolbarFixed'),
    ).toBe(true)
  })
})
