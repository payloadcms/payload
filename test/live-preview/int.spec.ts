import type { Payload } from 'payload'

import {
  handleMessage as handleMessageImport,
  type LivePreviewMessageEvent,
  mergeData as mergeDataImport,
} from '@payloadcms/live-preview'
import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Media, Page, Post, Tenant } from './payload-types.js'

import { pagesSlug, postsSlug, tenantsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let restClient: NextRESTClient

import type { CollectionPopulationRequestHandler } from '../../packages/live-preview/src/types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

const requestHandler: CollectionPopulationRequestHandler = ({ data, postEndpoint }) => {
  const url = `/${postEndpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Payload-HTTP-Method-Override': 'GET',
  }

  return restClient.POST(url as any, {
    body: JSON.stringify(data),
    credentials: 'include',
    headers,
  })
}

describe('Collections - Live Preview', () => {
  const serverURL: string = 'http://localhost:3000'

  let testPost: Post
  let testPostTwo: Post
  let tenant: Tenant
  let media: Media
  let handleMessage: (
    args: Omit<Parameters<typeof handleMessageImport>[0], 'requestHandler' | 'serverURL'>,
  ) => Promise<Record<string, any>> = handleMessageImport as any

  let mergeData: (
    args: Omit<Parameters<typeof mergeDataImport<any>>[0], 'requestHandler' | 'serverURL'>,
  ) => Promise<Record<string, any>> = mergeDataImport as any

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    mergeData = async (args) => {
      return await mergeDataImport({
        ...args,
        serverURL,
        requestHandler,
      })
    }
    handleMessage = async (args) => {
      const newArgs: Parameters<typeof handleMessageImport>[0] = args as any
      newArgs.requestHandler = requestHandler
      newArgs.serverURL = serverURL

      if (newArgs.event) {
        // @ts-expect-error need to overwrite serverURL
        newArgs.event.origin = serverURL
      }

      return await handleMessageImport(newArgs)
    }

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
    const file = (await getFileByPath(filePath))!
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
    await payload.destroy()
  })

  it('handles `postMessage`', async () => {
    const handledMessage = await handleMessage({
      depth: 1,
      event: {
        data: {
          collectionSlug: postsSlug,
          data: {
            title: 'Test Page (Changed)',
          },
          type: 'payload-live-preview',
        },
      } as MessageEvent as LivePreviewMessageEvent<Page>,
      initialData: {
        title: 'Test Page',
        id: 1,
      } as Page,
    })

    expect(handledMessage.title).toEqual('Test Page (Changed)')
  })

  it('— strings - merges data', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const mergedData = await mergeData({
      depth: 1,
      incomingData: {
        ...initialData,
        title: 'Test Page (Changed)',
      },
      initialData,
    })

    expect(mergedData.title).toEqual('Test Page (Changed)')
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
      incomingData: {
        ...initialData,
        arrayOfRelationships: [],
      },
      initialData,
    })

    expect(mergedData.arrayOfRelationships).toEqual([])

    // do the same but with arrayOfRelationships: 0

    const mergedData2 = await mergeData({
      depth: 1,
      incomingData: {
        ...initialData,
        arrayOfRelationships: 0, // this is how form state represents an empty array
      },
      initialData,
    })

    expect(mergedData2.arrayOfRelationships).toEqual([])
  })

  it('— uploads - adds and removes media', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    // Add upload
    const mergedData = await mergeData({
      depth: 1,
      incomingData: {
        ...initialData,
        hero: {
          type: 'highImpact',
          media: media.id,
        },
      },
      initialData,
    })

    expect(mergedData.hero.media).toMatchObject(media)

    // Add upload
    const mergedDataWithoutUpload = await mergeData({
      depth: 1,
      incomingData: {
        ...mergedData,
        hero: {
          type: 'highImpact',
          media: null,
        },
      },
      initialData: mergedData,
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
    })

    expect(merge1.richTextSlate).toHaveLength(1)
    expect(merge1.richTextSlate[0].value).toMatchObject(media)

    // Remove upload
    const merge2 = await mergeData({
      depth: 1,
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
    })

    expect(merge2.richTextSlate).toHaveLength(1)
    expect(merge2.richTextSlate[0].value).toBeFalsy()
    expect(merge2.richTextSlate[0].type).toEqual('paragraph')
  })

  it('— uploads - populates within Lexical rich text editor', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    // Add upload
    const merge1 = await mergeData({
      depth: 1,
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
    })

    expect(merge1.richTextLexical.root.children).toHaveLength(2)
    expect(merge1.richTextLexical.root.children[1].value).toMatchObject(media)

    // Remove upload
    const merge2 = await mergeData({
      depth: 1,
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
      incomingData: {
        ...initialData,
        relationshipMonoHasOne: testPost.id,
      },
      initialData,
    })

    expect(merge1.relationshipMonoHasOne).toMatchObject(testPost)
  })

  it('— relationships - populates monomorphic has many relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const merge1 = await mergeData({
      depth: 1,
      incomingData: {
        ...initialData,
        relationshipMonoHasMany: [testPost.id],
      },
      initialData,
    })

    expect(merge1.relationshipMonoHasMany).toMatchObject([testPost])
  })

  it('— relationships - populates polymorphic has one relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const merge1 = await mergeData({
      depth: 1,
      incomingData: {
        ...initialData,
        relationshipPolyHasOne: { value: testPost.id, relationTo: postsSlug },
      },
      initialData,
    })

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
      incomingData: {
        ...initialData,
        relationshipPolyHasMany: [{ value: testPost.id, relationTo: postsSlug }],
      },
      initialData,
    })

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
      incomingData: {
        relationshipMonoHasOne: null,
        relationshipMonoHasMany: [],
        relationshipPolyHasOne: null,
        relationshipPolyHasMany: [],
      },
      initialData,
    })

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
      incomingData: {
        ...initialData,
        tab: {
          relationshipInTab: testPost.id,
        },
      },
      initialData,
    })

    expect(merge1.tab.relationshipInTab).toMatchObject(testPost)
  })

  it('— relationships - populates within arrays', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    const merge1 = await mergeData({
      depth: 1,
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
    })

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
    })

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
    })

    expect(merge1.richTextSlate).toHaveLength(3)
    expect(merge1.richTextSlate[0].type).toEqual('relationship')
    expect(merge1.richTextSlate[0].value).toMatchObject(testPost)
    expect(merge1.richTextSlate[1].type).toEqual('paragraph')
    expect(merge1.richTextSlate[2].type).toEqual('upload')
    expect(merge1.richTextSlate[2].value).toMatchObject(media)

    // Add a new node between the relationship and the upload
    const merge2 = await mergeData({
      depth: 1,
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
    })

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
    })

    expect(merge1.richTextLexical.root.children).toHaveLength(3)
    expect(merge1.richTextLexical.root.children[0].type).toEqual('relationship')
    expect(merge1.richTextLexical.root.children[0].value).toMatchObject(testPost)
    expect(merge1.richTextLexical.root.children[1].type).toEqual('paragraph')
    expect(merge1.richTextLexical.root.children[2].type).toEqual('upload')
    expect(merge1.richTextLexical.root.children[2].value).toMatchObject(media)

    // Add a node before the populated one
    const merge2 = await mergeData({
      depth: 1,
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
    })

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
    })

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
      incomingData: {
        ...initialData,
        layout: [block2, block1(true)],
      },
      initialData,
    })

    // Check that the relationship on the first has been removed
    // And that the relationship on the second has been populated
    expect(merge2.layout[0].links).toBeUndefined()
    expect(merge2.layout[1].links[0].link.reference.value).toMatchObject(testPost)
  })

  it('— relationships - re-populates externally updated relationships', async () => {
    const initialData: Partial<Page> = {
      title: 'Test Page',
    }

    // Populate the relationships
    const merge1 = await mergeData({
      depth: 1,
      incomingData: {
        title: 'Test Page',
        relationshipMonoHasOne: testPost.id,
        relationshipMonoHasMany: [testPost.id],
        relationshipPolyHasOne: { value: testPost.id, relationTo: postsSlug },
        relationshipPolyHasMany: [{ value: testPost.id, relationTo: postsSlug }],
      },
      initialData,
    })

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
      incomingData: {
        title: 'Test Page',
        relationshipMonoHasOne: testPost.id,
        relationshipMonoHasMany: [testPost.id],
        relationshipPolyHasOne: { value: testPost.id, relationTo: postsSlug },
        relationshipPolyHasMany: [{ value: testPost.id, relationTo: postsSlug }],
      },
      initialData: merge1,
    })

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

    const page = await payload.create({
      collection: pagesSlug,
      data: {
        title: 'Test Page',
        hero: { type: 'none' },
        slug: 'testpage',
      },
      locale: 'en',
    })

    const initialData: Partial<Page> = {
      ...page,
      relationToLocalized: post.id,
    }

    // Populate the relationships
    const merge1 = await mergeData({
      depth: 1,
      incomingData: {
        ...initialData,
        relationToLocalized: post.id,
      },
      initialData,
      locale: 'es',
      collectionSlug: pagesSlug,
    })

    expect(merge1.relationToLocalized).toHaveProperty('localizedTitle', 'Test Post Spanish')
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
    })

    // Check that the blocks have been reordered
    expect(merge1.layout).toHaveLength(2)
    expect(merge1.layout[0].id).toEqual(block2ID)
    expect(merge1.layout[1].id).toEqual(block1ID)
    expect(merge1.layout[0].richText[0].text).toEqual('Block 2 (Position 1)')
    expect(merge1.layout[1].richText[0].text).toEqual('Block 1 (Position 2)')

    // Remove a block
    const merge2 = await mergeData({
      depth: 1,
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
    })

    // Check that the block has been removed
    expect(merge2.layout).toHaveLength(1)
    expect(merge2.layout[0].id).toEqual(block2ID)
    expect(merge2.layout[0].richText[0].text).toEqual('Block 2 (Position 1)')

    // Remove the last block to ensure that all blocks can be cleared
    const merge3 = await mergeData({
      depth: 1,
      incomingData: {
        ...initialData,
        layout: [],
      },
      initialData,
    })

    // Check that the block has been removed
    expect(merge3.layout).toHaveLength(0)
  })
})
