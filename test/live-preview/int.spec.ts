import path from 'path'

import type { Page } from './payload-types'

import { mergeData as mergeLivePreviewData } from '../../packages/live-preview/src/mergeData'
import payload from '../../packages/payload/src'
import { fieldSchemaToJSON } from '../../packages/payload/src/utilities/fieldSchemaToJSON'
import { initPayloadTest } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import { Pages } from './collections/Pages'
import configPromise, { pagesSlug } from './config'

require('isomorphic-fetch')

let client
let serverURL

let page: Page

// create a util so we don't have to rewrite the args on every test
const mergeData = async (edits: Partial<Page>): Promise<Page> => {
  return await mergeLivePreviewData<Page>({
    depth: 1,
    fieldSchema: fieldSchemaToJSON(Pages.fields),
    incomingData: edits,
    initialData: page,
    serverURL,
  })
}

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
        layout: [
          {
            blockType: 'cta',
            id: 'block-1',
            richText: [
              {
                type: 'paragraph',
                text: 'Block 1',
              },
            ],
          },
        ],
      },
    })

    media = await payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, './seed/image-1.jpg'),
      data: {
        alt: 'Image 1',
      },
    })
  })

  it('reorders blocks', async () => {
    const merge1 = await mergeData({
      layout: [
        {
          // the page was initialized with a first block already, we we're replacing it here
          blockType: 'cta',
          id: page.layout[0].id, // use real ID
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
    })

    expect(merge1.layout).toHaveLength(2)

    const block1 = merge1.layout[0]
    expect(block1.id).toEqual('block-1')
    expect(block1.richText[0].text).toEqual('Block 1 (Position 1)')

    const block2 = merge1.layout[1]
    expect(block2.id).toEqual('block-2')
    expect(block2.richText[0].text).toEqual('Block 2 (Position 2)')

    // Reorder blocks, but using the IDs from the previous merge
    const merge2 = await mergeData({
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
    })

    expect(merge2.layout).toHaveLength(2)

    expect(merge2.layout[0].id).toEqual(block2.id)
    expect(merge2.layout[1].id).toEqual(block1.id)

    expect(merge2.layout[0].richText[0].text).toEqual('Block 2 (Position 1)')
    expect(merge2.layout[1].richText[0].text).toEqual('Block 1 (Position 2)')
  })
})
