import type { Payload } from 'payload'

import {
  handleMessage,
  type LivePreviewMessageEvent,
  mergeData,
  traverseRichText,
} from '@payloadcms/live-preview'
import path from 'path'
import { getFileByPath } from 'payload'
import { fieldSchemaToJSON } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Media, Page, Post, Tenant } from './payload-types.js'
import config from './config.js'

import { Pages } from './collections/Pages.js'
import { postsSlug, tenantsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const schemaJSON = fieldSchemaToJSON(Pages.fields, config)

let payload: Payload
let restClient: NextRESTClient

import { initPayloadInt } from '../helpers/initPayloadInt.js'

function collectionPopulationRequestHandler({ endpoint }: { endpoint: string }) {
  return restClient.GET(`/${endpoint}`)
}

describe('Collections - Live Preview', () => {
  let serverURL

  let testPost: Post
  let testPostTwo: Post
  let tenant: Tenant
  let media: Media

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    tenant = await payload.create({
      collection: tenantsSlug,
      data: {
        title: 'Tenant 1',
        clientURL: 'http://localhost:3000',
      },
    })

    testPost = await payload.create({
      collection: postsSlug,
      data: {
        slug: 'post-1',
        title: 'Test Post',
        tenant: tenant.id,
        localizedTitle: 'Test Post',
      },
    })

    testPostTwo = await payload.create({
      collection: postsSlug,
      data: {
        slug: 'post-2',
        title: 'Test Post 2',
        tenant: tenant.id,
        localizedTitle: 'Test Post 2',
      },
    })

    // Create image
    const filePath = path.resolve(dirname, './seed/image-1.jpg')
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

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('handles `postMessage`', async () => {
    const handledMessage = await handleMessage({
      depth: 1,
      event: {
        data: {
          data: {
            title: 'Test Page (Changed)',
          },
          fieldSchemaJSON: schemaJSON,
          type: 'payload-live-preview',
        },
        origin: serverURL,
      } as MessageEvent as LivePreviewMessageEvent<Page>,
      initialData: {
        title: 'Test Page',
      } as Page,
      serverURL,
    })

    expect(handledMessage.title).toEqual('Test Page (Changed)')
  })

  it('caches `fieldSchemaJSON`', async () => {
    const handledMessage = await handleMessage({
      depth: 1,
      event: {
        data: {
          data: {
            title: 'Test Page (Changed)',
          },
          type: 'payload-live-preview',
        },
        origin: serverURL,
      } as MessageEvent as LivePreviewMessageEvent<Page>,
      initialData: {
        title: 'Test Page',
      } as Page,
      serverURL,
    })

    expect(handledMessage.title).toEqual('Test Page (Changed)')
  })

  it('merges data', async () => {
    const initialData: Partial<Page> = {
      id: '123',
      title: 'Test Page',
    }

    const mergedData = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        title: 'Test Page (Merged)',
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
    })

    expect(mergedData.id).toEqual(initialData.id)
    expect(mergedData._numberOfRequests).toEqual(0)
  })

  it('— strings - merges data', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const mergedData = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        title: 'Test Page (Changed)',
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(mergedData.title).toEqual('Test Page (Changed)')
    expect(mergedData._numberOfRequests).toEqual(0)
  })

  it('— arrays - can clear all rows', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
      arrayOfRelationships: [
        {
          id: '123',
          relationshipInArrayMonoHasOne: testPost.id,
        },
      ],
    }

    const mergedData = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        arrayOfRelationships: [],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(mergedData.arrayOfRelationships).toEqual([])
    expect(mergedData._numberOfRequests).toEqual(0)

    // do the same but with arrayOfRelationships: 0

    const mergedData2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        // @ts-expect-error eslint-disable-next-line
        arrayOfRelationships: 0, // this is how form state represents an empty array
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(mergedData2.arrayOfRelationships).toEqual([])
    expect(mergedData2._numberOfRequests).toEqual(0)
  })

  it('— uploads - adds and removes media', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    // Add upload
    const mergedData = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        hero: {
          type: 'highImpact',
          media: media.id,
        },
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(mergedData.hero.media).toMatchObject(media)
    expect(mergedData._numberOfRequests).toEqual(1)

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
      collectionPopulationRequestHandler,
    })

    expect(mergedDataWithoutUpload.hero.media).toBeFalsy()
  })

  it('— uploads - populates within Slate rich text editor', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    // Add upload
    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        richTextSlate: [
          {
            type: 'upload',
            relationTo: 'media',
            value: media.id,
          },
        ],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1.richTextSlate).toHaveLength(1)
    expect(merge1.richTextSlate[0].value).toMatchObject(media)
    expect(merge1._numberOfRequests).toEqual(1)

    // Remove upload
    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...merge1,
        richTextSlate: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Hello, world!',
              },
            ],
          },
        ],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge2.richTextSlate).toHaveLength(1)
    expect(merge2.richTextSlate[0].value).toBeFalsy()
    expect(merge2.richTextSlate[0].type).toEqual('paragraph')
    expect(merge2._numberOfRequests).toEqual(0)
  })

  it('— uploads - populates within Lexical rich text editor', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    // Add upload
    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        richTextLexical: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Hello, world!',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
              {
                format: '',
                type: 'upload',
                relationTo: 'media',
                version: 1,
                value: media.id,
              },
            ],
            direction: 'ltr',
          },
        },
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1.richTextLexical.root.children).toHaveLength(2)
    expect(merge1.richTextLexical.root.children[1].value).toMatchObject(media)
    expect(merge1._numberOfRequests).toEqual(1)

    // Remove upload
    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...merge1,
        richTextLexical: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Hello, world!',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
          },
        },
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge2.richTextLexical.root.children).toHaveLength(1)
    expect(merge2.richTextLexical.root.children[0].value).toBeFalsy()
    expect(merge2.richTextLexical.root.children[0].type).toEqual('paragraph')
  })

  it('— relationships - populates monomorphic has one relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        relationshipMonoHasOne: testPost.id,
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1._numberOfRequests).toEqual(1)
    expect(merge1.relationshipMonoHasOne).toMatchObject(testPost)
  })

  it('— relationships - populates monomorphic has many relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        relationshipMonoHasMany: [testPost.id],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1._numberOfRequests).toEqual(1)
    expect(merge1.relationshipMonoHasMany).toMatchObject([testPost])
  })

  it('— relationships - populates polymorphic has one relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        relationshipPolyHasOne: { value: testPost.id, relationTo: postsSlug },
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1._numberOfRequests).toEqual(1)
    expect(merge1.relationshipPolyHasOne).toMatchObject({
      value: testPost,
      relationTo: postsSlug,
    })
  })

  it('— relationships - populates polymorphic has many relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        relationshipPolyHasMany: [{ value: testPost.id, relationTo: postsSlug }],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1._numberOfRequests).toEqual(1)
    expect(merge1.relationshipPolyHasMany).toMatchObject([
      { value: testPost, relationTo: postsSlug },
    ])
  })

  it('— relationships - can clear relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
      relationshipMonoHasOne: testPost.id,
      relationshipMonoHasMany: [testPost.id],
      relationshipPolyHasOne: { value: testPost.id, relationTo: postsSlug },
      relationshipPolyHasMany: [{ value: testPost.id, relationTo: postsSlug }],
    }

    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        relationshipMonoHasOne: null,
        relationshipMonoHasMany: [],
        relationshipPolyHasOne: null,
        relationshipPolyHasMany: [],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge2._numberOfRequests).toEqual(0)
    expect(merge2.relationshipMonoHasOne).toBeFalsy()
    expect(merge2.relationshipMonoHasMany).toEqual([])
    expect(merge2.relationshipPolyHasOne).toBeFalsy()
    expect(merge2.relationshipPolyHasMany).toEqual([])
  })

  it('— relationships - populates within tabs', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        tab: {
          relationshipInTab: testPost.id,
        },
      },
      initialData,
      serverURL,
      collectionPopulationRequestHandler,
    })

    expect(merge1.tab.relationshipInTab).toMatchObject(testPost)
  })

  it('— relationships - populates within arrays', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        arrayOfRelationships: [
          {
            id: '123',
            relationshipInArrayMonoHasOne: testPost.id,
            relationshipInArrayMonoHasMany: [testPost.id],
            relationshipInArrayPolyHasOne: {
              value: testPost.id,
              relationTo: postsSlug,
            },
            relationshipInArrayPolyHasMany: [
              {
                value: testPost.id,
                relationTo: postsSlug,
              },
            ],
          },
        ],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1._numberOfRequests).toEqual(1)
    expect(merge1.arrayOfRelationships).toHaveLength(1)
    expect(merge1.arrayOfRelationships).toMatchObject([
      {
        id: '123',
        relationshipInArrayMonoHasOne: testPost,
        relationshipInArrayMonoHasMany: [testPost],
        relationshipInArrayPolyHasOne: {
          value: testPost,
          relationTo: postsSlug,
        },
        relationshipInArrayPolyHasMany: [
          {
            value: testPost,
            relationTo: postsSlug,
          },
        ],
      },
    ])

    // Add a new block before the populated one, then check to see that the relationship is still populated
    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...merge1,
        arrayOfRelationships: [
          {
            id: '456',
            relationshipInArrayMonoHasOne: undefined,
            relationshipInArrayMonoHasMany: [],
            relationshipInArrayPolyHasOne: undefined,
            relationshipInArrayPolyHasMany: [],
          },
          {
            id: '123',
            relationshipInArrayMonoHasOne: testPost.id,
            relationshipInArrayMonoHasMany: [testPost.id],
            relationshipInArrayPolyHasOne: {
              value: testPost.id,
              relationTo: postsSlug,
            },
            relationshipInArrayPolyHasMany: [
              {
                value: testPost.id,
                relationTo: postsSlug,
              },
            ],
          },
        ],
      },
      initialData: merge1,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge2._numberOfRequests).toEqual(1)
    expect(merge2.arrayOfRelationships).toHaveLength(2)
    expect(merge2.arrayOfRelationships).toMatchObject([
      {
        id: '456',
      },
      {
        id: '123',
        relationshipInArrayMonoHasOne: testPost,
        relationshipInArrayMonoHasMany: [testPost],
        relationshipInArrayPolyHasOne: {
          value: testPost,
          relationTo: postsSlug,
        },
        relationshipInArrayPolyHasMany: [
          {
            value: testPost,
            relationTo: postsSlug,
          },
        ],
      },
    ])
  })

  it('— relationships - populates within Slate rich text editor', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    // Add a relationship and an upload
    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        richTextSlate: [
          {
            children: [
              {
                text: ' ',
              },
            ],
            relationTo: postsSlug,
            type: 'relationship',
            value: {
              id: testPost.id,
            },
          },
          {
            type: 'paragraph',
            children: [
              {
                text: '',
              },
            ],
          },
          {
            children: [
              {
                text: '',
              },
            ],
            relationTo: 'media',
            type: 'upload',
            value: {
              id: media.id,
            },
          },
        ],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1._numberOfRequests).toEqual(2)
    expect(merge1.richTextSlate).toHaveLength(3)
    expect(merge1.richTextSlate[0].type).toEqual('relationship')
    expect(merge1.richTextSlate[0].value).toMatchObject(testPost)
    expect(merge1.richTextSlate[1].type).toEqual('paragraph')
    expect(merge1.richTextSlate[2].type).toEqual('upload')
    expect(merge1.richTextSlate[2].value).toMatchObject(media)

    // Add a new node between the relationship and the upload
    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...merge1,
        richTextSlate: [
          {
            children: [
              {
                text: ' ',
              },
            ],
            relationTo: postsSlug,
            type: 'relationship',
            value: {
              id: testPost.id,
            },
          },
          {
            type: 'paragraph',
            children: [
              {
                text: '',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                text: '',
              },
            ],
          },
          {
            children: [
              {
                text: '',
              },
            ],
            relationTo: 'media',
            type: 'upload',
            value: {
              id: media.id,
            },
          },
        ],
      },
      initialData: merge1,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge2._numberOfRequests).toEqual(1)
    expect(merge2.richTextSlate).toHaveLength(4)
    expect(merge2.richTextSlate[0].type).toEqual('relationship')
    expect(merge2.richTextSlate[0].value).toMatchObject(testPost)
    expect(merge2.richTextSlate[1].type).toEqual('paragraph')
    expect(merge2.richTextSlate[2].type).toEqual('paragraph')
    expect(merge2.richTextSlate[3].type).toEqual('upload')
    expect(merge2.richTextSlate[3].value).toMatchObject(media)
  })

  it('— relationships - populates within Lexical rich text editor', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    // Add a relationship
    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        richTextLexical: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                format: '',
                type: 'relationship',
                version: 1,
                relationTo: postsSlug,
                value: {
                  id: testPost.id,
                },
              },
              {
                children: [],
                direction: null,
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
              {
                format: '',
                type: 'upload',
                version: 1,
                fields: null,
                relationTo: 'media',
                value: {
                  id: media.id,
                },
              },
            ],
            direction: null,
          },
        },
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1._numberOfRequests).toEqual(2)
    expect(merge1.richTextLexical.root.children).toHaveLength(3)
    expect(merge1.richTextLexical.root.children[0].type).toEqual('relationship')
    expect(merge1.richTextLexical.root.children[0].value).toMatchObject(testPost)
    expect(merge1.richTextLexical.root.children[1].type).toEqual('paragraph')
    expect(merge1.richTextLexical.root.children[2].type).toEqual('upload')
    expect(merge1.richTextLexical.root.children[2].value).toMatchObject(media)

    // Add a node before the populated one
    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...merge1,
        richTextLexical: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                format: '',
                type: 'relationship',
                version: 1,
                relationTo: postsSlug,
                value: {
                  id: testPost.id,
                },
              },
              {
                children: [],
                direction: null,
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
              {
                children: [],
                direction: null,
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
              {
                format: '',
                type: 'upload',
                version: 1,
                fields: null,
                relationTo: 'media',
                value: {
                  id: media.id,
                },
              },
            ],
            direction: null,
          },
        },
      },
      initialData: merge1,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge2._numberOfRequests).toEqual(1)
    expect(merge2.richTextLexical.root.children).toHaveLength(4)
    expect(merge2.richTextLexical.root.children[0].type).toEqual('relationship')
    expect(merge2.richTextLexical.root.children[0].value).toMatchObject(testPost)
    expect(merge2.richTextLexical.root.children[1].type).toEqual('paragraph')
    expect(merge2.richTextLexical.root.children[2].type).toEqual('paragraph')
    expect(merge2.richTextLexical.root.children[3].type).toEqual('upload')
    expect(merge2.richTextLexical.root.children[3].value).toMatchObject(media)
  })

  it('— relationships - does not re-populate existing rich text relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
      richTextSlate: [
        {
          type: 'paragraph',
          text: 'Paragraph 1',
        },
        {
          type: 'reference',
          reference: {
            relationTo: postsSlug,
            value: testPost,
          },
        },
      ],
    }

    // Make a change to the text
    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        richTextSlate: [
          {
            type: 'paragraph',
            text: 'Paragraph 1 (Updated)',
          },
          {
            type: 'reference',
            reference: {
              relationTo: postsSlug,
              value: testPost.id,
            },
          },
        ],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1._numberOfRequests).toEqual(0)
    expect(merge1.richTextSlate).toHaveLength(2)
    expect(merge1.richTextSlate[0].text).toEqual('Paragraph 1 (Updated)')
    expect(merge1.richTextSlate[1].reference.value).toMatchObject(testPost)
  })

  it('— relationships - populates within blocks', async () => {
    const block1 = (shallow?: boolean): Extract<Page['layout'][0], { blockType: 'cta' }> => ({
      blockType: 'cta',
      id: '123',
      links: [
        {
          link: {
            label: 'Link 1',
            type: 'reference',
            reference: {
              relationTo: postsSlug,
              value: shallow ? testPost?.id : testPost,
            },
          },
        },
      ],
    })

    const block2: Extract<Page['layout'][0], { blockType: 'content' }> = {
      blockType: 'content',
      id: '456',
      columns: [
        {
          id: '789',
          richText: [
            {
              type: 'paragraph',
              text: 'Column 1',
            },
          ],
        },
      ],
    }

    const initialData: Partial<Page> = {
      title: 'Test Page',
      layout: [block1(), block2],
    }

    // Add a new block before the populated one
    // Then check to see that the relationship is still populated
    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        layout: [block2, block1(true)],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    // Check that the relationship on the first has been removed
    // And that the relationship on the second has been populated
    expect(merge2.layout[0].links).toBeUndefined()
    expect(merge2.layout[1].links[0].link.reference.value).toMatchObject(testPost)
    expect(merge2._numberOfRequests).toEqual(1)
  })

  it('— relationships - re-populates externally updated relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    // Populate the relationships
    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        title: 'Test Page',
        relationshipMonoHasOne: testPost.id,
        relationshipMonoHasMany: [testPost.id],
        relationshipPolyHasOne: { value: testPost.id, relationTo: postsSlug },
        relationshipPolyHasMany: [{ value: testPost.id, relationTo: postsSlug }],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge1._numberOfRequests).toEqual(1)
    expect(merge1.relationshipMonoHasOne).toMatchObject(testPost)
    expect(merge1.relationshipMonoHasMany).toMatchObject([testPost])

    expect(merge1.relationshipPolyHasOne).toMatchObject({
      value: testPost,
      relationTo: postsSlug,
    })

    expect(merge1.relationshipPolyHasMany).toMatchObject([
      { value: testPost, relationTo: postsSlug },
    ])

    // Update the test post
    const updatedTestPost = await payload.update({
      collection: postsSlug,
      id: testPost.id,
      data: {
        title: 'Test Post (Recently Updated)',
      },
    })

    const externallyUpdatedRelationship = {
      id: updatedTestPost.id,
      entitySlug: postsSlug,
      updatedAt: updatedTestPost.updatedAt,
    }

    // Merge again using the `externallyUpdatedRelationship` argument
    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        title: 'Test Page',
        relationshipMonoHasOne: testPost.id,
        relationshipMonoHasMany: [testPost.id],
        relationshipPolyHasOne: { value: testPost.id, relationTo: postsSlug },
        relationshipPolyHasMany: [{ value: testPost.id, relationTo: postsSlug }],
      },
      initialData: merge1,
      externallyUpdatedRelationship,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    expect(merge2._numberOfRequests).toEqual(1)
    expect(merge2.relationshipMonoHasOne).toMatchObject(updatedTestPost)
    expect(merge2.relationshipMonoHasMany).toMatchObject([updatedTestPost])

    expect(merge2.relationshipPolyHasOne).toMatchObject({
      value: updatedTestPost,
      relationTo: postsSlug,
    })

    expect(merge2.relationshipPolyHasMany).toMatchObject([
      { value: updatedTestPost, relationTo: postsSlug },
    ])
  })

  it('— relationships - populates localized relationships', async () => {
    const post = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Test Post',
        slug: 'test-post',
        hero: {
          type: 'highImpact',
          media: media.id,
        },
        localizedTitle: 'Test Post Spanish',
      },
      locale: 'es',
    })

    await payload.update({
      id: post.id,
      locale: 'en',
      collection: postsSlug,
      data: {
        localizedTitle: 'Test Post English',
      },
    })

    const initialData: Partial<Page> = {
      title: 'Test Page',
      relationToLocalized: post.id,
    }

    // Populate the relationships
    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        relationToLocalized: post.id,
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
      locale: 'es',
    })

    expect(merge1._numberOfRequests).toEqual(1)
    expect(merge1.relationToLocalized).toHaveProperty('localizedTitle', 'Test Post Spanish')
  })

  it('— rich text - merges text changes', async () => {
    // Add a relationship
    const merge1 = await traverseRichText({
      incomingData: [
        {
          type: 'paragraph',
          children: [
            {
              text: 'Paragraph 1',
            },
          ],
        },
      ],
      result: [],
      populationsByCollection: {},
    })

    expect(merge1).toHaveLength(1)
    expect(merge1[0].children[0].text).toEqual('Paragraph 1')

    // Update the rich text
    const merge2 = await traverseRichText({
      incomingData: [
        {
          type: 'paragraph',
          children: [
            {
              text: 'Paragraph 1 (Updated)',
            },
          ],
        },
      ],
      populationsByCollection: {},
      result: merge1,
    })

    expect(merge2).toHaveLength(1)
    expect(merge2[0].children[0].text).toEqual('Paragraph 1 (Updated)')
  })

  it('— rich text - can reset heading type', async () => {
    // Add a heading with an H1 type
    const merge1 = await traverseRichText({
      incomingData: [
        {
          type: 'h1',
          children: [
            {
              text: 'Heading',
            },
          ],
        },
      ],
      populationsByCollection: {},
      result: [],
    })

    expect(merge1).toHaveLength(1)
    expect(merge1[0].type).toEqual('h1')

    // Update the rich text to remove the heading type
    const merge2 = await traverseRichText({
      incomingData: [
        {
          children: [
            {
              text: 'Heading',
            },
          ],
        },
      ],
      populationsByCollection: {},
      result: merge1,
    })

    expect(merge2).toHaveLength(1)
    expect(merge2[0].type).toBeUndefined()
  })

  it('— blocks - adds, reorders, and removes blocks', async () => {
    const block1ID = '123'
    const block2ID = '456'

    const initialData: Partial<Page> = {
      title: 'Test Page',
      layout: [
        {
          blockType: 'cta',
          id: block1ID,
          richText: [
            {
              type: 'paragraph',
              text: 'Block 1 (Position 1)',
            },
          ],
        },
        {
          blockType: 'cta',
          id: block2ID,
          richText: [
            {
              type: 'paragraph',
              text: 'Block 2 (Position 2)',
            },
          ],
        },
      ],
    }

    // Reorder the blocks
    const merge1 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        layout: [
          {
            blockType: 'cta',
            id: block2ID,
            richText: [
              {
                type: 'paragraph',
                text: 'Block 2 (Position 1)',
              },
            ],
          },
          {
            blockType: 'cta',
            id: block1ID,
            richText: [
              {
                type: 'paragraph',
                text: 'Block 1 (Position 2)',
              },
            ],
          },
        ],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    // Check that the blocks have been reordered
    expect(merge1.layout).toHaveLength(2)
    expect(merge1.layout[0].id).toEqual(block2ID)
    expect(merge1.layout[1].id).toEqual(block1ID)
    expect(merge1.layout[0].richText[0].text).toEqual('Block 2 (Position 1)')
    expect(merge1.layout[1].richText[0].text).toEqual('Block 1 (Position 2)')
    expect(merge1._numberOfRequests).toEqual(0)

    // Remove a block
    const merge2 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        layout: [
          {
            blockType: 'cta',
            id: block2ID,
            richText: [
              {
                type: 'paragraph',
                text: 'Block 2 (Position 1)',
              },
            ],
          },
        ],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    // Check that the block has been removed
    expect(merge2.layout).toHaveLength(1)
    expect(merge2.layout[0].id).toEqual(block2ID)
    expect(merge2.layout[0].richText[0].text).toEqual('Block 2 (Position 1)')
    expect(merge2._numberOfRequests).toEqual(0)

    // Remove the last block to ensure that all blocks can be cleared
    const merge3 = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        layout: [],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler,
    })

    // Check that the block has been removed
    expect(merge3.layout).toHaveLength(0)
    expect(merge3._numberOfRequests).toEqual(0)
  })

  it('properly encodes URLs in requests', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    let capturedEndpoint: string | undefined

    const customRequestHandler = async ({ apiPath, endpoint, serverURL }) => {
      capturedEndpoint = `${serverURL}${apiPath}/${endpoint}`

      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => ({
          docs: [
            {
              id: testPost.id,
              slug: 'post-1',
              tenant: { id: 'tenant-id', title: 'Tenant 1' },
              title: 'Test Post',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: testPostTwo.id,
              slug: 'post-2',
              tenant: { id: 'tenant-id', title: 'Tenant 1' },
              title: 'Test Post 2',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      }

      return Promise.resolve(mockResponse as unknown as Response)
    }

    const mergedData = await mergeData({
      depth: 1,
      fieldSchema: schemaJSON,
      incomingData: {
        ...initialData,
        relationshipPolyHasMany: [
          { value: testPost.id, relationTo: postsSlug },
          { value: testPostTwo.id, relationTo: postsSlug },
        ],
      },
      initialData,
      serverURL,
      returnNumberOfRequests: true,
      collectionPopulationRequestHandler: customRequestHandler,
    })

    expect(mergedData.relationshipPolyHasMany).toMatchObject([
      {
        value: {
          id: testPost.id,
          slug: 'post-1',
          title: 'Test Post',
        },
        relationTo: postsSlug,
      },
      {
        value: {
          id: testPostTwo.id,
          slug: 'post-2',
          title: 'Test Post 2',
        },
        relationTo: postsSlug,
      },
    ])

    // Verify that the request was made to the properly encoded URL
    // Without encodeURI wrapper the request URL - would receive string: "undefined/api/posts?depth=1&where[id][in]=66ba7ab6a60a945d10c8b976,66ba7ab6a60a945d10c8b979
    expect(capturedEndpoint).toContain(
      encodeURI(`posts?depth=1&where[id][in]=${testPost.id},${testPostTwo.id}`),
    )
  })
})
