import path from 'path'

import type { Media, Page } from './payload-types'

import { handleMessage } from '../../packages/live-preview/src/handleMessage'
import { mergeData } from '../../packages/live-preview/src/mergeData'
import payload from '../../packages/payload/src'
import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { fieldSchemaToJSON } from '../../packages/payload/src/utilities/fieldSchemaToJSON'
import { initPayloadTest } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import { Pages } from './collections/Pages'
import configPromise, { pagesSlug } from './config'

require('isomorphic-fetch')

let client
let serverURL

let page: Page
let media: Media

const schemaJSON = fieldSchemaToJSON(Pages.fields)

describe('Collections - Live Preview', () => {
  beforeAll(async () => {
    const { serverURL: incomingServerURL } = await initPayloadTest({
      __dirname,
      init: { local: false },
    })

    serverURL = incomingServerURL
    const config = await configPromise
    client = new RESTClient(config, { serverURL, defaultSlug: pagesSlug })
    await client.login()

    page = await payload.create({
      collection: pagesSlug,
      data: {
        slug: 'home',
        title: 'Test Page',
      },
    })

    // Create image
    const filePath = path.resolve(__dirname, './seed/image-1.jpg')
    const file = await getFileByPath(filePath)
    file.name = 'image-1.jpg'

    media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Image 1',
      },
      file,
    })
  })

  it('handles `postMessage`', async () => {
    const handledMessage = await handleMessage({
      depth: 1,
      event: {
        data: JSON.stringify({
          data: {
            title: 'Test Page (Change 1)',
          },
          fieldSchemaJSON: schemaJSON,
          type: 'payload-live-preview',
        }),
        origin: serverURL,
      } as MessageEvent,
      initialData: page,
      serverURL,
    })

    expect(handledMessage.title).toEqual('Test Page (Change 1)')
  })

  it('caches `fieldSchemaJSON`', async () => {
    const handledMessage = await handleMessage({
      depth: 1,
      event: {
        data: JSON.stringify({
          data: {
            title: 'Test Page (Change 2)',
          },
          type: 'payload-live-preview',
        }),
        origin: serverURL,
      } as MessageEvent,
      initialData: page,
      serverURL,
    })

    expect(handledMessage.title).toEqual('Test Page (Change 2)')
  })

  it('merges data', async () => {
    expect(page?.id).toBeDefined()

    const mergedData = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: page,
      initialData: page,
      serverURL,
    })

    expect(mergedData.id).toEqual(page.id)
  })

  it('merges strings', async () => {
    const mergedData = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...page,
        title: 'Test Page (Change 3)',
      },
      initialData: page,
      serverURL,
    })

    expect(mergedData.title).toEqual('Test Page (Change 3)')
  })

  // TODO: this test is not working in Postgres
  // This is because of how relationships are handled in `mergeData`
  // This test passes in MongoDB, though
  it.skip('adds and removes uploads', async () => {
    // Add upload
    const mergedData = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...page,
        hero: {
          type: 'highImpact',
          media: media.id,
        },
      },
      initialData: page,
      serverURL,
    })

    expect(mergedData.hero.media).toMatchObject(media)

    // Add upload
    const mergedDataWithoutUpload = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...mergedData,
        hero: {
          type: 'highImpact',
          media: null,
        },
      },
      initialData: mergedData,
      serverURL,
    })

    expect(mergedDataWithoutUpload.hero.media).toEqual(null)
  })

  it('add, reorder, and remove blocks', async () => {
    // Add new blocks
    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...page,
        layout: [
          {
            blockType: 'cta',
            id: 'block-1', // use fake ID, this is a new block that is only assigned an ID on the client
            richText: [
              {
                type: 'paragraph',
                text: 'Block 1 (Position 1)',
              },
            ],
          },
          {
            blockType: 'cta',
            id: 'block-2', // use fake ID, this is a new block that is only assigned an ID on the client
            richText: [
              {
                type: 'paragraph',
                text: 'Block 2 (Position 2)',
              },
            ],
          },
        ],
      },
      initialData: page,
      serverURL,
    })

    // Check that the blocks have been merged and are in the correct order
    expect(merge1.layout).toHaveLength(2)
    const block1 = merge1.layout[0]
    expect(block1.id).toEqual('block-1')
    expect(block1.richText[0].text).toEqual('Block 1 (Position 1)')
    const block2 = merge1.layout[1]
    expect(block2.id).toEqual('block-2')
    expect(block2.richText[0].text).toEqual('Block 2 (Position 2)')

    // Reorder the blocks using the same IDs from the previous merge
    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...merge1,
        layout: [
          {
            id: block2.id,
            blockType: 'content',
            richText: [
              {
                type: 'paragraph',
                text: 'Block 2 (Position 1)',
              },
            ],
          },
          {
            id: block1.id,
            blockType: 'content',
            richText: [
              {
                type: 'paragraph',
                text: 'Block 1 (Position 2)',
              },
            ],
          },
        ],
      },
      initialData: merge1,
      serverURL,
    })

    // Check that the blocks have been reordered
    expect(merge2.layout).toHaveLength(2)
    expect(merge2.layout[0].id).toEqual(block2.id)
    expect(merge2.layout[1].id).toEqual(block1.id)
    expect(merge2.layout[0].richText[0].text).toEqual('Block 2 (Position 1)')
    expect(merge2.layout[1].richText[0].text).toEqual('Block 1 (Position 2)')

    // Remove a block
    const merge3 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...merge2,
        layout: [
          {
            id: block2.id,
            blockType: 'content',
            richText: [
              {
                type: 'paragraph',
                text: 'Block 2 (Position 1)',
              },
            ],
          },
        ],
      },
      initialData: merge2,
      serverURL,
    })

    // Check that the block has been removed
    expect(merge3.layout).toHaveLength(1)
    expect(merge3.layout[0].id).toEqual(block2.id)
    expect(merge3.layout[0].richText[0].text).toEqual('Block 2 (Position 1)')

    // Remove the last block to ensure that all blocks can be cleared
    const merge4 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...merge3,
        layout: [],
      },
      initialData: merge3,
      serverURL,
    })

    // Check that the block has been removed
    expect(merge4.layout).toHaveLength(0)
  })
})
