import path from 'path'
import { APIError, NotFound, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Menu, Page, Post } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { pagesSlug } from './collections/Pages/index.js'
import { postsSlug } from './collections/Posts/index.js'
import { menuSlug } from './globals/Menu/index.js'

const lockedDocumentCollection = 'payload-locked-documents'

let payload: Payload
let token: string
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Locked documents', () => {
  let post: Post
  let page: Page
  let menu: Menu
  let user: any
  let user2: any

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    user = loginResult.user
    token = loginResult.token

    user2 = await payload.create({
      collection: 'users',
      data: {
        email: 'test@payloadcms.com',
        password: 'test',
      },
    })

    post = await payload.create({
      collection: postsSlug,
      data: {
        text: 'some post',
      },
    })

    page = await payload.create({
      collection: pagesSlug,
      data: {
        text: 'some page',
      },
    })

    menu = await payload.updateGlobal({
      slug: menuSlug,
      data: {
        globalText: 'global text',
      },
    })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should update unlocked document - collection', async () => {
    const updatedPost = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post',
      },
      id: post.id,
    })

    expect(updatedPost.text).toEqual('updated post')
  })

  it('should update unlocked document - global', async () => {
    const updatedGlobalMenu = await payload.updateGlobal({
      slug: menuSlug,
      data: {
        globalText: 'updated global text',
      },
    })

    expect(updatedGlobalMenu.globalText).toEqual('updated global text')
  })

  it('should delete unlocked document - collection', async () => {
    const { docs } = await payload.find({
      collection: postsSlug,
      depth: 0,
    })

    expect(docs).toHaveLength(2)

    await payload.delete({
      collection: postsSlug,
      id: post.id,
    })

    const { docs: deletedResults } = await payload.find({
      collection: postsSlug,
      depth: 0,
    })

    expect(deletedResults).toHaveLength(1)
  })

  it('should allow update of stale locked document - collection', async () => {
    const newPost2 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 2',
      },
    })

    // Subtract 3.5 minutes (210 seconds) from the current time
    const pastEditedAt = new Date()
    pastEditedAt.setMinutes(pastEditedAt.getMinutes() - 3)
    pastEditedAt.setSeconds(pastEditedAt.getSeconds() - 30)

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        editedAt: pastEditedAt.toISOString(),
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost2.id,
        },
        globalSlug: undefined,
      },
    })

    const updateLockedDoc = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post 2',
      },
      id: newPost2.id,
    })

    // Should allow update since editedAt date is past expiration duration.
    // Therefore the document is considered stale
    expect(updateLockedDoc.text).toEqual('updated post 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow update of stale locked document - global', async () => {
    // Subtract 5.5 minutes (330 seconds) from the current time
    const pastEditedAt = new Date()
    pastEditedAt.setMinutes(pastEditedAt.getMinutes() - 5)
    pastEditedAt.setSeconds(pastEditedAt.getSeconds() - 30)

    // Give locking ownership to another user
    const lockedGlobalInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        editedAt: pastEditedAt.toISOString(), // stale date
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: undefined,
        globalSlug: menuSlug,
      },
    })

    const updateGlobalLockedDoc = await payload.updateGlobal({
      data: {
        globalText: 'global text 2',
      },
      slug: menuSlug,
    })

    // Should allow update since editedAt date is past expiration duration.
    // Therefore the document is considered stale
    expect(updateGlobalLockedDoc.globalText).toEqual('global text 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedGlobalInstance.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedGlobalInstance.id },
      },
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should not allow update of locked document - collection', async () => {
    const newPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'some post',
      },
    })

    // Give locking ownership to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: 'posts',
          value: newPost.id,
        },
        editedAt: new Date().toISOString(),
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
      },
    })

    try {
      await payload.update({
        collection: postsSlug,
        data: {
          text: 'updated post',
        },
        id: newPost.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      expect(error.message).toMatch(/currently locked by another user and cannot be updated/)
    }

    // Should not allow update - expect data not to change
    expect(newPost.text).toEqual('some post')
  })

  it('should not allow update of locked document - global', async () => {
    // Give locking ownership to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: undefined,
        editedAt: new Date().toISOString(),
        globalSlug: menuSlug,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
      },
    })

    try {
      await payload.updateGlobal({
        data: {
          globalText: 'updated global text',
        },
        slug: menuSlug,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      expect(error.message).toMatch(/currently locked by another user and cannot be updated/)
    }

    // Should not allow update - expect data not to change
    expect(menu.globalText).toEqual('global text')
  })

  // Try to delete locked document (collection)
  it('should not allow delete of locked document - collection', async () => {
    const newPost3 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 3',
      },
    })

    // Give locking ownership to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: 'posts',
          value: newPost3.id,
        },
        editedAt: new Date().toISOString(),
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
      },
    })

    try {
      await payload.delete({
        collection: postsSlug,
        id: newPost3.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      expect(error.message).toMatch(/currently locked and cannot be deleted/)
    }
  })

  it('should allow delete of stale locked document - collection', async () => {
    const newPost4 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 4',
      },
    })

    // Subtract 3.5 minutes (210 seconds) from the current time
    const pastEditedAt = new Date()
    pastEditedAt.setMinutes(pastEditedAt.getMinutes() - 3)
    pastEditedAt.setSeconds(pastEditedAt.getSeconds() - 30)

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        editedAt: pastEditedAt.toISOString(), // stale date
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost4.id,
        },
        globalSlug: undefined,
      },
    })

    await payload.delete({
      collection: postsSlug,
      id: newPost4.id,
    })

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost4.id },
      },
    })

    expect(findPostDocs.docs).toHaveLength(0)

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
    })

    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })
})
